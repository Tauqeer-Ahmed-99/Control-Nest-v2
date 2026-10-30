type ScheduledDevice = {
  isScheduled: boolean;
  daysScheduled: string | null; // "Sun-Mon-Tue-Wed-Thu-Fri-Sat"
  startTime: string | null; // "22:00"
  offTime: string | null; // "06:00"
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getScheduledStatus(
  device: ScheduledDevice,
  now: Date = new Date(),
): boolean {
  if (
    !device.isScheduled ||
    !device.daysScheduled ||
    !device.startTime ||
    !device.offTime
  ) {
    return false;
  }

  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

  if (
    !timePattern.test(device.startTime) ||
    !timePattern.test(device.offTime)
  ) {
    return false;
  }

  const scheduledDays = device.daysScheduled.split("-");

  if (
    scheduledDays.some((day) => !DAYS.includes(day)) ||
    new Set(scheduledDays).size !== scheduledDays.length
  ) {
    return false;
  }

  const currentDay = DAYS[now.getDay()];
  const previousDay = DAYS[(now.getDay() + 6) % 7];

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const start = toMinutes(device.startTime);
  const off = toMinutes(device.offTime);

  if (start === off) {
    return scheduledDays.includes(currentDay);
  }

  if (start < off) {
    // Same-day schedule, e.g. 08:00–18:00.
    return (
      scheduledDays.includes(currentDay) &&
      currentMinutes >= start &&
      currentMinutes < off
    );
  }

  // Overnight schedule, e.g. 22:00–06:00.
  return (
    (scheduledDays.includes(currentDay) && currentMinutes >= start) ||
    (scheduledDays.includes(previousDay) && currentMinutes < off)
  );
}
