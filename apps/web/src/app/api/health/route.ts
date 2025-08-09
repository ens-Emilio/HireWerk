import { NextResponse } from "next/server";

export const runtime = "edge"; // rápido e barato

export async function GET() {
  return NextResponse.json({ ok: true });
}


