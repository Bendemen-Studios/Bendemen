import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/site-shell";
import { getProducts, formatPrice } from "@/lib/store-api";

export const metadata = { title: "Shop alle producten | Bendemen", description: "Bekijk de volledige Bendemen collectie: streetwear, kleding en lifestyle." };

export default async function ShopPage() {
  const products = await getProducts(100);
  return <PageShell><main className="content-page shop-page">
    <div className="page-intro"><p className="eyebrow">BENDEMEN COLLECTION</p><h1>Shop alle producten</h1><p>Ontdek de collectie van Bendemen.</p></div>
    {products.length ? <div className="product-grid">
      {products.map(product => <Link className="product-card" href={`/product/${product.slug}`} key={product.id}>
        <div className="product-image">
          {product.is_on_sale && <span className="sale-tag">SALE</span>}
          {product.images?.[0]?.src ? <Image src={product.images[0].src} alt={product.images[0].alt || product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" /> : <div className="image-placeholder">BENDEMEN</div>}
        </div>
        <div className="product-meta"><h3>{product.name}</h3><span>{formatPrice(product.prices?.price)}</span></div>
        {product.is_on_sale && product.prices?.regular_price && <p className="regular-price">{formatPrice(product.prices.regular_price)}</p>}
      </Link>)}
    </div> : <div className="empty-state"><p>De producten konden niet worden geladen.</p><span>Controleer de verbinding met WooCommerce.</span></div>}
  </main></PageShell>;
}
