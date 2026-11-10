export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  description?: string;
  short_description?: string;
  prices?: { price?: string; regular_price?: string; sale_price?: string; currency_code?: string; currency_symbol?: string };
  images?: { id: number; src: string; alt?: string }[];
  is_on_sale?: boolean;
  categories?: { id: number; name: string; slug: string }[];
  variations?: { id: number; attributes: { name: string; value: string }[] }[];
};

const API = process.env.WC_STORE_API_URL || "https://www.bendemen.com/wp-json/wc/store/v1";

export async function getProducts(perPage = 100): Promise<StoreProduct[]> {
  try {
    const response = await fetch(`${API}/products?per_page=${perPage}&orderby=menu_order&order=asc`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export async function getProduct(slug: string): Promise<StoreProduct | null> {
  try {
    const response = await fetch(`${API}/products?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return null;
    const products: StoreProduct[] = await response.json();
    return products[0] ?? null;
  } catch {
    return null;
  }
}

export function formatPrice(raw?: string, symbol = "€") {
  if (!raw) return "";
  const amount = Number(raw) / 100;
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}
