import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // This is only a quick presence check. Protected layouts and Express verify the session.
  if (!request.cookies.get("handin_session")?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/user/:path*"] };