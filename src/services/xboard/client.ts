/**
 * XBoardClient — Decoupled HTTP client for XBoard API
 *
 * Separates the transport layer (baseUrl, fetch, auth handling)
 * from the module-level api.ts functions, enabling:
 *  - Multiple XBoard backends
 *  - Easier testing (injectable baseUrl)
 *  - Future per-user server configuration
 */

import { fetch } from "@tauri-apps/plugin-http";

import { XBoardError, XBoardErrorCode } from "./errors";
import { clearSession, loadSession } from "./store";

const TIMEOUT_MS = 15_000;

export class XBoardClient {
  private authExpiredTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(public readonly baseUrl: string) {}

  // ── Auth expiry handler ──────────────────────────────────────────────────

  private handleAuthExpired() {
    if (this.authExpiredTimer) return;
    const staleAuth = loadSession()?.authData;
    this.authExpiredTimer = setTimeout(() => {
      this.authExpiredTimer = null;
      const currentAuth = loadSession()?.authData;
      if (currentAuth && currentAuth !== staleAuth) return;
      clearSession();
      window.location.reload();
    }, 100);
  }

  // ── HTTP helpers ─────────────────────────────────────────────────────────

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private authHeaders(authData: string): Record<string, string> {
    return {
      authorization: authData,
      Accept: "application/json",
    };
  }

  private async parseResponse(res: Response): Promise<unknown> {
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new XBoardError(
        `Invalid JSON response (${res.status})`,
        XBoardErrorCode.INVALID_RESPONSE,
        res.status,
      );
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        this.handleAuthExpired();
      }
      const message =
        json && typeof json === "object" && "message" in json
          ? String((json as Record<string, unknown>).message)
          : `Request failed (${res.status})`;
      throw new XBoardError(
        message,
        res.status === 401 || res.status === 403
          ? XBoardErrorCode.AUTH_EXPIRED
          : XBoardErrorCode.NETWORK_ERROR,
        res.status,
      );
    }
    return json;
  }

  async get(path: string, authData: string): Promise<unknown> {
    const res = await fetch(this.buildUrl(path), {
      method: "GET",
      headers: this.authHeaders(authData),
      connectTimeout: TIMEOUT_MS,
    });
    return this.parseResponse(res);
  }

  async getGuest(path: string): Promise<unknown> {
    const res = await fetch(this.buildUrl(path), {
      method: "GET",
      headers: { Accept: "application/json" },
      connectTimeout: TIMEOUT_MS,
    });
    return this.parseResponse(res);
  }

  async post(
    path: string,
    body: Record<string, unknown>,
    authData?: string,
  ): Promise<unknown> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (authData) headers.authorization = authData;

    const res = await fetch(this.buildUrl(path), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      connectTimeout: TIMEOUT_MS,
    });
    return this.parseResponse(res);
  }
}
