import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site-shell";
import { getProduct, formatPrice } from "@/lib/store-api";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <PageShell><main className="content-page product-detail">
    <div className="product-detail-grid">
      <div className="product-detail-image">
        {product.images?.[0]?.src ? <Image src={product.images[0].src} alt={product.images[0].alt || product.name} fill sizes="(max-width: 760px) 100vw, 50vw" /> : <div className="image-placeholder">BENDEMEN</div>}
      </div>
      <section className="product-detail-copy">
        <p className="eyebrow">BENDEMEN COLLECTION</p>
        <h1>{product.name}</h1>
        {product.is_on_sale && <span className="sale-tag detail-sale">SALE</span>}
        <p className="detail-price">{formatPrice(product.prices?.price)}</p>
        {product.description ? <div className="product-description" dangerouslySetInnerHTML={{ __html: product.description }} /> : product.short_description ? <div className="product-description" dangerouslySetInnerHTML={{ __html: product.short_description }} /> : null}
        <p className="form-note">De productinformatie komt rechtstreeks uit WooCommerce. Bestellen via de nieuwe webshop wordt in een volgende fase gekoppeld.</p>
      </section>
    </div>
  </main></PageShell>;
}
