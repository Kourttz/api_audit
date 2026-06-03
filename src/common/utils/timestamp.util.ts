/**
 * 
 * @returns Timestamp no formato ISO 8601 ajustado para GMT-3
 */
export function getGMT3Timestamp(): string {
  const now = new Date();
  const offset = -3; // GMT-3
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt3 = new Date(utc + offset * 3600000);
  return gmt3.toISOString().replace('Z', '');
}