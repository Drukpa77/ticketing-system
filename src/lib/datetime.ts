function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Format a Date for <input type="datetime-local" /> in local time. */
export function toDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function searchWindow(date: string) {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  const windowStart = new Date(dayStart);
  windowStart.setUTCDate(windowStart.getUTCDate() - 1);
  const windowEnd = new Date(dayEnd);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 14);
  return { windowStart, windowEnd };
}
