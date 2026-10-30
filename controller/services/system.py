import os

from dotenv import load_dotenv

from services.controller_config import ControllerConfigService
from services.api import APIService
from services.controller_device import ControllerDevice
from services.cloudflared import CloudflaredService

from utils.try_except import try_except
from models.api import APIError

load_dotenv()

SERVER_URL = os.getenv("SERVER_URL")
API_USERNAME = os.getenv("API_USERNAME")
API_PASSWORD = os.getenv("API_PASSWORD")
CONTROLLER_STORE_FILE_NAME = "controller_metadata"

if SERVER_URL is None:
    raise Exception("SERVER_URL not defined in .env")

if API_USERNAME is None:
    raise Exception("API_USERNAME not defined in .env")

if API_PASSWORD is None:
    raise Exception("API_PASSWORD not defined in .env")

class SystemService:
    controller_config_service: ControllerConfigService
    api_service: APIService
    cloudflared_service: CloudflaredService
    controller_device: ControllerDevice

    def __init__(self, controller_config_service: ControllerConfigService, api_service: APIService, cloudflared_service: CloudflaredService, controller_device: ControllerDevice) -> None:
        self.controller_config_service = controller_config_service
        self.api_service = api_service
        self.cloudflared_service = cloudflared_service
        self.controller_device = controller_device
   
    async def config(self, user_id: str, access_token: str, controller_name: str):
        if self.controller_config_service.is_configured():
            return self.controller_config_service.get_controller_config()

        result = await try_except(self.api_service.init_controller(user_id, access_token, controller_name))

        if result.error is not None:
            raise APIError(message=str(result.error))

        print(result.data)

        if result.data and result.data.tunnel is None:
            raise APIError(message=str(result.error))
        
        tunnel = result.data.tunnel
        
        controller_config = result.data
        
        success = self.controller_config_service.save_controller_config(controller_config.model_dump())
        
        if success is False:
            raise APIError(message="Error while writing controller metadata to persistent store.")

        self.cloudflared_service.initialize_cloudflared_tunnel(tunnel.token)

        # controller_device_init_result = await try_except(self.controller_device.initialize())

        # if controller_device_init_result.error is not None:
        #     print(str(controller_device_init_result.error))
        #     # raise APIError(message=str(result.error))
        
        return controller_config
