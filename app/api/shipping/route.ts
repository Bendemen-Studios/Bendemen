import { NextRequest, NextResponse } from "next/server";
import { getShippingRates, type ShippingDestination, type ShippingItem } from "@/lib/shipping";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = body.items as ShippingItem[];
    const destination = body.destination as ShippingDestination;

    if (!Array.isArray(items) || items.length < 1 || items.length > 30 ||
        items.some((item) => !item || !Number.isSafeInteger(item.productId) || item.productId < 1 ||
          !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 ||
          (item.variationId != null && (!Number.isSafeInteger(item.variationId) || item.variationId < 1))) ||
        !destination || destination.country !== "NL" ||
        typeof destination.address_1 !== "string" || !destination.address_1.trim() || destination.address_1.length > 150 ||
        typeof destination.postcode !== "string" || !destination.postcode.trim() || destination.postcode.length > 20 ||
        typeof destination.city !== "string" || !destination.city.trim() || destination.city.length > 150) {
      return NextResponse.json({ error: "Vul je bezorgadres in en controleer je winkelwagen." }, { status: 400 });
    }

    const rates = await getShippingRates(items, {
      country: "NL",
      address_1: destination.address_1.trim(),
      postcode: destination.postcode.trim().toUpperCase(),
      city: destination.city.trim(),
    });
    return NextResponse.json({ rates });
  } catch (error) {
    console.error("Shipping quote failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Verzendopties konden niet worden opgehaald. Controleer de verzendinstellingen en probeer opnieuw." }, { status: 502 });
  }
}
