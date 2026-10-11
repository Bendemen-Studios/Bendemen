import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, PackageCheck, ShieldCheck } from "lucide-react";
import { getProducts, formatPrice, type WooProduct } from "@/lib/woocommerce";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const revalidate = 60;

const heroImage = "https://www.bendemen.com/wp-content/uploads/2026/02/streetwear-modellen-voor-graffiti-muur-bendemen-collection.jpg";

export default async function Home() {
  let products: WooProduct[] = [];
  try { products = (await getProducts()).slice(0, 4); } catch {}

  return (
    <main className="wp-home">
      <SiteHeader />
      <section className="wp-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.64) 0%, rgba(0,0,0,.28) 52%, rgba(0,0,0,.08) 100%), url("${heroImage}")` }}>
        <div className="wp-hero-copy">
          <span className="wp-eyebrow">BENDEMEN · STREETWEAR &amp; LIFESTYLE</span>
          <h1>Bendemen</h1>
          <p>Streetwear &amp; Lifestyle met karakter.</p>
          <Link className="wp-red-button" href="/shop">Shop de Collectie <ArrowUpRight size={17} /></Link>
        </div>
        <span className="wp-hero-caption">BENDemen · EEN EIGEN MERK, EEN EIGEN KOERS</span>
      </section>

      <section className="wp-benefits" aria-label="Waarom Bendemen">
        <div><ShieldCheck size={25} /><span><strong>Veilig bestellen</strong><small>Veilig afrekenen</small></span></div>
        <div><PackageCheck size={25} /><span><strong>Levering &amp; service</strong><small>Duidelijke bestelupdates</small></span></div>
        <div><Heart size={25} /><span><strong>Met karakter</strong><small>Voor iedereen die zichzelf blijft</small></span></div>
      </section>

      <section className="wp-products">
        <div className="wp-section-heading">
          <div><span className="wp-eyebrow">ONTDEK BENDEMEN</span><h2>Populaire Producten</h2></div>
          <Link className="wp-text-link" href="/shop">Bekijk alle producten <ArrowUpRight size={16} /></Link>
        </div>
        {products.length ? (
          <div className="wp-product-grid">
            {products.map((product) => (
              <Link className="wp-product-card" href={"/product/" + product.id} key={product.id}>
                <div className="wp-product-image">
                  {product.images?.[0]?.src ? <Image src={product.images[0].src} alt={product.images[0].alt || product.name} fill sizes="(max-width: 680px) 50vw, (max-width: 1000px) 33vw, 25vw" /> : <span className="wp-product-placeholder">B.</span>}
                </div>
                <div className="wp-product-info"><div><h3>{product.name}</h3><p>{product.categories?.[0]?.name || "BENDEMEN"}</p></div><strong>{formatPrice(product.price)}</strong></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="wp-products-empty"><h3>Populaire Producten</h3><p>De producten konden nu niet worden geladen. Bekijk de volledige collectie in de shop.</p><Link className="wp-red-button" href="/shop">Naar de shop <ArrowUpRight size={17} /></Link></div>
        )}
      </section>

      <section className="wp-story" id="verhaal">
        <div><span className="wp-eyebrow">HET VERHAAL ACHTER BENDEMEN</span><h2>Streetwear &amp; Lifestyle<br /><em>met karakter.</em></h2><p>Bendemen staat voor premium kwaliteit en producten voor iedereen die zichzelf blijft.</p><Link className="wp-text-link" href="/het-verhaal">Lees het verhaal <ArrowUpRight size={16} /></Link></div>
      </section>
      <SiteFooter />
    </main>
  );
}
