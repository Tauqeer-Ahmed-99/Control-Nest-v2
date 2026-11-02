import asyncio
import logging
import re
from datetime import datetime, time
from typing import Optional

from services.controller_device import ControllerDevice
from models.device import Device

logger = logging.getLogger(__name__)


class ScheduleService:
    DAY_NAMES = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    DAY_INDEX = {day: index for index, day in enumerate(DAY_NAMES)}
    TIME_PATTERN = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")

    def __init__(
        self,
        controller_device: ControllerDevice,
        interval_seconds: int = 60,
    ):
        self.controller_device = controller_device
        self.interval_seconds = interval_seconds
        self._task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()

        # Ensures hardware is reconciled on the first check,
        # even if device.status contains a stale persisted value.
        self._last_applied: dict[str, bool] = {}

    async def start(self) -> None:
        if self._task is not None and not self._task.done():
            return

        self._stop_event.clear()
        self._task = asyncio.create_task(
            self._run(),
            name="schedule-service",
        )
        logger.info("ScheduleService started")

    async def stop(self) -> None:
        self._stop_event.set()

        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            finally:
                self._task = None

        logger.info("ScheduleService stopped")

    async def _run(self) -> None:
        while not self._stop_event.is_set():
            try:
                await self.check_schedules()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Schedule cycle failed")

            try:
                await asyncio.wait_for(
                    self._stop_event.wait(),
                    timeout=self.interval_seconds,
                )
            except asyncio.TimeoutError:
                pass

    async def check_schedules(self) -> None:
        from services.maintenance import paused
        if paused():
            return
        # Capture the time once so every device uses the same time boundary.
        now = datetime.now().astimezone()

        # Read the latest list, not a cached copy from startup.
        devices = list(self.controller_device.devices)
        current_ids = {device.id for device in devices}

        # Prevent removed devices from leaving stale cache entries.
        for device_id in self._last_applied.keys() - current_ids:
            del self._last_applied[device_id]

        for device in devices:
            try:
                if not device.is_scheduled:
                    # Do not force a state change when scheduling is disabled.
                    self._last_applied.pop(device.id, None)
                    continue

                desired_status = self._should_be_on(device, now)

                # Invalid or incomplete schedules must not change hardware.
                if desired_status is None:
                    continue

                if (
                    device.id not in self._last_applied
                    or device.status != desired_status
                    or self._last_applied[device.id] != desired_status
                ):
                    self.controller_device.switch_device(
                        device.id,
                        desired_status,
                        device.scheduled_by,
                    )

                    self._last_applied[device.id] = desired_status

                    logger.info(
                        "Scheduled device '%s' (%s) switched %s",
                        device.name,
                        device.id,
                        "ON" if desired_status else "OFF",
                    )

            except Exception:
                logger.exception(
                    "Failed to process schedule for device '%s' (%s)",
                    getattr(device, "name", "unknown"),
                    getattr(device, "id", "unknown"),
                )

    def _should_be_on(
        self,
        device: Device,
        now: datetime,
    ) -> Optional[bool]:
        """
        Calculate the desired state from the current local time.

        days_scheduled: "Sun-Mon-Tue-Wed-Thu-Fri-Sat"
        start_time:     "22:00"
        off_time:       "06:00"

        The selected weekday identifies the day the schedule starts.
        """
        if not device.days_scheduled:
            logger.warning(
                "Device '%s' has no scheduled days",
                device.name,
            )
            return None

        if not device.start_time or not device.off_time:
            logger.warning(
                "Device '%s' has incomplete schedule times",
                device.name,
            )
            return None

        start = self._parse_time(device.start_time)
        off = self._parse_time(device.off_time)

        if start is None or off is None:
            logger.warning(
                "Device '%s' has invalid times: start=%r, off=%r",
                device.name,
                device.start_time,
                device.off_time,
            )
            return None

        scheduled_days = self._parse_days(device.days_scheduled)

        if scheduled_days is None:
            logger.warning(
                "Device '%s' has invalid days_scheduled: %r",
                device.name,
                device.days_scheduled,
            )
            return None

        current_day = now.weekday()  # Monday=0 ... Sunday=6
        current_time = now.time().replace(tzinfo=None)

        if start == off:
            # Explicit policy: equal times mean a full day on each
            # selected weekday, from 00:00 through 23:59:59.
            return current_day in scheduled_days

        if start < off:
            # Same-day schedule, e.g. 08:00 to 08:30.
            return (
                current_day in scheduled_days
                and start <= current_time < off
            )

        # Overnight schedule, e.g. 22:00 to 06:00.
        # The previous day's schedule remains active after midnight.
        previous_day = (current_day - 1) % 7

        return (
            (
                current_day in scheduled_days
                and current_time >= start
            )
            or (
                previous_day in scheduled_days
                and current_time < off
            )
        )

    @classmethod
    def _parse_time(cls, value: str) -> Optional[time]:
        if not cls.TIME_PATTERN.fullmatch(value):
            return None

        try:
            return datetime.strptime(value, "%H:%M").time()
        except ValueError:
            return None

    @classmethod
    def _parse_days(cls, value: str) -> Optional[set[int]]:
        parts = value.split("-")

        if not parts or any(part not in cls.DAY_INDEX for part in parts):
            return None

        # Reject duplicates instead of silently accepting malformed data.
        if len(parts) != len(set(parts)):
            return None

        return {cls.DAY_INDEX[part] for part in parts}
