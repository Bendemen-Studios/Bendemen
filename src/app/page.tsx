import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/site-shell";
import { getProducts, formatPrice } from "@/lib/store-api";
import { getMediaUrl } from "@/lib/media";

export default async function HomePage() {
  const products = await getProducts(8);
  return (
    <PageShell>
      <main>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">BENDEMEN — STREETWEAR &amp; LIFESTYLE</p>
          <h1>STREETWEAR<br />MET KARAKTER.</h1>
          <p className="hero-subtitle">Ontdek de collectie. Gemaakt om op te vallen, ontworpen om bij je te passen.</p>
          <Link className="button button-dark" href="/shop/">Shop de collectie <span>↗</span></Link>
        </div>
        <div className="hero-art" role="img" aria-label="Bendemen collectie grafische visual">
          <div className="hero-art-inner">
            <span className="hero-stamp">B</span>
            <span className="hero-vertical">MAKE YOUR MARK · BENDEMEN · MAKE YOUR MARK</span>
            <span className="hero-edition">COLLECTION<br />01 / 26</span>
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="section-heading">
          <div><p className="eyebrow">GESELECTEERD VOOR JOU</p><h2>Populaire producten</h2></div>
          <Link href="/shop" className="text-link">Bekijk alle producten ↗</Link>
        </div>
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => {
              const image = product.images?.[0];
              return (
                <Link className="product-card" href={`/shop/${product.slug}/` key={product.id}>
                  <div className="product-image">
                    {product.is_on_sale && <span className="sale-tag">SALE</span>}
                    {image?.src
                      ? <Image src={getMediaUrl(image.src)} unoptimized alt={image.alt || product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" />
                      : <div className="image-placeholder">BENDEMEN</div>}
                  </div>
                  <div className="product-meta"><h3>{product.name}</h3><span>{formatPrice(product.prices?.price)}</span></div>
                  {product.is_on_sale && product.prices?.regular_price &&
                    <p className="regular-price">{formatPrice(product.prices.regular_price)}</p>}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>De productcatalogus is momenteel niet beschikbaar.</p>
            <span>Controleer de WooCommerce Store API-verbinding.</span>
          </div>
        )}
      </section>

      <section className="story-strip">
        <p className="eyebrow">THE BENDEMEN STORY</p>
        <h2>Niet zomaar kleding.<br /><span>Een eigen karakter.</span></h2>
        <Link href="/het-verhaal/" className="button button-light">Ontdek ons verhaal ↗</Link>
      </section>
      </main>
    </PageShell>
  );
}
