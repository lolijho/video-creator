import { NextResponse } from "next/server";
import { getSession, isAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthEnabled()) {
    return NextResponse.json({ authenticated: true, user: "anonymous" });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: session.user });
}
