import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getProduct, getProductVariations, type WooProduct, type WooVariation } from "@/lib/woocommerce";
import ProductActions from "./product-actions";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import WishlistButton from "@/components/wishlist-button";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  let product: WooProduct;
  try {
    product = await getProduct(Number(id));
    if (product.status !== "publish") notFound();
  } catch {
    notFound();
  }
  let variations: WooVariation[] = [];
  if (product.type === "variable") {
    try { variations = await getProductVariations(product.id); } catch { variations = []; }
  }
  const variantPrices = variations.map((item) => Number(item.price)).filter((price) => Number.isFinite(price) && price > 0);
  const price = product.price || (variantPrices.length ? String(Math.min(...variantPrices)) : product.regular_price);

  return <main>
    <SiteHeader />
    <section className="detail wrap">
      <div className="detail-image">
        {product.images?.[0]?.src ? <Image src={product.images[0].src} alt={product.images[0].alt || product.name} fill priority sizes="(max-width: 760px) 100vw, 50vw" /> : <div className="image-placeholder">B.</div>}
      </div>
      <div className="detail-copy">
        <span className="eyebrow">{product.categories?.[0]?.name || "BENDEMEN"}</span>
        <h1>{product.name}</h1>
        <div className="price">{product.type === "variable" ? "Vanaf " : ""}{formatPrice(price)}</div>
        <div className="product-description" dangerouslySetInnerHTML={{ __html: product.short_description || product.description || "" }} />
        <p className={product.stock_status === "instock" ? "stock-available" : "stock-unavailable"}>
          {product.stock_status === "instock" ? "Op voorraad" : "Momenteel niet op voorraad"}
        </p>
        <WishlistButton productId={product.id} productName={product.name}/>
        <ProductActions
          product={{ id: product.id, name: product.name, price: price || "0", image: product.images?.[0]?.src || "", type: product.type }}
          disabled={product.type !== "variable" && (!product.purchasable || product.stock_status === "outofstock")}
          attributes={product.attributes || []}
          variations={variations}
        />
        <p className="checkout-note">Veilig afrekenen via Mollie. Je bestelling wordt verwerkt in WooCommerce.</p>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
