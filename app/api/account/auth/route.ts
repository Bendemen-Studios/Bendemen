import { NextRequest, NextResponse } from "next/server";
import { accountBridge } from "@/lib/account-bridge";
import { clearSessionCookie, createSessionToken, sessionCookie } from "@/lib/auth";
export const runtime = "nodejs";
type User = { id: number; email: string; firstName: string; lastName: string };
const validEmail = (v: unknown): v is string => typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode;
    if (!["login", "register"].includes(mode) || !validEmail(body.email) || typeof body.password !== "string" || body.password.length > 256) {
      return NextResponse.json({ error: "Vul een geldig e-mailadres en wachtwoord in." }, { status: 400 });
    }
    if (mode === "register" && (typeof body.firstName !== "string" || !body.firstName.trim() || body.firstName.length > 100 ||
        typeof body.lastName !== "string" || !body.lastName.trim() || body.lastName.length > 100 || body.password.length < 12)) {
      return NextResponse.json({ error: "Vul je naam in en kies een wachtwoord van minimaal 12 tekens." }, { status: 400 });
    }
    const user = await accountBridge<User>("account/" + mode, {
      method: "POST",
      body: JSON.stringify({ email: body.email.trim().toLowerCase(), password: body.password,
        ...(mode === "register" ? { firstName: body.firstName.trim(), lastName: body.lastName.trim() } : {}) }),
    });
    const token = createSessionToken(user);
    const response = NextResponse.json({ user: { email: user.email, firstName: user.firstName, lastName: user.lastName } });
    response.cookies.set(sessionCookie(token));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inloggen is niet gelukt.";
    const status = message.includes("bestaat al") ? 409 :
      (message.includes("E-mailadres of wachtwoord") ? 401 :
      (message.includes("minimaal 12") || message.includes("Controleer") ? 400 : 502));
    return NextResponse.json({ error: message }, { status });
  }
}
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearSessionCookie());
  return response;
}
