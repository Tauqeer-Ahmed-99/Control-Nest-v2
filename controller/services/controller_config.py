from typing import Any, Literal

from services.json_store import JsonStore

CONTROLLER_STORE_FILE_NAME = "controller_metadata"

class ControllerConfigService:
    controller_config: dict[str, Any] = {}
    controller_device_id: str | None = None
    tunnel_hostname: str | None = None
    # is_configured: bool = False

    def __init__(self) -> None:
        # self.controller_config = JsonStore.read_file(CONTROLLER_STORE_FILE_NAME)

        # controller_device = self.controller_config.get("controllerDevice")
        # tunnel = self.controller_config.get("tunnel")

        # if controller_device is not None and tunnel is not None:
        #     self.controller_device_id = controller_device.get("id")
        #     self.tunnel_hostname = tunnel.get("hostname")

        #     if self.controller_device_id is not None and self.tunnel_hostname is not None:
        #         self.is_configured = True 
        pass

    def is_configured(self) -> bool:
        self.controller_config = JsonStore.read_file(CONTROLLER_STORE_FILE_NAME)
        controller_device = self.controller_config.get("controllerDevice")
        tunnel = self.controller_config.get("tunnel")

        if controller_device is not None and tunnel is not None:
            self.controller_device_id = controller_device.get("id")
            self.tunnel_hostname = tunnel.get("hostname")

            return self.controller_device_id is not None and self.tunnel_hostname is not None

        return False

    def get(self, config_type: Literal["house", "controllerDevice", "tunnel"], config_name: str):
        self.controller_config = JsonStore.read_file(CONTROLLER_STORE_FILE_NAME)
        data = self.controller_config.get(config_type)

        if data is not None:
            return data.get(config_name)

        return None

    def get_controller_config(self):
        return JsonStore.read_file(CONTROLLER_STORE_FILE_NAME)

    def get_controller_device_name(self):
        controller_name = self.get("controllerDevice", "name")
        
        if controller_name is not None:
            return controller_name

        return "AutoPi-Hub v1"

    def save_controller_config(self, content: dict) -> bool:
        return JsonStore.write_file(CONTROLLER_STORE_FILE_NAME, content)