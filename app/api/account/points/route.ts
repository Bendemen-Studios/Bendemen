import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { accountBridge } from "@/lib/account-bridge";
export const runtime = "nodejs";
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in om je puntensaldo te bekijken." }, { status: 401 });
  try {
    const points = await accountBridge<{ balance: number; label: string }>("points/" + session.id);
    return NextResponse.json({ user: { email: session.email, firstName: session.firstName, lastName: session.lastName }, ...points });
  } catch {
    return NextResponse.json({ error: "Je puntensaldo kon niet worden opgehaald." }, { status: 502 });
  }
}
