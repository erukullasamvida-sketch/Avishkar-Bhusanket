export function normalizePhoneNumber(value: string): string | null {
  const normalized = value.trim().replace(/[\s()-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}
