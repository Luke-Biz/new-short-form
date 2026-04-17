import { isValidPhoneNumber } from 'libphonenumber-js';

export function sanitizeDigitsMax(s: string, max: number): string {
  return s.replace(/\D/g, '').slice(0, max);
}

/**
 * Validates a full international number from react-phone-input-2
 * (`value` is digits only, country code included, no leading +).
 */
export function isValidIntlPhoneInputValue(value: string): boolean {
  const d = value.replace(/\D/g, '');
  if (!d) return false;
  return isValidPhoneNumber(`+${d}`);
}

export function sanitizeMoneyRaw(s: string): string {
  let out = '';
  let dot = false;
  for (const c of s) {
    if (c >= '0' && c <= '9') out += c;
    else if (c === '.' && !dot) {
      out += '.';
      dot = true;
    }
  }
  return out;
}

export function stripMoneyToNumberString(s: string): string {
  return sanitizeMoneyRaw(s.replace(/,/g, ''));
}

export function formatMoneyWithCommas(raw: string): string {
  if (!raw) return '';
  const parts = raw.split('.');
  const intPart = parts[0] ?? '';
  const dec = parts[1];
  const intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${intFmt}.${dec}` : intFmt;
}

export function parseMoneyNumber(raw: string): number {
  const n = Number.parseFloat(stripMoneyToNumberString(raw));
  return Number.isFinite(n) ? n : NaN;
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function moneyPasteSanitize(text: string): string {
  return sanitizeMoneyRaw(text.replace(/,/g, ''));
}
