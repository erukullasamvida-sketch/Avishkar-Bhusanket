import { supabase } from "@/integrations/supabase/client";
import {
  getLocalDemoSession,
  setLocalDemoSession,
} from "@/lib/demo-auth";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function isLocalDemoSessionExpired(response: Response): Promise<boolean> {
  if (response.status !== 503) return false;

  const payload: unknown = await response.clone().json().catch(() => null);
  return (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    payload.detail === "Supabase authentication is not configured on the backend"
  );
}

async function renewLocalDemoSession(): Promise<string> {
  const previousSession = getLocalDemoSession();
  if (!previousSession) {
    throw new Error("Local demo session is no longer available. Please sign in again.");
  }

  const response = await fetch(`${API_BASE_URL}/api/demo/session`, {
    method: "POST",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Could not renew local demo session (HTTP ${response.status}): ${
        errorText || response.statusText
      }`,
    );
  }

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("access_token" in result) ||
    typeof result.access_token !== "string"
  ) {
    throw new Error("Local demo session renewal returned an invalid session.");
  }

  const renewedSession = {
    ...previousSession,
    access_token: result.access_token,
  };
  setLocalDemoSession(renewedSession);
  return renewedSession.access_token;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }

  const demoSession = getLocalDemoSession();
  const demoAccessToken = demoSession?.access_token;
  if (demoAccessToken) {
    headers.set("Authorization", `Bearer ${demoAccessToken}`);
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (
    demoSession &&
    endpoint !== "/api/demo/session" &&
    (await isLocalDemoSessionExpired(response))
  ) {
    const refreshedToken = await renewLocalDemoSession();
    const retryHeaders = new Headers(headers);
    retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: retryHeaders,
    });
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API Error ${response.status}: ${
        errorText || response.statusText
      }`,
    );
  }

  return response.json();
}