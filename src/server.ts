import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

const REMOTE_API_BASE = "https://jagapanen.avsatya.dev/api/v1";
const REMOTE_ORIGIN = "https://jagapanen.avsatya.dev";

// Proxy handler untuk meneruskan /api/** ke server VPS backend Jagapanen
async function handleApiProxy(request: Request, url: URL): Promise<Response> {
  // 1. Tangani CORS preflight (OPTIONS)
  if (request.method.toUpperCase() === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 2. Pemetaan target URL remote
  let targetUrlString: string;
  if (url.pathname === "/health" || url.pathname === "/api/health") {
    targetUrlString = `${REMOTE_ORIGIN}/health${url.search}`;
  } else {
    let subPath = url.pathname.replace(/^\/api(?:\/v1)?/, "");
    if (!subPath.startsWith("/")) {
      subPath = "/" + subPath;
    }
    targetUrlString = `${REMOTE_API_BASE}${subPath}${url.search}`;
  }

  // 3. Filter header hop-by-hop & teruskan header penting
  const hopByHopHeaders = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
  ]);

  const forwardedHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      forwardedHeaders.set(key, value);
    }
  }
  forwardedHeaders.set("host", "jagapanen.avsatya.dev");

  // 4. Tangani body untuk metode non-GET/HEAD
  const hasBody = !["GET", "HEAD"].includes(request.method.toUpperCase());
  let body: ArrayBuffer | undefined = undefined;
  if (hasBody) {
    try {
      body = await request.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstreamResponse = await fetch(targetUrlString, {
      method: request.method,
      headers: forwardedHeaders,
      body,
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");

    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    const responseBody = await upstreamResponse.arrayBuffer();

    return new Response(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[API Proxy Error] Gagal memanggil ${targetUrlString}:`, err);
    return new Response(
      JSON.stringify({
        error: "Proxy upstream error",
        message: err?.message || String(err),
        target: targetUrlString,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api") || url.pathname === "/health") {
        return await handleApiProxy(request, url);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
