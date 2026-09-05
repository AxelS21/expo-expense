/** Utilidades de fecha para agrupar y filtrar el historial. Todo en hora local del dispositivo. */

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const key = toDayKey(date);
  if (key === toDayKey(today)) return 'Hoy';
  if (key === toDayKey(yesterday)) return 'Ayer';

  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export interface DayGroup<T> {
  key: string;
  label: string;
  items: T[];
}

/** Agrupa una lista ya ordenada desc por fecha en grupos por dia calendario. */
export function groupByDay<T>(items: T[], getDate: (item: T) => string): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const item of items) {
    const key = toDayKey(new Date(getDate(item)));
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, label: dayLabel(getDate(item)), items: [item] });
    }
  }
  return groups;
}

export type QuickPeriod = 'today' | 'week' | 'month' | 'all';

/** Limite inferior (inclusive) para un periodo rapido, o null para 'all'. */
export function periodStart(period: QuickPeriod): Date | null {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'week') {
    const day = now.getDay(); // 0 = domingo
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    return monday;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parsea "YYYY-MM-DD" como medianoche LOCAL en vez de UTC (comportamiento de `new Date(string)`). */
function parseLocalDate(value: string): Date {
  const match = DATE_ONLY.exec(value);
  if (!match) return new Date(value);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function isWithinRange(isoDate: string, fromDate: string | null, toDate: string | null): boolean {
  const time = new Date(isoDate).getTime();
  if (fromDate && time < parseLocalDate(fromDate).setHours(0, 0, 0, 0)) return false;
  if (toDate && time > parseLocalDate(toDate).setHours(23, 59, 59, 999)) return false;
  return true;
}
