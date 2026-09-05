/** Moneda unica del MVP. No hardcodear 'ARS' fuera de este modulo. */
export const DEFAULT_CURRENCY = 'ARS' as const;

export type CurrencyCode = 'ARS' | 'USD' | 'EUR' | 'BRL';

/** Cuantos decimales tiene la moneda. El MVP solo persiste enteros. */
export const CURRENCY_FRACTION_DIGITS: Record<CurrencyCode, number> = {
  ARS: 0,
  USD: 2,
  EUR: 2,
  BRL: 2,
};
