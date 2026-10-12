import * as SecureStore from "expo-secure-store";
import { Session } from "./types";
import { requestJSON } from "../shared/transport";
export { ApiError } from "../shared/transport";
export type { Client } from "../shared/types";
const key = "kaizen.partner.session.v1";
export const sessionStore = {
  async read(): Promise<Session | null> {
    const value = await SecureStore.getItemAsync(key);
    if (!value) return null;
    try {
      const session = JSON.parse(value);
      if (
        !/^[a-f0-9]{64}$/i.test(session?.token || "") ||
        typeof session.origin !== "string" ||
        !Number.isFinite(Date.parse(session.expiresAt)) ||
        !session.user?.id ||
        !session.user?.partnerId
      )
        return null;
      return session;
    } catch {
      return null;
    }
  },
  save(session: Session) {
    return SecureStore.setItemAsync(key, JSON.stringify(session));
  },
  clear() {
    return SecureStore.deleteItemAsync(key);
  },
};

export function request<T>(
  origin: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  if (!path.startsWith("/api/") || path.includes("\\"))
    throw Error("Invalid API path");
  return requestJSON<T>(origin + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    credentials: "omit",
  });
}
