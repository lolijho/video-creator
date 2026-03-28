import { createHmac } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "auth_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return process.env.ENCRYPTION_KEY || "fallback-dev-key";
}

function signToken(payload: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  return `${payload}.${hmac.digest("hex")}`;
}

function verifyToken(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = token.substring(0, lastDot);
  const signature = token.substring(lastDot + 1);

  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  const expected = hmac.digest("hex");

  if (signature !== expected) return null;
  return payload;
}

export function validateCredentials(username: string, password: string): boolean {
  const envUser = process.env.AUTH_USERNAME;
  const envPass = process.env.AUTH_PASSWORD;
  if (!envUser || !envPass) return false;
  return username === envUser && password === envPass;
}

export function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    user: username,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  });
  const encoded = Buffer.from(payload).toString("base64url");
  return signToken(encoded);
}

export function isAuthEnabled(): boolean {
  return !!(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD);
}

export async function getSession(): Promise<{ user: string } | null> {
  if (!isAuthEnabled()) return { user: "anonymous" };

  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const encoded = verifyToken(token);
  if (!encoded) return null;

  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (!data.user || Date.now() > data.exp) return null;
    return { user: data.user };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
