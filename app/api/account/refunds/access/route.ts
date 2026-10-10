import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { accountBridge } from "@/lib/account-bridge";
export const runtime = "nodejs";
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/account", process.env.NEXT_PUBLIC_SITE_URL || "https://test.bendemen.com"));
  try {
    const result = await accountBridge<{ url: string }>("refunds/access-token", {
      method: "POST", body: JSON.stringify({ user_id: session.id }),
    });
    const target = new URL(result.url);
    const configured = process.env.WOOCOMMERCE_URL;
    if (!configured || target.origin !== new URL(configured).origin || target.protocol !== "https:") {
      return NextResponse.json({ error: "De veilige terugbetalingspagina is niet correct geconfigureerd." }, { status: 502 });
    }
    return NextResponse.redirect(target, 303);
  } catch {
    const response = NextResponse.redirect(new URL("/account?refunds=unavailable", process.env.NEXT_PUBLIC_SITE_URL || "https://test.bendemen.com"), 303);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
