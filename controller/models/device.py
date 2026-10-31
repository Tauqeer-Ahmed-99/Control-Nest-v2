from datetime import datetime

from .controller_device import DeviceResponse
from models.resource_status import ResourceStatus
from gpiozero import OutputDevice

class Device:
    id: str
    room_id: str
    name: str
    status: bool
    gpio_pin_number: int
    is_default: bool
    is_scheduled: bool
    days_scheduled: str | None
    start_time: str | None
    off_time: str | None
    scheduled_by: str | None
    wattage: float
    resource_status: ResourceStatus
    created_at: datetime
    created_by: str
    modified_at: datetime | None
    modified_by: str | None
    output_device: OutputDevice | None


    def __init__(self, device: DeviceResponse) -> None:
        self.id = device.id
        self.room_id = device.roomId
        self.name = device.name
        self.status = device.status
        self.gpio_pin_number = device.gpioPinNumber
        self.is_default = device.isDefault
        self.is_scheduled = device.isScheduled
        self.days_scheduled =  device.daysScheduled
        self.start_time =  device.startTime
        self.off_time =  device.offTime
        self.scheduled_by =  device.scheduledBy
        self.wattage = device.wattage
        self.resource_status = device.resourceStatus
        self.created_at =  datetime.fromisoformat(device.createdAt)
        self.created_by = device.createdBy
        self.modified_at =  datetime.fromisoformat(device.modifiedAt) if device.modifiedAt else None
        self.modified_by =  device.modifiedBy
