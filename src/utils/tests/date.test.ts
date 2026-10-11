process.env.TZ = 'America/Argentina/Buenos_Aires';

import {
  clampDayRange,
  isWithinRange,
  localDayKey,
  localMonthRange,
  monthStartDayKey,
  withLocalDay,
} from '@/utils/date';

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

describe('monthStartDayKey', () => {
  it('returns the first local day of the month', () => {
    expect(monthStartDayKey(new Date(2026, 9, 10, 23, 30))).toBe('2026-10-01');
  });
});

describe('clampDayRange', () => {
  it('keeps an ordered range unchanged', () => {
    expect(clampDayRange({ from: '2026-10-01', to: '2026-10-10' }, 'from')).toEqual({
      from: '2026-10-01',
      to: '2026-10-10',
    });
  });

  it('pulls `to` forward when `from` moves past it', () => {
    expect(clampDayRange({ from: '2026-10-12', to: '2026-10-10' }, 'from')).toEqual({
      from: '2026-10-12',
      to: '2026-10-12',
    });
  });

  it('pulls `from` back when `to` moves before it', () => {
    expect(clampDayRange({ from: '2026-10-05', to: '2026-10-02' }, 'to')).toEqual({
      from: '2026-10-02',
      to: '2026-10-02',
    });
  });
});

describe('isWithinRange with day keys', () => {
  it('includes the whole local end day', () => {
    expect(isWithinRange(new Date(2026, 9, 10, 23, 59).toISOString(), '2026-10-01', '2026-10-10')).toBe(true);
    expect(isWithinRange(new Date(2026, 9, 11, 0, 0).toISOString(), '2026-10-01', '2026-10-10')).toBe(false);
    expect(isWithinRange(new Date(2026, 8, 30, 23, 59).toISOString(), '2026-10-01', '2026-10-10')).toBe(false);
  });
});
