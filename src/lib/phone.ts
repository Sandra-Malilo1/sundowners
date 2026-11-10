/** "0712 345 678" | "+254712345678" | "254712345678"  ->  "254712345678". null if it can't be a Kenyan mobile number. */
export function toMsisdn(raw: string): string | null {
  let s = raw.replace(/[\s()-]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('0')) s = `254${s.slice(1)}`;
  return /^254[17]\d{8}$/.test(s) ? s : null;
}