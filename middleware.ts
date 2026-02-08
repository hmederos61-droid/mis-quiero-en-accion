import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  if (url.pathname === "/login") {
    const token = url.searchParams.get("token");

    if (token) {
      const dest = new URL("/acceso/coachee", url.origin);
      dest.searchParams.set("token", token);

      const email = url.searchParams.get("email");
      if (email) dest.searchParams.set("email", email);

      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login"],
};
