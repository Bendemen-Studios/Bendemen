import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type BendemenSession = { id: number; email: string; firstName: string; lastName: string; exp: number };
const COOKIE = "bendemen_session";
const secret = () => {
  const value = process.env.BENDEMEN_AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("BENDEMEN_AUTH_SECRET must be at least 32 characters");
  return value;
};
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
export function createSessionToken(user: Omit<BendemenSession, "exp">) {
  const payload: BendemenSession = { ...user, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return encoded + "." + sign(encoded);
}
export function verifySessionToken(token: string | undefined): BendemenSession | null {
  if (!token) return null;
  const [encoded, signature, ...rest] = token.split(".");
  if (!encoded || !signature || rest.length) return null;
  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as BendemenSession;
    if (!Number.isSafeInteger(session.id) || session.id < 1 || typeof session.email !== "string" ||
        !Number.isSafeInteger(session.exp) || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch { return null; }
}
export async function getSession() {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}
export function sessionCookie(token: string) {
  return { name: COOKIE, value: token, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };
}
export function clearSessionCookie() {
  return { name: COOKIE, value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0 };
}
