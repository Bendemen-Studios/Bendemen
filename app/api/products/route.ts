import { NextResponse } from "next/server";
import { getProducts } from "@/lib/woocommerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ products }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Product API failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "De collectie is tijdelijk niet beschikbaar." }, { status: 502 });
  }
}
