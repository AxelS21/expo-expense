process.env.TZ = 'America/Argentina/Buenos_Aires';

import { localDayKey, localMonthRange, withLocalDay } from '@/utils/date';

describe('timezone setup', () => {
  it('runs in UTC-3', () => {
    expect(new Date(2026, 9, 31).getTimezoneOffset()).toBe(180);
  });
});

describe('localMonthRange', () => {
  it('spans local midnight of the 1st to local midnight of the next 1st', () => {
    expect(localMonthRange('2026-10')).toEqual({
      startIso: '2026-10-01T03:00:00.000Z',
      endIso: '2026-11-01T03:00:00.000Z',
    });
  });

  it('rolls over the year in December', () => {
    expect(localMonthRange('2026-12').endIso).toBe('2027-01-01T03:00:00.000Z');
  });

  it('puts 22:30 local on Oct 31 in October, not November', () => {
    const stored = new Date(2026, 9, 31, 22, 30).toISOString(); // 2026-11-01T01:30Z
    const oct = localMonthRange('2026-10');
    const nov = localMonthRange('2026-11');
    expect(stored >= oct.startIso && stored < oct.endIso).toBe(true);
    expect(stored >= nov.startIso && stored < nov.endIso).toBe(false);
  });
});

describe('localDayKey', () => {
  it('uses the local calendar day at 23:59 local', () => {
    expect(localDayKey(new Date(2026, 9, 31, 23, 59).toISOString())).toBe('2026-10-31');
  });

  it('uses the local calendar day just after local midnight', () => {
    expect(localDayKey('2026-11-01T03:00:00.000Z')).toBe('2026-11-01');
  });
});

describe('withLocalDay', () => {
  it('moves a timestamp to another local day keeping the local time', () => {
    const stored = new Date(2026, 9, 31, 22, 30).toISOString();
    const moved = withLocalDay(stored, '2026-10-29');
    expect(moved).toBe(new Date(2026, 9, 29, 22, 30).toISOString());
    expect(localDayKey(moved)).toBe('2026-10-29');
  });
});
