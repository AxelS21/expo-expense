import { CURRENCY_FRACTION_DIGITS, DEFAULT_CURRENCY, type CurrencyCode } from '@/constants/currency';

/**
 * Los importes se persisten como enteros positivos. Nunca coma flotante.
 * Para ARS un entero es un peso; para monedas con decimales seria la unidad minima.
 */
export type Amount = number;

export function isValidAmount(value: unknown): value is Amount {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/** Parsea lo que el usuario tipea ("12.500", "12500") a entero. Devuelve null si es invalido. */
export function parseAmount(input: string): Amount | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return null;
  const value = Number(digits);
  return isValidAmount(value) ? value : null;
}

export function formatAmount(amount: Amount, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const digits = CURRENCY_FRACTION_DIGITS[currency];
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}
