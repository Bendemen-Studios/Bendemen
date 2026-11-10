import Image from "next/image";
import Link from "next/link";

type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  prices?: { price?: string; regular_price?: string };
  images?: { id: number; src: string; alt?: string }[];
  is_on_sale?: boolean;
};

async function getProducts(): Promise<StoreProduct[]> {
  const base = process.env.WC_STORE_API_URL || "https://www.bendemen.com/wp-json/wc/store/v1";
  try {
    const response = await fetch(`${base}/products?per_page=8&orderby=popularity`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

function formatPrice(raw?: string) {
  if (!raw) return "";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" })
    .format(Number(raw) / 100);
}

export default async function HomePage() {
  const products = await getProducts();
  return (
    <main>
      <div className="announcement">Streetwear &amp; Lifestyle met karakter.</div>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="Bendemen home">BENDEMEN<span>®</span></Link>
        <nav aria-label="Hoofdnavigatie">
          <Link href="/">Home</Link><Link href="/shop">Shop</Link>
          <Link href="/het-verhaal">Het Verhaal</Link><Link href="/contact">Contact</Link>
        </nav>
        <Link href="/winkelwagen" className="cart-link">Winkelwagen <span>0</span></Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">BENDEMEN — STREETWEAR &amp; LIFESTYLE</p>
          <h1>STREETWEAR<br />MET KARAKTER.</h1>
          <p className="hero-subtitle">Ontdek de collectie. Gemaakt om op te vallen, ontworpen om bij je te passen.</p>
          <Link className="button button-dark" href="/shop">Shop de collectie <span>↗</span></Link>
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
                <Link className="product-card" href={`/product/${product.slug}`} key={product.id}>
                  <div className="product-image">
                    {product.is_on_sale && <span className="sale-tag">SALE</span>}
                    {image?.src
                      ? <Image src={image.src} alt={image.alt || product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" />
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
        <Link href="/het-verhaal" className="button button-light">Ontdek ons verhaal ↗</Link>
      </section>
      <footer className="footer">
        <Link href="/" className="wordmark">BENDEMEN<span>®</span></Link>
        <p>Streetwear &amp; Lifestyle met karakter.</p>
        <small>© {new Date().getFullYear()} Bendemen. Alle rechten voorbehouden.</small>
      </footer>
    </main>
  );
}
