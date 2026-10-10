import { NextRequest, NextResponse } from "next/server";
import { getProduct, getProductVariations, wooFetch, type WooProduct, type WooVariation } from "@/lib/woocommerce";
import { createMolliePayment } from "@/lib/mollie";

export const runtime = "nodejs";
type WooOrder = { id: number; number: string; order_key: string; total: string };
type CheckoutItem = { productId: number; variationId?: number; quantity: number };

const emailOk = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const textField = (v: unknown, max = 150): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CheckoutItem[] = body.items;
    const required = ["firstName", "lastName", "address", "postcode", "city"];
    if (!Array.isArray(items) || items.length < 1 || items.length > 30 ||
        !emailOk(body.email) || body.acceptedTerms !== true || required.some((field) => !textField(body[field])) ||
        (body.phone != null && (typeof body.phone !== "string" || body.phone.length > 40))) {
      return NextResponse.json({ error: "Controleer je winkelwagen en alle verplichte gegevens." }, { status: 400 });
    }
    if (items.some((item) => !item || !Number.isSafeInteger(item.productId) || item.productId < 1 ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 ||
        (item.variationId != null && (!Number.isSafeInteger(item.variationId) || item.variationId < 1)))) {
      return NextResponse.json({ error: "Een product of aantal is ongeldig." }, { status: 400 });
    }
    const shippingMethodId = process.env.WOOCOMMERCE_SHIPPING_METHOD_ID;
    const shippingTitle = process.env.WOOCOMMERCE_SHIPPING_METHOD_TITLE || "Verzending";
    const shippingCost = process.env.WOOCOMMERCE_SHIPPING_COST;
    if (!shippingMethodId || shippingCost == null || !Number.isFinite(Number(shippingCost)) || Number(shippingCost) < 0) {
      return NextResponse.json({ error: "De webshop is nog niet klaar om bestellingen te verzenden. Stel de verzendmethode in." }, { status: 503 });
    }

    const line_items: { product_id: number; variation_id?: number; quantity: number }[] = [];
    for (const item of items) {
      const product: WooProduct = await getProduct(item.productId);
      if (product.status !== "publish" || (product.type !== "variable" && (!product.purchasable || product.stock_status === "outofstock"))) {
        return NextResponse.json({ error: product.name + " is niet beschikbaar." }, { status: 409 });
      }
      if (product.type === "variable") {
        if (!item.variationId) {
          return NextResponse.json({ error: "Kies eerst een variant van " + product.name + "." }, { status: 400 });
        }
        const variants: WooVariation[] = await getProductVariations(product.id);
        const variant = variants.find((v) => v.id === item.variationId);
        if (!variant || !variant.purchasable || variant.stock_status === "outofstock") {
          return NextResponse.json({ error: "Deze productvariant is niet meer beschikbaar. Ververs de productpagina." }, { status: 409 });
        }
        if (variant.manage_stock && typeof variant.stock_quantity === "number" && item.quantity > variant.stock_quantity) {
          return NextResponse.json({ error: "Er zijn niet genoeg exemplaren van deze variant op voorraad." }, { status: 409 });
        }
        line_items.push({ product_id: product.id, variation_id: variant.id, quantity: item.quantity });
      } else {
        if (item.variationId) return NextResponse.json({ error: "Ongeldige productvariant." }, { status: 400 });
        if (product.manage_stock && typeof product.stock_quantity === "number" && item.quantity > product.stock_quantity) {
          return NextResponse.json({ error: "Er zijn niet genoeg exemplaren van " + product.name + " op voorraad." }, { status: 409 });
        }
        line_items.push({ product_id: product.id, quantity: item.quantity });
      }
    }

    const firstName = body.firstName.trim();
    const lastName = body.lastName.trim();
    const billing = {
      first_name: firstName, last_name: lastName, address_1: body.address.trim(),
      postcode: body.postcode.trim().toUpperCase(), city: body.city.trim(), country: "NL",
      email: body.email.trim().toLowerCase(), ...(typeof body.phone === "string" && body.phone.trim() ? { phone: body.phone.trim() } : {}),
    };
    const order = await wooFetch<WooOrder>("orders", {
      method: "POST",
      body: JSON.stringify({
        status: "pending", set_paid: false, currency: "EUR", created_via: "bendemen-headless-shop",
        payment_method: "mollie", payment_method_title: "Mollie",
        billing,
        shipping: { first_name: firstName, last_name: lastName, address_1: body.address.trim(),
          postcode: body.postcode.trim().toUpperCase(), city: body.city.trim(), country: "NL" },
        line_items,
        shipping_lines: [{ method_id: shippingMethodId, method_title: shippingTitle, total: Number(shippingCost).toFixed(2) }],
        customer_note: typeof body.note === "string" ? body.note.trim().slice(0, 500) : "",
        meta_data: [{ key: "bendemen_headless_source", value: "bendemen-headless-shop" }],
      }),
    });
    if (!Number.isFinite(Number(order.total)) || Number(order.total) <= 0) {
      throw new Error("WooCommerce returned an invalid order total; check taxes and shipping configuration");
    }

    try {
      const payment = await createMolliePayment({
        amount: order.total, description: "Bendemen bestelling " + order.number,
        orderId: order.id, orderKey: order.order_key, email: billing.email,
      });
      await wooFetch("orders/" + order.id, {
        method: "PUT",
        body: JSON.stringify({ meta_data: [{ key: "bendemen_mollie_payment_id", value: payment.id }] }),
      });
      return NextResponse.json({ checkoutUrl: payment.checkoutUrl });
    } catch (error) {
      await wooFetch("orders/" + order.id, {
        method: "PUT", body: JSON.stringify({ status: "failed", customer_note: "Betaling kon niet worden gestart." }),
      }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    console.error("Checkout failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Afrekenen lukt nu niet. Controleer je gegevens en probeer het opnieuw." }, { status: 502 });
  }
}
