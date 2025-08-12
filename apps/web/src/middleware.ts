import { NextResponse } from "next/server";

// Middleware neutro (desativado). O middleware ativo está em apps/web/middleware.ts
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
