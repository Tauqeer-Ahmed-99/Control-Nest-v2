from pydantic import BaseModel

from models.resource_status import ResourceStatus

class HouseResponse(BaseModel):
    id: str
    name: str
    resourceStatus: ResourceStatus
    createdAt: str | None
    createdBy: str
    modifiedAt: str | None
    modifiedBy: str | None


class ControllerDeviceResponse(BaseModel):
    id: str
    houseId: str
    name: str
    resourceStatus: ResourceStatus
    createdAt: str | None
    createdBy: str
    modifiedAt: str | None
    modifiedBy: str | None


class TunnelResponse(BaseModel):
    id: str
    name: str
    resourceStatus: ResourceStatus
    createdAt: str | None
    createdBy: str
    modifiedAt: str | None
    modifiedBy: str | None
    controllerDeviceId: str
    hostname: str
    token: str
    dnsRecordId: str


class ControllerInitResponse(BaseModel):
    house: HouseResponse
    controllerDevice: ControllerDeviceResponse
    tunnel: TunnelResponse