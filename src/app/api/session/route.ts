import { NextRequest, NextResponse } from "next/server";
import { API_URL, SESSION_COOKIE } from "@/lib/server-api";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
  }
  try {
    const { accessToken } = await request.json();
    if (typeof accessToken !== "string" || accessToken.length > 4096) {
      return NextResponse.json({ success: false, message: "Invalid session." }, { status: 400 });
    }
    // The Express API verifies the JWT before we store it.
    const profile = await fetch(API_URL + "/auth/me", {
      headers: { Authorization: "Bearer " + accessToken }, cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!profile.ok) return NextResponse.json({ success: false, message: "Please sign in again." }, { status: 401 });
    const result = await profile.json();
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
    const maxAge = Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
    if (!Number.isFinite(maxAge) || maxAge <= 0) {
      return NextResponse.json({ success: false, message: "Session has expired." }, { status: 401 });
    }
    const response = NextResponse.json({ success: true, data: result.data });
    response.cookies.set(SESSION_COOKIE, accessToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Couldn't start your session. Please try again." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  response.headers.set("Cache-Control", "no-store");
  return response;
}