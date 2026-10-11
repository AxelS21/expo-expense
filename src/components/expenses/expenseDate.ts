/** Local calendar-day helpers for the expense form. Day keys use the 'YYYY-MM-DD' shape. */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function dayKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromDayKey(dayKey: string): Date {
  const [year = 1970, month = 1, day = 1] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey(): string {
  return dayKeyFromDate(new Date());
}

export function shiftDayKey(dayKey: string, days: number): string {
  const date = dateFromDayKey(dayKey);
  date.setDate(date.getDate() + days);
  return dayKeyFromDate(date);
}

/** "Hoy", "Ayer" or a short Spanish date such as "5 sept 2026". */
export function formatDayLabel(dayKey: string): string {
  const today = todayKey();
  if (dayKey === today) return 'Hoy';
  if (dayKey === shiftDayKey(today, -1)) return 'Ayer';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    dateFromDayKey(dayKey)
  );
}

/** ISO timestamp for a new expense on the given local day, using the current time of day. */
export function isoForNewExpense(dayKey: string): string {
  const now = new Date();
  const date = dateFromDayKey(dayKey);
  date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return date.toISOString();
}
