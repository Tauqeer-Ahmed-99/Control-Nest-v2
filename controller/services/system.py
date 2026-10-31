from services.controller_config import ControllerConfigService
from services.api import APIService
from services.controller_device import ControllerDevice
from services.cloudflared import CloudflaredService
from models.api import APIError


class SystemService:
    def __init__(self, controller_config_service: ControllerConfigService, api_service: APIService, cloudflared_service: CloudflaredService, controller_device: ControllerDevice) -> None:
        self.controller_config_service = controller_config_service
        self.api_service = api_service
        self.cloudflared_service = cloudflared_service
        self.controller_device = controller_device

    async def config(self, api_key: str, access_token: str | None = None):
        # Always verify the supplied key, including when replacing a revoked key.
        saved = self.controller_config_service.get_controller_config()
        existing_id = saved.get("controllerDevice", {}).get("id")
        if existing_id and existing_id != api_key.removeprefix("cn_").split(".")[0]:
            raise APIError(message="This Pi belongs to another controller. Use its existing controller key.", status_code=409)
        config = await self.api_service.init_controller(api_key, access_token)
        private_config = {**config.model_dump(), "apiKey": api_key}
        if not self.controller_config_service.save_controller_config(private_config):
            raise APIError(message="Unable to save controller settings.")
        self.cloudflared_service.initialize_cloudflared_tunnel(config.tunnel.token)
        self.controller_device.initialize()
        return self.controller_config_service.public_config()
