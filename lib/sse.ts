/**
 * SSE (Server-Sent Events) listener untuk React Native.
 *
 * React Native + Hermes tidak include EventSource API native. Polyfill ini
 * pakai fetch + ReadableStream + TextDecoder untuk parse format SSE:
 *
 *   event: <name>\n
 *   data: <json>\n
 *   id: <id>\n
 *   \n
 *
 * Sumber endpoint: /api/live-events/[id]/stream (web app), yang kirim event
 * "slide", "chat", "qna_new", "qna_update", "qna_delete" + initial state.
 *
 * Features:
 * - Auth: kirim Authorization: Bearer dari sessionStore (mirror api.ts)
 * - Reconnect: exponential backoff 1s → 30s saat connection drop
 * - Manual abort: caller hold reference ke return controller, call .close()
 *   saat unmount.
 *
 * Usage:
 *   const sse = await connectLiveSession(eventId, {
 *     onSlide: (state) => {...},
 *     onChat: (msg) => {...},
 *     onError: (err) => {...},
 *   });
 *   // saat unmount:
 *   sse.close();
 */

import Constants from "expo-constants";
import { sessionStore } from "./storage";

const BASE = (Constants.expoConfig?.extra as { apiBaseUrl?: string })?.apiBaseUrl ??
  "https://senopatiacademy.id";

// Generic event payload types — match web emit shape di
// /api/live-events/[id]/stream/route.ts. Concrete shape per event di-cast
// di callback caller (sesuai kebutuhan UI).
export type SSEEventHandlers = {
  onSlide?: (state: unknown) => void;
  onChat?: (msg: unknown) => void;
  onQnaNew?: (qna: unknown) => void;
  onQnaUpdate?: (qna: unknown) => void;
  onQnaDelete?: (qnaId: string) => void;
  /** Catch-all untuk event yang belum di-mapping spesifik. */
  onEvent?: (event: string, data: unknown) => void;
  /** Connection error (network drop, 401, etc) — caller decide retry. */
  onError?: (err: Error) => void;
  /** Connection ready — initial state sudah received. */
  onOpen?: () => void;
};

export type SSEController = {
  /** Close stream + cancel reconnect loop. */
  close: () => void;
  /** True saat stream aktif (belum di-close + belum dapat terminal error). */
  isOpen: () => boolean;
};

const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_MULTIPLIER = 1.6;

export async function connectLiveSession(
  eventId: string,
  handlers: SSEEventHandlers,
): Promise<SSEController> {
  let abortController: AbortController | null = null;
  let stopped = false;
  let backoffMs = MIN_BACKOFF_MS;

  const url = `${BASE}/api/live-events/${encodeURIComponent(eventId)}/stream`;

  const dispatch = (event: string, dataStr: string) => {
    let data: unknown = dataStr;
    try {
      data = JSON.parse(dataStr);
    } catch {
      // raw string OK
    }
    switch (event) {
      case "slide":
        handlers.onSlide?.(data);
        break;
      case "chat":
        handlers.onChat?.(data);
        break;
      case "qna_new":
        handlers.onQnaNew?.(data);
        break;
      case "qna_update":
        handlers.onQnaUpdate?.(data);
        break;
      case "qna_delete":
        handlers.onQnaDelete?.(typeof data === "string" ? data : String(data));
        break;
      default:
        handlers.onEvent?.(event, data);
    }
  };

  async function loop() {
    while (!stopped) {
      abortController = new AbortController();
      try {
        const token = await sessionStore.getToken();
        const headers: Record<string, string> = {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(url, {
          method: "GET",
          headers,
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(`SSE HTTP ${res.status}: ${errText.slice(0, 200)}`);
        }
        if (!res.body) {
          throw new Error("SSE response missing body");
        }

        // Connected — reset backoff supaya reconnect cepat kalau stream
        // tiba-tiba drop bukan karena masalah kronik.
        backoffMs = MIN_BACKOFF_MS;
        handlers.onOpen?.();

        const reader = (res.body as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let currentEvent = "message";
        let currentData: string[] = [];

        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Process line-by-line. SSE messages dipisah \n\n; tiap line dimulai
          // dengan field-name "event:", "data:", "id:", atau comment ":".
          let idx: number;
          while ((idx = buffer.indexOf("\n")) >= 0) {
            const rawLine = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            // Strip \r kalau ada (CRLF normalize)
            const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;

            if (line === "") {
              // Message boundary — emit accumulated data + reset.
              if (currentData.length > 0) {
                dispatch(currentEvent, currentData.join("\n"));
              }
              currentEvent = "message";
              currentData = [];
              continue;
            }
            if (line.startsWith(":")) {
              // Comment (heartbeat) — ignore.
              continue;
            }
            const colonIdx = line.indexOf(":");
            if (colonIdx === -1) continue;
            const field = line.slice(0, colonIdx);
            // Value sesuai spec: trim leading space SATU char saja kalau ada.
            const valueRaw = line.slice(colonIdx + 1);
            const value =
              valueRaw.startsWith(" ") ? valueRaw.slice(1) : valueRaw;

            if (field === "event") {
              currentEvent = value;
            } else if (field === "data") {
              currentData.push(value);
            }
            // field "id", "retry" tidak di-handle di Phase 3A.
          }
        }
      } catch (err) {
        if (stopped) return;
        const error = err instanceof Error ? err : new Error(String(err));
        handlers.onError?.(error);
      } finally {
        abortController = null;
      }

      if (stopped) return;

      // Backoff sebelum reconnect.
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      backoffMs = Math.min(
        MAX_BACKOFF_MS,
        Math.floor(backoffMs * BACKOFF_MULTIPLIER),
      );
    }
  }

  loop();

  return {
    close() {
      stopped = true;
      abortController?.abort();
    },
    isOpen() {
      return !stopped;
    },
  };
}
