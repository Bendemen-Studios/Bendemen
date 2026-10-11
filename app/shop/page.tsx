import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getProducts, type WooProduct } from "@/lib/woocommerce";
import ShopClient from "./shop-client";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const revalidate = 60;

export default async function Shop() {
  let products: WooProduct[] = [];
  let unavailable = false;
  try { products = await getProducts(); } catch { unavailable = true; }
  return (
    <main className="wp-home">
      <SiteHeader />
      <section className="shop-head wrap">
        <span className="wp-eyebrow">DE COLLECTIE</span>
        <h1>Streetwear &amp; Lifestyle<br/><em>met karakter.</em></h1>
        <p>Ontdek de collectie van Bendemen.</p>
        <Link className="wp-text-link" href="/">Terug naar home <ArrowUpRight size={16}/></Link>
      </section>
      <section className="collection wrap">
        {unavailable
          ? <div className="empty-products"><h3>De winkel is tijdelijk niet bereikbaar.</h3><p>De verbinding met WooCommerce is mislukt. Probeer het later opnieuw.</p></div>
          : products.length
            ? <ShopClient products={products}/>
            : <div className="empty-products"><h3>Nog geen producten zichtbaar.</h3><p>Publiceer producten in WooCommerce om ze hier te tonen.</p></div>}
      </section>
      <SiteFooter />
    </main>
  );
}
