import { apiFetch } from "./client";

export async function testBackend() {
  return apiFetch("/");
}