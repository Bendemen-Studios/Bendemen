import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ status: "ok", service: "bendemen-booster", timestamp: new Date().toISOString(), port: Number(process.env.PORT || 2003), wordpressConfigured: Boolean(process.env.WORDPRESS_URL), adminTokenConfigured: Boolean(process.env.BOOSTER_ADMIN_TOKEN), bridgeSecretConfigured: Boolean(process.env.WORDPRESS_BRIDGE_SECRET) }, { headers: { "Cache-Control": "no-store" } }); }
