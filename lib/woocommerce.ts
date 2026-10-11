import "server-only";
import { getRedisJson, setRedisJson } from "@/lib/redis";

export type WooCategory = { id: number; name: string; slug: string };
export type WooAttribute = { id: number; name: string; options: string[]; variation?: boolean };
export type WooImage = { id: number; src: string; alt?: string };
export type WooProduct = {
  id: number; name: string; slug: string; type: "simple" | "variable" | "grouped" | "external";
  status: string; description: string; short_description: string; sku: string;
  price: string; regular_price: string; sale_price: string; purchasable: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder"; stock_quantity?: number | null;
  manage_stock?: boolean; categories: WooCategory[]; images: WooImage[];
  attributes: WooAttribute[]; variations: number[];
};
export type WooVariation = {
  id: number; price: string; regular_price: string; sale_price: string; purchasable: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder"; stock_quantity?: number | null; manage_stock?: boolean;
  attributes: { id: number; name: string; option: string }[];
};

function apiUrl(path: string) {
  const base = process.env.WOOCOMMERCE_URL;
  if (!base) throw new Error("WOOCOMMERCE_URL is not configured");
  return new URL("/wp-json/wc/v3/" + path.replace(/^\\/+/, ""), base);
}

export async function wooFetch<T>(
  path: string,
  init: RequestInit = {},
  options: { revalidateSeconds?: number; cacheTags?: string[] } = {},
): Promise<T> {
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  if (!key || !secret || key.includes("replace_me") || secret.includes("replace_me")) {
    throw new Error("WooCommerce REST API credentials are not configured");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", "Basic " + Buffer.from(key + ":" + secret).toString("base64"));
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  // Only explicitly opted-in public catalogue requests are cached. Orders,
  // stock checks, account data, shipping and checkout keep the default no-store.
  const cacheOptions = options.revalidateSeconds
    ? {
        cache: "force-cache" as const,
        next: {
          revalidate: options.revalidateSeconds,
          ...(options.cacheTags?.length ? { tags: options.cacheTags } : {}),
        },
      }
    : { cache: "no-store" as const };

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    ...cacheOptions,
    signal: init.signal ?? AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("WooCommerce API returned " + response.status + (detail ? ": " + detail.slice(0, 300) : ""));
  }
  return response.json() as Promise<T>;
}

export async function getProducts(): Promise<WooProduct[]> {
  const storeHost = new URL(process.env.WOOCOMMERCE_URL || "https://www.bendemen.com").host;
  const cacheKey = "bendemen:woocommerce:products:v1:" + storeHost;
  const cached = await getRedisJson<WooProduct[]>(cacheKey);
  if (cached) return cached;

  const products = await wooFetch<WooProduct[]>(
    "products?status=publish&per_page=100&orderby=menu_order&order=asc",
    {},
    { revalidateSeconds: 60, cacheTags: ["woocommerce-products"] },
  );
  await setRedisJson(cacheKey, products, 60);
  return products;
}

// Intentionally uncached: these reads are used for product detail, stock and
// checkout validation. Checkout must always validate the current WooCommerce data.
export async function getProduct(id: number): Promise<WooProduct> {
  return wooFetch<WooProduct>("products/" + id);
}
export async function getProductVariations(id: number): Promise<WooVariation[]> {
  return wooFetch<WooVariation[]>("products/" + id + "/variations?per_page=100");
}
export function formatPrice(value: string | number): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Prijs op aanvraag";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}
