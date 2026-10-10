import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { accountBridge } from "@/lib/account-bridge";

export const runtime = "nodejs";

type AccountOrder = {
  id: number;
  number: string;
  date: string;
  status: string;
  statusKey: string;
  total: string;
  currency: string;
  invoiceAvailable: boolean;
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in om je bestellingen te bekijken." }, { status: 401 });
  try {
    const result = await accountBridge<{ orders: AccountOrder[] }>("account/orders/" + session.id);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Je bestellingen konden niet worden opgehaald." }, { status: 502 });
  }
}
