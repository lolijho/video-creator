import { NextResponse } from "next/server";
import {
  validateCredentials,
  createSessionToken,
  isAuthEnabled,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);

    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
