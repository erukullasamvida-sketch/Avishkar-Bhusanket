export type DemoRole = "admin" | "dmo" | "field_officer";

export type LocalDemoSession = {
  access_token: string;
  role: DemoRole;
  name: string;
};

const STORAGE_KEY = "bhusanket-local-demo-session";

export function getLocalDemoSession(): LocalDemoSession | null {
  if (typeof window === "undefined") return null;

  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const value: unknown = JSON.parse(stored);
    if (
      typeof value === "object" &&
      value !== null &&
      "access_token" in value &&
      typeof value.access_token === "string" &&
      "role" in value &&
      (value.role === "admin" || value.role === "dmo" || value.role === "field_officer") &&
      "name" in value &&
      typeof value.name === "string"
    ) {
      return {
        access_token: value.access_token,
        role: value.role,
        name: value.name,
      };
    }
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export function setLocalDemoSession(session: LocalDemoSession) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearLocalDemoSession() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}
