import { NextRequest, NextResponse } from "next/server";
import { getProduct, getProductVariations, wooFetch, type WooProduct, type WooVariation } from "@/lib/woocommerce";
import { getShippingRates, type ShippingItem } from "@/lib/shipping";
import { createMolliePayment } from "@/lib/mollie";
import { getSession } from "@/lib/auth";
import { accountBridge } from "@/lib/account-bridge";

export const runtime = "nodejs";
type WooOrder = { id: number; number: string; order_key: string; total: string; currency: string };
type CheckoutItem = { productId: number; variationId?: number; quantity: number };
type PointsQuote = { balance: number; maxPoints: number; points: number; discount: string };

const emailOk = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const textField = (v: unknown, max = 150): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();
    const items: CheckoutItem[] = body.items;
    const requestedPoints = body.pointsToRedeem == null ? 0 : body.pointsToRedeem;
    if (!Number.isSafeInteger(requestedPoints) || requestedPoints < 0 || requestedPoints > 100000000) {
      return NextResponse.json({ error: "Het aantal in te wisselen punten is ongeldig." }, { status: 400 });
    }
    if (requestedPoints > 0 && !session) {
      return NextResponse.json({ error: "Log in om punten in te wisselen." }, { status: 401 });
    }
    const required = ["firstName", "lastName", "address", "postcode", "city"];
    if (!Array.isArray(items) || items.length < 1 || items.length > 30 ||
        !emailOk(body.email) || body.acceptedTerms !== true || required.some((field) => !textField(body[field])) ||
        !textField(body.shippingRateId, 200) ||
        (body.phone != null && (typeof body.phone !== "string" || body.phone.length > 40))) {
      return NextResponse.json({ error: "Controleer je winkelwagen, bezorggegevens en verzendoptie." }, { status: 400 });
    }
    if (items.some((item) => !item || !Number.isSafeInteger(item.productId) || item.productId < 1 ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 ||
        (item.variationId != null && (!Number.isSafeInteger(item.variationId) || item.variationId < 1)))) {
      return NextResponse.json({ error: "Een product of aantal is ongeldig." }, { status: 400 });
    }

    const line_items: { product_id: number; variation_id?: number; quantity: number }[] = [];
    for (const item of items) {
      const product: WooProduct = await getProduct(item.productId);
      if (product.status !== "publish" || !["simple", "variable"].includes(product.type) || (product.type !== "variable" && (!product.purchasable || product.stock_status === "outofstock"))) {
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

    if (session && body.email.trim().toLowerCase() !== session.email.toLowerCase()) {
      return NextResponse.json({ error: "Gebruik het e-mailadres van je Bendemen-account om punten te sparen." }, { status: 400 });
    }

    const firstName = body.firstName.trim();
    const lastName = body.lastName.trim();
    const address = body.address.trim();
    const postcode = body.postcode.trim().toUpperCase();
    const city = body.city.trim();
    const billing = {
      first_name: firstName, last_name: lastName, address_1: address,
      postcode, city, country: "NL",
      email: body.email.trim().toLowerCase(), ...(typeof body.phone === "string" && body.phone.trim() ? { phone: body.phone.trim() } : {}),
    };

    // Never trust a shipping amount from the browser. Recalculate the selected rate
    // server-side for the current cart and destination before creating the order.
    const shippingRates = await getShippingRates(items.map((item): ShippingItem => ({
      productId: item.productId, quantity: item.quantity,
      ...(item.variationId ? { variationId: item.variationId } : {}),
    })), { country: "NL", address_1: address, postcode, city });
    const selectedRate = shippingRates.find((rate) => rate.id === body.shippingRateId);
    if (!selectedRate) {
      return NextResponse.json({ error: "Deze verzendoptie is niet meer beschikbaar. Haal de verzendopties opnieuw op." }, { status: 409 });
    }

    let pointsQuote: PointsQuote | null = null;
    if (requestedPoints > 0 && session) {
      pointsQuote = await accountBridge<PointsQuote>("points/quote", {
        method: "POST",
        body: JSON.stringify({
          user_id: session.id, items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, ...(item.variationId ? { variationId: item.variationId } : {}) })),
          destination: { country: "NL", address_1: address, postcode, city }, points: requestedPoints,
        }),
      });
      if (!pointsQuote.points || Number(pointsQuote.discount) <= 0 || pointsQuote.points > requestedPoints) {
        return NextResponse.json({ error: "Er kan geen geldige puntenkorting worden toegepast. Bereken de korting opnieuw." }, { status: 409 });
      }
    }

    const order = await wooFetch<WooOrder>("orders", {
      method: "POST",
      body: JSON.stringify({
        status: "pending", set_paid: false, currency: "EUR", created_via: "bendemen-headless-shop", customer_id: session?.id ?? 0,
        payment_method: "mollie", payment_method_title: "Mollie",
        billing,
        shipping: { first_name: firstName, last_name: lastName, address_1: address,
          postcode, city, country: "NL" },
        line_items,
        shipping_lines: [{
          method_id: selectedRate.method_id,
          method_title: selectedRate.label,
          instance_id: selectedRate.instance_id,
          total: Number(selectedRate.cost).toFixed(2),
          taxes: selectedRate.taxes.map((tax) => ({ id: tax.id, total: Number(tax.total).toFixed(2) })),
        }],
        ...(pointsQuote ? { fee_lines: [{ name: "Puntenkorting", total: (-Number(pointsQuote.discount)).toFixed(2), tax_status: "none" }] } : {}),
        customer_note: typeof body.note === "string" ? body.note.trim().slice(0, 500) : "",
        meta_data: [
          { key: "bendemen_headless_source", value: "bendemen-headless-shop" },
          { key: "bendemen_shipping_rate_id", value: selectedRate.id },
          ...(pointsQuote ? [{ key: "_bendemen_points_discount", value: Number(pointsQuote.discount).toFixed(2) }] : []),
        ],
      }),
    });
    if (order.currency !== "EUR") throw new Error("WooCommerce store currency must be EUR for Mollie checkout");
    if (!Number.isFinite(Number(order.total)) || Number(order.total) <= 0) {
      throw new Error("WooCommerce returned an invalid order total; check taxes and shipping configuration");
    }

    if (pointsQuote && session) {
      try {
        await accountBridge<{ ok: boolean; points: number }>("points/redeem", {
          method: "POST",
          body: JSON.stringify({ user_id: session.id, order_id: order.id, points: pointsQuote.points, discount: pointsQuote.discount }),
        });
      } catch (error) {
        await wooFetch("orders/" + order.id, {
          method: "PUT", body: JSON.stringify({ status: "failed", customer_note: "Punteninwisseling kon niet worden afgerond." }),
        }).catch(() => undefined);
        throw error;
      }
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
