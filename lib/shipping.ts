import "server-only";

export type ShippingItem = { productId: number; variationId?: number; quantity: number };
export type ShippingDestination = {
  country: "NL";
  address_1: string;
  postcode: string;
  city: string;
};
export type ShippingRate = {
  id: string;
  method_id: string;
  instance_id: number;
  label: string;
  cost: string;
  taxes: { id: number; total: string }[];
  total: string;
};

export async function getShippingRates(items: ShippingItem[], destination: ShippingDestination): Promise<ShippingRate[]> {
  const base = process.env.WOOCOMMERCE_URL;
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  if (!base || !key || !secret || key.includes("replace_me") || secret.includes("replace_me")) {
    throw new Error("WooCommerce API is not configured");
  }

  const endpoint = new URL("/wp-json/bendemen/v1/shipping-rates", base);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(key + ":" + secret).toString("base64"),
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ items, destination }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Shipping rate request failed (" + response.status + ")" + (detail ? ": " + detail.slice(0, 250) : ""));
  }

  const payload = await response.json() as { rates?: ShippingRate[] };
  if (!Array.isArray(payload.rates)) throw new Error("WooCommerce returned invalid shipping rates");
  return payload.rates.filter((rate) =>
    typeof rate.id === "string" && typeof rate.method_id === "string" &&
    Number.isInteger(rate.instance_id) && typeof rate.label === "string" &&
    Number.isFinite(Number(rate.cost)) && Number.isFinite(Number(rate.total)) &&
    Array.isArray(rate.taxes)
  );
}
