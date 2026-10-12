"use client";
import { requestJSON } from "@partner-shared/transport";
export function apiJSON<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  return requestJSON<T>(input, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
}
