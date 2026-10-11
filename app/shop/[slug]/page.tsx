import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatPrice, getProducts, getProductVariations, type WooProduct, type WooVariation } from "@/lib/woocommerce";
import ProductActions from "@/app/product/[id]/product-actions";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import WishlistButton from "@/components/wishlist-button";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const product = (await getProducts()).find((item) => item.slug === slug);
    return product ? { title: product.name + " | Bendemen", description: product.short_description.replace(/<[^>]*>/g, " ").trim() } : { title: "Product niet gevonden | Bendemen" };
  } catch { return { title: "Product | Bendemen" }; }
}

export default async function ProductBySlugPage({ params }: Props) {
  const { slug } = await params;
  let product: WooProduct;
  try {
    const found = (await getProducts()).find((item) => item.slug === slug);
    if (!found || found.status !== "publish") notFound();
    product = found;
  } catch { notFound(); }
  let variations: WooVariation[] = [];
  if (product.type === "variable") {
    try { variations = await getProductVariations(product.id); } catch { variations = []; }
  }
  const variantPrices = variations.map((item) => Number(item.price)).filter((price) => Number.isFinite(price) && price > 0);
  const price = product.price || (variantPrices.length ? String(Math.min(...variantPrices)) : product.regular_price);
  return <main className="wp-home">
    <SiteHeader />
    <nav className="wp-breadcrumb wrap" aria-label="Broodkruimelpad"><Link href="/shop/"><ArrowLeft size={14}/> Shop</Link><span>/</span><span>{product.name}</span></nav>
    <section className="detail wrap">
      <div className="detail-image">
        {product.images?.[0]?.src ? <Image src={product.images[0].src} alt={product.images[0].alt || product.name} fill priority sizes="(max-width: 760px) 100vw, 50vw" /> : <div className="image-placeholder">B.</div>}
      </div>
      <div className="detail-copy">
        <span className="eyebrow">{product.categories?.[0]?.name || "BENDEMEN"}</span>
        <h1>{product.name}</h1>
        <div className="price">{product.type === "variable" ? "Vanaf " : ""}{formatPrice(price)}</div>
        {product.regular_price && product.sale_price && Number(product.sale_price) < Number(product.regular_price) && <p className="wp-product-sale">Was {formatPrice(product.regular_price)} · Nu {formatPrice(product.sale_price)}</p>}
        <div className="product-description" dangerouslySetInnerHTML={{ __html: product.short_description || product.description || "" }} />
        <p className={product.stock_status === "instock" ? "stock-available" : "stock-unavailable"}>{product.stock_status === "instock" ? "Op voorraad" : "Momenteel niet op voorraad"}</p>
        <WishlistButton productId={product.id} productName={product.name}/>
        <ProductActions product={{ id: product.id, name: product.name, price: price || "0", image: product.images?.[0]?.src || "", type: product.type }} disabled={product.type !== "variable" && (!product.purchasable || product.stock_status === "outofstock")} attributes={product.attributes || []} variations={variations} />
        <p className="checkout-note">Veilig afrekenen via Mollie. Je bestelling wordt verwerkt in WooCommerce.</p>
        <Link className="wp-text-link" href="/shop/">Verder winkelen</Link>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
