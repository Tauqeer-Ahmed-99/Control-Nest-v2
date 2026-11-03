from typing import List
from gpiozero import OutputDevice
import asyncio
import os
from services.json_store import JsonStore

import RPi.GPIO as GPIO

from services.api import APIService
from services.controller_config import ControllerConfigService

from models.device import DeviceResponse, Device



class ControllerDevice:
    devices: list[Device]
    controller_config_service: ControllerConfigService
    api_service: APIService
    controller_device_id: str | None = None

    def __init__(self, controller_config_service: ControllerConfigService,api_service: APIService):
        self.devices = []
        self._device_records = {}
        self.controller_config_service = controller_config_service
        self.api_service = api_service
        # self.initialize() # DONOT INITIALIZE IT HERE, Already initialized in server.py @asynccontextmanager lifespan function

    def initialize(self):
        try:
            self.load_data()
            self.release_all_rpi_gpio_resources()
            self.initialize_output_devices()
        except Exception as e:
            print(f"Error initializing ControllerDevice: {e}")
            raise Exception(f"Error initializing ControllerDevice: {e}")

    def load_data(self):
        if self.controller_config_service.is_configured():
            controller_device_id = self.controller_config_service.get("controllerDevice", "id")
            if controller_device_id is not None:
                self.controller_device_id = controller_device_id
                cached = JsonStore.read_file("devices")
                if os.environ.get("CONTROL_NEST_SUPERVISED") == "1" and cached.get("controllerDeviceId") == controller_device_id:
                    records = [DeviceResponse.model_validate(item) for item in cached.get("devices", [])]
                else:
                    records = self.api_service.get_controller_device_data(controller_device_id).devices
                self.devices = []
                self._device_records = {}
                for device in records:
                    self.devices.append(Device(device))
                    self._device_records[device.id] = device.model_dump(mode="json")
                self.save_local_devices()

    def save_local_devices(self):
        for device in self.devices:
            if device.id in self._device_records:
                self._device_records[device.id]["status"] = device.status
        if not JsonStore.write_file("devices", {"controllerDeviceId": self.controller_device_id, "devices": list(self._device_records.values())}):
            raise RuntimeError("Unable to persist controller devices")

    def release_all_rpi_gpio_resources(self):
        if os.environ.get("CONTROL_NEST_SUPERVISED") != "1":
            GPIO.cleanup()
        GPIO.setmode(GPIO.BCM)

    def initialize_output_devices(self):
        try:
            for device in self.devices:
                device.output_device = OutputDevice(
                    device.gpio_pin_number,
                    active_high=False,
                    initial_value=None if os.environ.get("CONTROL_NEST_SUPERVISED") == "1" else False,
                )
                if os.environ.get("CONTROL_NEST_SUPERVISED") == "1":
                    device.status = bool(device.output_device.value)
                    continue
                if device.status:
                    device.output_device.on()
                else:
                    device.output_device.off()
        except Exception as e:
            print(f"Error initializing output devices: {e}")
            raise Exception(f"Error initializing output devices: {e}")

    def add_device(self, device_res: DeviceResponse):
        if device_res.controllerDeviceId != self.controller_config_service.get("controllerDevice", "id"):
            raise ValueError("Device does not belong to this controller.")
        device = Device(device_res)
        device.output_device = OutputDevice(
            device.gpio_pin_number,
            active_high=False
        )
        if device.status:
            if device.output_device is not None:
                device.output_device.on()
        else:
            if device.output_device is not None:
                device.output_device.off()

        self.devices.append(device)
        self._device_records[device_res.id] = device_res.model_dump(mode="json")
        self.save_local_devices()

    def get_device(self, id: str):
        try:
            for device in self.devices:
                if device.id == id:
                    return device
        except Exception as e:
            print(f"Error getting device: {e}")
            return None

    def get_scheduled_devices(self) -> List[Device] | None:
        scheduled_devices: List[Device] = []
        for device in self.devices:
            if device.is_scheduled:
                scheduled_devices.append(device)
        return scheduled_devices

    def switch_device(self, id: str, status: bool, user_id: str | None = None):
        try:
            device = self.get_device(id)
            output_device = device.output_device if device is not None else None

            if output_device is not None:
                if status:
                    output_device.on()
                else:
                    output_device.off()

                if device is not None:
                    status_from = device.status
                    status_to = status
                    device.status = status
                    self.save_local_devices()
                    if self.controller_device_id is not None and status_from != status_to:
                        asyncio.create_task(
                            self.api_service.create_device_control_log(
                                self.controller_device_id,
                                device.id,
                                status_from,
                                status_to,
                                user_id,
                            )
                        )
            else:
                if device is None:
                    raise Exception(f"Device with id '{id}' not found.")
                if output_device is None:
                    raise Exception(f"Output Device is not initialized.")
        except Exception as e:
            print(f"Error switching device: {e}")
            raise Exception(f"Error switching device: {e}")

    def update_device(self, device_res: DeviceResponse):
        self.remove_device(device_res.id)
        self.add_device(device_res)

    def remove_device(self, device_id: str):
        device = self.get_device(device_id)
        if device is not None:
            output_device = device.output_device
            if output_device is not None:
                output_device.close()
            self.devices.remove(device)
            self._device_records.pop(device_id, None)
            self.save_local_devices()

    def remove_multiple_devices(self, device_ids: list[str]):
        for device_id in device_ids:
            self.remove_device(device_id)
