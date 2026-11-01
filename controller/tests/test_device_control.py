"""Exercise switching and attribution without GPIO hardware or HTTP calls."""
import asyncio
import importlib.util
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import AsyncMock, Mock, patch

CONTROLLER_PATH = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CONTROLLER_PATH))


def module(name, **values):
    result = types.ModuleType(name)
    result.__dict__.update(values)
    return result


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, CONTROLLER_PATH / path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


class DeviceControlTests(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        gpio = module("RPi.GPIO", cleanup=Mock(), setmode=Mock(), BCM=11)
        with patch.dict(sys.modules, {
            "gpiozero": module("gpiozero", OutputDevice=Mock()),
            "RPi": module("RPi", GPIO=gpio),
            "RPi.GPIO": gpio,
            "services.api": module("services.api", APIService=object),
            "services.controller_config": module("services.controller_config", ControllerConfigService=object),
            "models.device": module("models.device", DeviceResponse=object, Device=object),
        }):
            hardware = load_module("tested_controller_device", "services/controller_device.py")
            cls.ControllerDevice = hardware.ControllerDevice
            with patch.dict(sys.modules, {
                "services.controller_device": hardware,
            }):
                cls.ScheduleService = load_module("tested_schedule", "services/schedule.py").ScheduleService

    def setUp(self):
        self.output = Mock()
        self.device = types.SimpleNamespace(
            id="device-a", name="Lamp", status=False, output_device=self.output,
            is_scheduled=True, scheduled_by="user_scheduler",
        )
        self.api = types.SimpleNamespace(create_device_control_log=AsyncMock())
        self.controller = self.ControllerDevice(object(), self.api)
        self.controller.controller_device_id = "controller-a"
        self.controller.devices = [self.device]

    async def test_switch_logs_requester_after_hardware_and_state_update(self):
        observations = []

        async def check_log(*args):
            observations.append((self.output.on.call_count, self.device.status))

        self.api.create_device_control_log.side_effect = check_log
        self.controller.switch_device("device-a", True, "user_requester")
        await asyncio.sleep(0)
        self.assertEqual(observations, [(1, True)])
        self.api.create_device_control_log.assert_awaited_once_with(
            "controller-a", "device-a", False, True, "user_requester",
        )

    async def test_switch_off_preserves_requester(self):
        self.device.status = True
        self.controller.switch_device("device-a", False, "user_other")
        await asyncio.sleep(0)
        self.output.off.assert_called_once()
        self.api.create_device_control_log.assert_awaited_once_with(
            "controller-a", "device-a", True, False, "user_other",
        )

    async def test_unchanged_state_does_not_create_a_log(self):
        self.controller.switch_device("device-a", False, "user_requester")
        await asyncio.sleep(0)
        self.api.create_device_control_log.assert_not_called()

    async def test_hardware_failure_does_not_update_state_or_create_a_log(self):
        self.output.on.side_effect = RuntimeError("GPIO unavailable")
        with self.assertRaisesRegex(Exception, "GPIO unavailable"):
            self.controller.switch_device("device-a", True, "user_requester")
        await asyncio.sleep(0)
        self.assertFalse(self.device.status)
        self.api.create_device_control_log.assert_not_called()

    async def test_scheduled_switch_uses_schedule_owner(self):
        schedule = self.ScheduleService(self.controller)
        with patch.object(schedule, "_should_be_on", return_value=True):
            await schedule.check_schedules()
        await asyncio.sleep(0)
        self.api.create_device_control_log.assert_awaited_once_with(
            "controller-a", "device-a", False, True, "user_scheduler",
        )


if __name__ == "__main__":
    unittest.main()
