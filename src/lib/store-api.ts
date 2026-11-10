export type StoreCategory = {
  id: number;
  name: string;
  slug: string;
  is_visible?: boolean;
  visibility?: string;
  hidden?: boolean;
  catalog_visibility?: string;
};

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  description?: string;
  short_description?: string;
  status?: string;
  catalog_visibility?: string;
  is_visible?: boolean;
  hidden?: boolean;
  prices?: { price?: string; regular_price?: string; sale_price?: string; currency_code?: string; currency_symbol?: string };
  images?: { id: number; src: string; alt?: string }[];
  is_on_sale?: boolean;
  categories?: StoreCategory[];
  variations?: { id: number; attributes: { name: string; value: string }[] }[];
};

const API = process.env.WC_STORE_API_URL || "https://www.bendemen.com/wp-json/wc/store/v1";

function hiddenCategorySlugs() {
  return new Set((process.env.HIDDEN_PRODUCT_CATEGORY_SLUGS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean));
}

export function isCatalogVisible(product: StoreProduct) {
  if (product.status && product.status !== "publish") return false;
  if (product.hidden === true || product.is_visible === false || product.catalog_visibility === "hidden") return false;
  const hidden = hiddenCategorySlugs();
  return !(product.categories || []).some(category =>
    category.hidden === true || category.is_visible === false ||
    category.visibility === "hidden" || category.catalog_visibility === "hidden" ||
    hidden.has(category.slug.toLowerCase())
  );
}

export async function getProducts(perPage = 100): Promise<StoreProduct[]> {
  try {
    const response = await fetch(`${API}/products?per_page=${perPage}&orderby=menu_order&order=asc`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return [];
    const products: StoreProduct[] = await response.json();
    return products.filter(isCatalogVisible);
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
    return products.find(isCatalogVisible) ?? null;
  } catch {
    return null;
  }
}

export function formatPrice(raw?: string, symbol = "€") {
  if (!raw) return "";
  const amount = Number(raw) / 100;
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}
