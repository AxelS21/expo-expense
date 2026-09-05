import { dayLabel, groupByDay, isWithinRange } from '@/utils/date';

describe('dayLabel', () => {
  it('etiqueta hoy y ayer', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(dayLabel(today)).toBe('Hoy');
    expect(dayLabel(yesterday)).toBe('Ayer');
  });

  it('usa fecha completa para dias mas viejos', () => {
    expect(dayLabel('2020-01-15T10:00:00.000Z')).toMatch(/2020/);
  });
});

describe('groupByDay', () => {
  it('agrupa items consecutivos del mismo dia', () => {
    const items = [
      { id: '1', date: '2026-09-05T10:00:00.000Z' },
      { id: '2', date: '2026-09-05T08:00:00.000Z' },
      { id: '3', date: '2026-09-04T10:00:00.000Z' },
    ];
    const groups = groupByDay(items, (i) => i.date);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.items).toHaveLength(2);
    expect(groups[1]?.items).toHaveLength(1);
  });
});

describe('isWithinRange', () => {
  it('incluye limites y excluye fuera de rango', () => {
    expect(isWithinRange('2026-09-03T12:00:00.000Z', '2026-09-01', '2026-09-05')).toBe(true);
    expect(isWithinRange('2026-09-10T12:00:00.000Z', '2026-09-01', '2026-09-05')).toBe(false);
    expect(isWithinRange('2026-08-20T12:00:00.000Z', '2026-09-01', null)).toBe(false);
  });
});
