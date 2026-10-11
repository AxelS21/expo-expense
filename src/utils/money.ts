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

/** Decimal separator shown on the amount keypad (es-AR locale). */
export const KEYPAD_DECIMAL_SEPARATOR = ',';

/**
 * Converts the keypad buffer (digits plus an optional ',' separator) to an integer in minor units.
 * Returns null when the buffer is empty or the value is not a valid positive amount.
 */
export function amountFromKeypad(buffer: string, currency: CurrencyCode = DEFAULT_CURRENCY): Amount | null {
  const fractionDigits = CURRENCY_FRACTION_DIGITS[currency];
  const [whole = '', fraction = ''] = buffer.split(KEYPAD_DECIMAL_SEPARATOR);
  const paddedFraction = fractionDigits > 0 ? fraction.padEnd(fractionDigits, '0').slice(0, fractionDigits) : '';
  const digits = `${whole}${paddedFraction}`.replace(/\D/g, '');
  if (digits.length === 0) return null;
  const value = Number(digits);
  return isValidAmount(value) ? value : null;
}

/** Inverse of amountFromKeypad: builds the keypad buffer for an existing stored amount. */
export function keypadFromAmount(amount: Amount, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const fractionDigits = CURRENCY_FRACTION_DIGITS[currency];
  if (fractionDigits === 0) return String(amount);
  const divisor = 10 ** fractionDigits;
  const whole = Math.floor(amount / divisor);
  const fraction = String(amount % divisor).padStart(fractionDigits, '0').replace(/0+$/, '');
  return fraction.length > 0 ? `${whole}${KEYPAD_DECIMAL_SEPARATOR}${fraction}` : String(whole);
}
