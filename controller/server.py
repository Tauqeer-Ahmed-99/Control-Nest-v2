from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated
import os
from pathlib import Path

from dotenv import load_dotenv

from fastapi import FastAPI, Request, Depends, HTTPException
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
from services.observability import ObservabilityMiddleware


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
    app.state.hardware_ready = False
    try:
        controller_device.initialize()
        app.state.hardware_ready = True
    except Exception:
        # Keep setup reachable after key revocation or a network outage.
        print("Controller sync unavailable. Open setup to reconnect.")

    if os.environ.get("CONTROL_NEST_SUPERVISED") != "1":
        await discovery_service.start()
    await schedule_service.start()
    
    app.state.discovery_service = discovery_service
    app.state.schedule_service = schedule_service

    try:
        yield
    finally:
        await schedule_service.stop()
        for device in controller_device.devices:
            if device.output_device is not None:
                device.output_device.close()
        await discovery_service.stop()


app = FastAPI(lifespan=lifespan, dependencies=[Depends(require_auth)],)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allows all origins
    allow_credentials=False,   # Must be False if allow_origins=["*"]
    allow_methods=["*"],       # Allows all methods
    allow_headers=["*"],       # Allows all headers
    expose_headers=["X-Request-ID"],
)
app.add_middleware(
    ObservabilityMiddleware,
    api_service=api_service,
    config_service=controller_config_service,
)

@app.get("/internal/maintenance/ready")
def maintenance_ready(request: Request):
    from services.maintenance import internal
    internal(request)
    return {"version": Path(__file__).with_name("VERSION").read_text().strip(), "apiContract": 1, "dataSchema": 1, "processId": os.getpid(),
            "configuration": bool(controller_config_service.get_controller_config()) or not controller_config_service.is_configured(),
            "gpio": request.app.state.hardware_ready, "schedules": schedule_service._task is not None and not schedule_service._task.done()}

@app.post("/internal/maintenance/quiesce")
async def maintenance_quiesce(request: Request):
    from services.maintenance import internal
    internal(request)
    await schedule_service.stop()
    controller_device.save_local_devices()
    return {"paused": True}

@app.post("/internal/maintenance/resume")
async def maintenance_resume(request: Request):
    from services.maintenance import internal
    internal(request)
    await schedule_service.start()
    return {"paused": False}

@app.get("/", status_code=200)
def get_health():
    return APIResponse.from_data(message="System is healthy", data={"health": "ok"})

@app.post("/controller/configure", status_code=201)
async def config_controller(body: ConfigController, auth: Annotated[tuple[str, str], Depends(require_auth)]):
    _, access_token = auth
    
    result = await try_except(
        system_service.config(
            body.apiKey,
            access_token
        )
    )

    if result.error is not None:
        return APIResponse.from_error(result.error)

    if os.environ.get("CONTROL_NEST_SUPERVISED") != "1":
        await discovery_service.stop()
        discovery_service.device_name = controller_config_service.get_controller_device_name()
        await discovery_service.start()
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
async def switch_device(body: SwitchDevice, auth: Annotated[tuple[str, str], Depends(require_auth)]):
    user_id, _ = auth
    if body.userId is not None and body.userId != user_id:
        raise HTTPException(status_code=403, detail="Switch user must match the authenticated user.")

    result = await try_except(
        controller_device.switch_device(body.deviceId, body.status, user_id)
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


