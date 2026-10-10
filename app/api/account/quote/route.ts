import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { accountBridge } from "@/lib/account-bridge";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in om punten in te wisselen." }, { status: 401 });
  try {
    const body = await req.json();
    const items = body.items;
    const destination = body.destination;
    const points = body.points;
    if (!Array.isArray(items) || items.length < 1 || items.length > 30 ||
        !Number.isSafeInteger(points) || points < 0 || points > 100000000 ||
        !destination || destination.country !== "NL" ||
        typeof destination.address_1 !== "string" || typeof destination.postcode !== "string" || typeof destination.city !== "string") {
      return NextResponse.json({ error: "Controleer je winkelwagen en bezorgadres." }, { status: 400 });
    }
    const quote = await accountBridge<{ balance: number; maxPoints: number; points: number; discount: string }>("points/quote", {
      method: "POST", body: JSON.stringify({ user_id: session.id, items, destination, points }),
    });
    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Puntenkorting berekenen is niet gelukt." }, { status: 502 });
  }
}
