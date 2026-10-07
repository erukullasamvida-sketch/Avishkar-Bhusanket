import { API_BASE_URL } from "./client";

export async function testBackend() {
  const response = await fetch(`${API_BASE_URL}/`);
  if (!response.ok) {
    throw new Error(`Backend health check failed (${response.status})`);
  }
  return response.json();
}
