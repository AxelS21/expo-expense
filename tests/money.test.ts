import { formatAmount, isValidAmount, parseAmount } from '@/utils/money';

describe('parseAmount', () => {
  it('ignora separadores de miles', () => {
    expect(parseAmount('12.500')).toBe(12500);
    expect(parseAmount('12500')).toBe(12500);
  });

  it('rechaza vacio y cero', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });
});

describe('isValidAmount', () => {
  it('solo acepta enteros positivos', () => {
    expect(isValidAmount(1)).toBe(true);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-5)).toBe(false);
    expect(isValidAmount(12.5)).toBe(false);
  });
});

describe('formatAmount', () => {
  it('formatea ARS sin decimales', () => {
    expect(formatAmount(12500)).toMatch(/12\.500/);
  });
});
