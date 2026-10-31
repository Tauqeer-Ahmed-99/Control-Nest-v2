"""Dependency-free tests using the real persistence/provisioning services.

Hardware, HTTP, and provider adapters are replaced; no GPIO or cloud changes occur.
"""
import asyncio
import importlib
import json
import os
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class APIError(Exception):
    def __init__(self, *, message, status_code=500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def module(name, **values):
    result = types.ModuleType(name)
    result.__dict__.update(values)
    return result


class ProvisioningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ.setdefault("APP_PERSISTENT_STORAGE_PATH", tempfile.gettempdir())
        os.environ.setdefault("SERVER_URL", "https://control.test")
        cls.requests = module("requests", RequestException=ConnectionError, post=Mock(), get=Mock())
        adapters = {
            "dotenv": module("dotenv", load_dotenv=lambda: None),
            "requests": cls.requests,
            "pydantic": module("pydantic", TypeAdapter=object),
            "models.api": module("models.api", APIResponse=object, APIError=APIError),
            "models.cotroller_init": module("models.cotroller_init", ControllerInitResponse=object),
            "models.controller_device": module("models.controller_device", ControllerDeviceResponse=object),
            "services.observability": module("services.observability", current_request_id=lambda: "request-id"),
            "services.controller_device": module("services.controller_device", ControllerDevice=object),
            "services.cloudflared": module("services.cloudflared", CloudflaredService=object),
        }
        cls.adapters = patch.dict(sys.modules, adapters)
        cls.adapters.start()
        cls.store = importlib.import_module("services.json_store")
        cls.config_module = importlib.import_module("services.controller_config")
        cls.api_module = importlib.import_module("services.api")
        cls.system_module = importlib.import_module("services.system")

    @classmethod
    def tearDownClass(cls):
        cls.adapters.stop()

    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path_patch = patch.object(self.store, "STORE_BASE_PATH", self.directory.name)
        self.path_patch.start()
        self.addCleanup(self.path_patch.stop)
        self.config = self.config_module.ControllerConfigService()
        self.private = {
            "house": {"id": "house-a", "name": "Home"},
            "controllerDevice": {"id": "controller-a", "houseId": "house-a", "name": "Ground floor"},
            "tunnel": {"hostname": "pi.test", "token": "private-tunnel-token"},
            "apiKey": "cn_controller-a.private-api-key",
        }

    def test_identity_and_credentials_survive_new_service_instances(self):
        identity = self.config.installation_id()
        self.assertTrue(self.config.save_controller_config(self.private))
        restarted = self.config_module.ControllerConfigService()
        self.assertEqual(restarted.installation_id(), identity)
        headers = self.api_module.APIService.request_headers()
        self.assertEqual(headers["Authorization"], "Bearer cn_controller-a.private-api-key")
        self.assertEqual(headers["X-Controller-Installation-ID"], identity)
        self.assertEqual(json.loads((Path(self.directory.name) / "controller_metadata.json").read_text())["apiKey"], self.private["apiKey"])
        if os.name != "nt":
            self.assertEqual((Path(self.directory.name) / "controller_metadata.json").stat().st_mode & 0o777, 0o600)

    def test_public_config_excludes_key_and_tunnel_token(self):
        self.config.save_controller_config(self.private)
        public = self.config.public_config()
        self.assertEqual(public["tunnel"], {"hostname": "pi.test"})
        self.assertNotIn("apiKey", public)
        self.assertNotIn("private", json.dumps(public))

    def test_key_rotation_is_used_on_the_next_request(self):
        self.config.save_controller_config(self.private)
        self.assertIn("private-api-key", self.api_module.APIService.request_headers()["Authorization"])
        self.private["apiKey"] = "replacement-key"
        self.config.save_controller_config(self.private)
        self.assertEqual(self.api_module.APIService.request_headers()["Authorization"], "Bearer replacement-key")

    def test_missing_key_and_denied_user_access_fail_closed(self):
        with self.assertRaises(APIError):
            self.api_module.APIService.request_headers()
        self.config.save_controller_config(self.private)
        self.requests.post.return_value = types.SimpleNamespace(ok=False)
        self.assertFalse(self.api_module.APIService().authorize_user("foreign-user-token"))
        sent = self.requests.post.call_args.kwargs
        self.assertEqual(sent["headers"]["Authorization"], "Bearer cn_controller-a.private-api-key")
        self.assertEqual(sent["json"]["accessToken"], "foreign-user-token")

    def test_setup_persists_key_and_returns_only_public_data(self):
        config_data = {key: value for key, value in self.private.items() if key != "apiKey"}

        class FakeAPI:
            async def init_controller(self, key, token):
                return types.SimpleNamespace(model_dump=lambda: config_data, tunnel=types.SimpleNamespace(token="private-tunnel-token"))

        cloud = types.SimpleNamespace(initialize_cloudflared_tunnel=Mock())
        hardware = types.SimpleNamespace(initialize=Mock())
        service = self.system_module.SystemService(self.config, FakeAPI(), cloud, hardware)
        public = asyncio.run(service.config(self.private["apiKey"], "clerk-token"))
        self.assertEqual(self.config.get_controller_config()["apiKey"], self.private["apiKey"])
        self.assertNotIn("apiKey", public)
        self.assertNotIn("token", public["tunnel"])
        cloud.initialize_cloudflared_tunnel.assert_called_once()
        hardware.initialize.assert_called_once()

    def test_setup_refuses_to_overwrite_another_controller(self):
        self.config.save_controller_config(self.private)
        api = types.SimpleNamespace(init_controller=Mock())
        service = self.system_module.SystemService(self.config, api, object(), object())
        with self.assertRaises(APIError):
            asyncio.run(service.config("cn_controller-b.other-key"))
        api.init_controller.assert_not_called()
        self.assertEqual(self.config.get_controller_config(), self.private)


if __name__ == "__main__":
    unittest.main()
