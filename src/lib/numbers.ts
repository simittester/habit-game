/**
 * Sanitize free-text decimal input so it works with both `.` and `,` as the
 * decimal separator (different mobile keyboard locales use different symbols).
 * Returns a string suitable for both display and parseFloat.
 */
export function sanitizeDecimal(v: string, maxDecimals = 2): string {
  // Drop anything that isn't a digit, dot, or comma.
  let s = v.replace(/[^0-9.,]/g, '');
  // Treat the FIRST comma or dot as the decimal separator; drop the rest.
  // Normalize comma to dot first.
  s = s.replace(/,/g, '.');
  const parts = s.split('.');
  if (parts.length > 2) {
    s = parts[0] + '.' + parts.slice(1).join('');
  }
  // Strip leading zeros (but allow "0.x")
  if (s.length > 1 && s.startsWith('0') && !s.startsWith('0.')) {
    s = s.replace(/^0+/, '');
  }
  // Limit decimal places
  if (s.includes('.')) {
    const [int, dec] = s.split('.');
    s = int + '.' + dec.slice(0, maxDecimals);
  }
  return s;
}
