from pydantic import BaseModel

from models.resource_status import ResourceStatus

class DeviceResponse(BaseModel):
    id: str
    controllerDeviceId: str
    roomId: str
    name: str
    status: bool
    pinNumber: int
    gpioPinNumber: int
    isDefault: bool
    isScheduled: bool
    daysScheduled: str | None
    startTime: str | None
    offTime: str | None
    scheduledBy: str | None
    wattage: float
    resourceStatus: ResourceStatus
    createdAt: str
    createdBy: str
    modifiedAt: str | None
    modifiedBy: str | None

class SwitchDevice(BaseModel):
    deviceId: str
    status: bool
    userId: str | None = None

class RemoveMultipleDevices(BaseModel):
    deviceIds: list[str]

class RoomResponse(BaseModel):
    id: str
    name: str
    resourceStatus: ResourceStatus
    createdAt: str
    createdBy: str
    modifiedAt: str | None
    modifiedBy: str | None
    devices: list[DeviceResponse]

class HouseResponse(BaseModel):
    id: str
    name: str
    resourceStatus: ResourceStatus
    createdAt: str
    createdBy: str
    modifiedAt: str | None
    modifiedBy: str | None
    rooms: list[RoomResponse]

class ControllerDeviceResponse(BaseModel):
    id: str
    houseId: str
    name: str
    resourceStatus: ResourceStatus
    createdAt: str
    createdBy: str
    modifiedAt: str | None
    modifiedBy: str | None
    # house: HouseResponse
    devices: list[DeviceResponse]
