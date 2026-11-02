import os
from typing import Any

import requests
from dotenv import load_dotenv
from pydantic import TypeAdapter

from models.api import APIResponse, APIError
from models.cotroller_init import ControllerInitResponse
from models.controller_device import ControllerDeviceResponse
from services.controller_config import ControllerConfigService
from services.observability import current_request_id

load_dotenv()
SERVER_URL = os.getenv("SERVER_URL")
if not SERVER_URL:
    raise RuntimeError("SERVER_URL is not defined in .env")


class APIService:
    base_url: str = SERVER_URL.rstrip("/")

    @staticmethod
    def request_headers(request_id: str | None = None, api_key: str | None = None) -> dict[str, str]:
        config = ControllerConfigService().get_controller_config()
        key = api_key or config.get("apiKey")
        if not key:
            raise APIError(message="Pair this controller with its API key first.", status_code=401)
        return {
            "Authorization": f"Bearer {key}",
            "X-Controller-Installation-ID": ControllerConfigService().installation_id(),
            "X-Request-ID": request_id or current_request_id(),
        }

    async def init_controller(self, api_key: str, access_token: str | None = None):
        try:
            result = requests.post(
                f"{self.base_url}/api/v1/controller-device/init",
                json={"installationId": ControllerConfigService().installation_id(), **({"accessToken": access_token} if access_token else {})},
                headers=self.request_headers(api_key=api_key), timeout=60,
            )
        except requests.RequestException:
            raise APIError(message="Cannot reach Control Nest. Check your internet connection.") from None
        response = TypeAdapter(APIResponse[ControllerInitResponse]).validate_python(result.json())
        if not result.ok or not response.success or response.data is None:
            raise APIError(message=response.message, status_code=result.status_code if not result.ok else 502)
        return response.data

    def get_controller_device_data(self, controller_device_id: str):
        result = requests.get(
            f"{self.base_url}/api/v1/controller-device",
            headers=self.request_headers(), timeout=15,
        )
        response = TypeAdapter(APIResponse[ControllerDeviceResponse]).validate_python(result.json())
        if not result.ok or not response.success or response.data is None:
            raise APIError(message=response.message, status_code=result.status_code if not result.ok else 502)
        return response.data

    def authorize_user(self, access_token: str) -> bool:
        return bool(self.authorize_membership(access_token))

    def authorize_membership(self, access_token: str) -> dict | None:
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/controller-device/access",
                json={"accessToken": access_token}, headers=self.request_headers(), timeout=10,
            )
            result = response.json()
            return result.get("data") if response.ok and result.get("success") is True else None
        except (requests.RequestException, ValueError, APIError):
            return None

    async def create_device_control_log(self, controller_device_id: str, device_id: str, status_from: bool, status_to: bool, user_id: str | None = None):
        try:
            requests.post(
                f"{self.base_url}/api/v1/controller-device/device-control-logs",
                json={"controllerDeviceId": controller_device_id, "deviceId": device_id, "statusFrom": status_from, "statusTo": status_to, "userId": user_id},
                headers=self.request_headers(), timeout=10,
            )
        except (requests.RequestException, APIError):
            pass

    def push_observability_event(self, event: dict[str, Any]) -> None:
        if not ControllerConfigService().get_controller_config().get("apiKey"):
            return
        request_id = str(event.get("requestId") or current_request_id())
        for attempt in range(3):
            try:
                response = requests.post(
                    f"{self.base_url}/api/v1/observability/events",
                    json=event, headers=self.request_headers(request_id), timeout=3,
                )
                if response.ok or response.status_code in (401, 403):
                    return
            except requests.RequestException:
                pass
            if attempt < 2:
                import time
                time.sleep(0.2 * (attempt + 1))
