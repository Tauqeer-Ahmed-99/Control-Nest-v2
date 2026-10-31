import os
import json
from typing import Any

from pydantic import TypeAdapter
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

from utils.try_except import try_except
from models.api import APIResponse, APIError
from models.cotroller_init import ControllerInitResponse
from models.controller_device import ControllerDeviceResponse
from services.observability import current_request_id

load_dotenv()

SERVER_URL = os.getenv("SERVER_URL")
API_USERNAME = os.getenv("API_USERNAME")
API_PASSWORD = os.getenv("API_PASSWORD")

SERVER_URL = os.getenv("SERVER_URL")

if SERVER_URL is None:
    raise Exception("SERVER_URL is not defined in .env")

if API_USERNAME is None:
    raise Exception("API_USERNAME is not defined in .env")

if API_PASSWORD is None:
    raise Exception("API_PASSWORD is not defined in .env")

class APIService:
    base_url: str = SERVER_URL
    basic_auth: HTTPBasicAuth = HTTPBasicAuth(username=f"{API_USERNAME}",password=f"{API_PASSWORD}")

    @staticmethod
    def request_headers(request_id: str | None = None) -> dict[str, str]:
        return {"X-Request-ID": request_id or current_request_id()}
    
    async def init_controller(self, user_id: str, access_token: str, controller_name: str):
        result = await try_except(
            requests.post(
                f"{self.base_url}/api/v1/controller-device/init",
                data=json.dumps({"userId": user_id, "accessToken": access_token, "controllerName": controller_name}),
                auth=self.basic_auth,
                headers=self.request_headers(),
            )
        )

        if result.error is not None:
            raise APIError(message=str(result.error))

        # response: APIResponse[HouseResponse] = result.data.json()
        response = TypeAdapter(APIResponse[ControllerInitResponse]).validate_python(result.data.json())

        if not response.success:
            raise APIError(message=response.message, errors=response.errors)

        if response.data is None:
            raise APIError(message="Controller init response data is null.")

        return response.data

    def get_controller_device_data(self, controller_device_id: str):
        # result = await try_except(
        #     requests.get(
        #         f"{self.base_url}/api/v1/contoller-device",
        #         params={"controllerDeviceId": controller_device_id},
        #         auth=self.basic_auth
        #     )
        # )

        # if result.error is not None:
        #     raise APIError(message=str(result.error))

        result = requests.get(
            f"{self.base_url}/api/v1/controller-device",
            params={"controllerDeviceId": controller_device_id},
            auth=self.basic_auth,
            headers=self.request_headers(),
        )

        response = TypeAdapter(APIResponse[ControllerDeviceResponse]).validate_python(result.json())

        if not response.success:
            raise APIError(message=response.message, errors=response.errors)

        if response.data is None:
            raise APIError(message="Controller Device Data response data is null.")

        return response.data

    async def create_device_control_log(self, controller_device_id: str, device_id: str, status_from: bool, status_to: bool):
        result = await try_except(
            requests.post(
                f"{self.base_url}/api/v1/controller-device/device-control-logs",
                data=json.dumps({"controllerDeviceId": controller_device_id, "deviceId": device_id, "statusFrom": status_from, "statusTo": status_to}),
                auth=self.basic_auth,
                headers=self.request_headers(),
            )
        )

        if result.error is not None:
            return

    def push_observability_event(self, event: dict[str, Any]) -> None:
        request_id = str(event.get("requestId") or current_request_id())
        for attempt in range(3):
            try:
                response = requests.post(
                    f"{self.base_url}/api/v1/observability/events",
                    json=event,
                    auth=self.basic_auth,
                    headers=self.request_headers(request_id),
                    timeout=3,
                )
                if response.ok:
                    return
            except requests.RequestException:
                pass

            if attempt < 2:
                import time

                time.sleep(0.2 * (attempt + 1))





