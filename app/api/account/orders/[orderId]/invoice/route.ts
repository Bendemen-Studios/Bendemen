import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { accountBridge } from "@/lib/account-bridge";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://test.bendemen.com";
  if (!session) return NextResponse.redirect(new URL("/account", siteUrl), 303);

  const { orderId } = await context.params;
  if (!/^\d{1,12}$/.test(orderId) || Number(orderId) < 1 || !Number.isSafeInteger(Number(orderId))) {
    return NextResponse.json({ error: "Ongeldig bestelnummer." }, { status: 400 });
  }

  try {
    const result = await accountBridge<{ url: string }>("account/orders/invoice-token", {
      method: "POST",
      body: JSON.stringify({ user_id: session.id, order_id: Number(orderId) }),
    });
    const target = new URL(result.url);
    const configured = process.env.WOOCOMMERCE_URL;
    if (!configured || target.origin !== new URL(configured).origin || target.protocol !== "https:") {
      return NextResponse.json({ error: "De factuurdownload is niet veilig geconfigureerd." }, { status: 502 });
    }
    const response = NextResponse.redirect(target, 303);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/account?invoices=unavailable", siteUrl), 303);
  }
}
