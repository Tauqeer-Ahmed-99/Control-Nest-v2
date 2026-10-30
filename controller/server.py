from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated

from dotenv import load_dotenv

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware

from services.controller_device import ControllerDevice
from services.controller_config import ControllerConfigService
from services.api import APIService
from services.cloudflared import CloudflaredService
from services.discovery import DiscoveryService
from services.system import SystemService
from services.auth import require_auth

from utils.try_except import try_except

from models.api import APIResponse
from models.config_controller import ConfigController
from models.controller_device import DeviceResponse, SwitchDevice, RemoveMultipleDevices
from services.schedule import ScheduleService


load_dotenv()

controller_config_service = ControllerConfigService()
api_service = APIService()
controller_device = ControllerDevice(controller_config_service, api_service)
schedule_service = ScheduleService(controller_device, interval_seconds=60)
cloudflared_service = CloudflaredService()
discovery_service = DiscoveryService(controller_config_service, port=8000)
system_service = SystemService(controller_config_service, api_service, cloudflared_service, controller_device)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    controller_device.initialize()

    await discovery_service.start()
    await schedule_service.start()
    
    app.state.discovery_service = discovery_service
    app.state.schedule_service = schedule_service

    try:
        yield
    finally:
        await discovery_service.stop()


app = FastAPI(lifespan=lifespan, dependencies=[Depends(require_auth)],)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allows all origins
    allow_credentials=False,   # Must be False if allow_origins=["*"]
    allow_methods=["*"],       # Allows all methods
    allow_headers=["*"],       # Allows all headers
)

@app.get("/", status_code=200)
def get_health():
    return APIResponse.from_data(message="System is healthy", data={"health": "ok"})

@app.post("/controller/configure", status_code=201)
async def config_controller(body: ConfigController, auth: Annotated[tuple[str, str], Depends(require_auth)]):
    _, access_token = auth
    
    result = await try_except(
        system_service.config(
            body.userId,
            access_token,
            body.controllerName
        )
    )

    if result.error is not None:
        return APIResponse.from_error(result.error)

    return APIResponse.from_data(message="Controller initialized", data=result.data)

@app.post("/device", status_code=201)
async def create_device(body: DeviceResponse):
    result = await try_except(
        controller_device.add_device(body)
    )

    if result.error is not None:
        return APIResponse.from_error(result.error)

    return APIResponse.from_data(message="Device Added", data=result.data)

@app.put("/device", status_code=200)
async def update_device(body: DeviceResponse):
    result = await try_except(
        controller_device.update_device(body)
    )

    if result.error is not None:
        return APIResponse.from_error(result.error)

    return APIResponse.from_data(message="Device Removed", data=result.data)

@app.post("/device/switch", status_code=200)
async def switch_device(body: SwitchDevice):
    result = await try_except(
        controller_device.switch_device(body.deviceId, body.status)
    )

    if result.error is not None:
        return APIResponse.from_error(result.error)

    return APIResponse.from_data(message="Device Removed", data=result.data)

@app.delete("/device", status_code=200)
async def remove_device(body: RemoveMultipleDevices):
    result = await try_except(
        controller_device.remove_multiple_devices(body.deviceIds)
    )

    if result.error is not None:
        return APIResponse.from_error(result.error)

    return APIResponse.from_data(message="Device(s) Removed", data=result.data)


