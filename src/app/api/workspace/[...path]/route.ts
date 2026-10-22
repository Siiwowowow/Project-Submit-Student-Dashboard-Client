import { NextRequest, NextResponse } from "next/server";
import { API_URL, SESSION_COOKIE } from "@/lib/server-api";

async function handleRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const endpoint = path.join("/");
  // Only explicitly supported workspace routes can reach the backend.
  const projectEndpoint = /^projects(?:\/(?:mine(?:\/stats)?|stats|[a-f0-9-]{36}(?:\/(?:review|marks|feedback))?))?$/.test(endpoint);
  const userEndpoint = /^users(?:\/[a-f0-9-]{36})?$/.test(endpoint);
  if (!projectEndpoint && !userEndpoint) {
    return NextResponse.json({ success: false, message: "Route not found." }, { status: 404 });
  }
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ success: false, message: "Please sign in." }, { status: 401 });

  try {
    const response = await fetch(API_URL + "/" + endpoint + request.nextUrl.search, {
      method: request.method,
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      ...(request.method !== "GET" ? { body: await request.text() } : {}),
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) headers.set("Retry-After", retryAfter);
    const result = new NextResponse(await response.text(), { status: response.status, headers });
    if (response.status === 401) result.cookies.delete(SESSION_COOKIE);
    return result;
  } catch {
    return NextResponse.json({ success: false, message: "Can't reach the server right now. Please try again." }, { status: 503 });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
