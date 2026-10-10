import Link from "next/link";
import { getProducts } from "@/lib/woocommerce";
import ShopClient from "./shop-client";

export const dynamic = "force-dynamic";

export default async function Shop() {
  let products = [];
  let unavailable = false;
  try {
    products = await getProducts();
  } catch {
    unavailable = true;
  }
  return <main>
    <div className="announcement">BENDEMEN · DE COLLECTIE</div>
    <header className="header wrap">
      <Link className="wordmark" href="/">BENDEMEN<span>®</span></Link>
      <nav><Link href="/shop">Shop</Link><Link href="/">Home</Link></nav>
      <Link className="under-link" href="/winkelwagen">Winkelwagen ↗</Link>
    </header>
    <section className="shop-head wrap">
      <span className="eyebrow">DE COLLECTIE</span>
      <h1>Producten met<br/><em>een eigen karakter.</em></h1>
      <p>Ontdek wat bij jou past.</p>
    </section>
    <section className="collection wrap">
      {unavailable
        ? <div className="empty-products"><h3>De winkel is tijdelijk niet bereikbaar.</h3><p>De verbinding met WooCommerce is mislukt. Probeer het later opnieuw.</p></div>
        : products.length
          ? <ShopClient products={products}/>
          : <div className="empty-products"><h3>Nog geen producten zichtbaar.</h3><p>Publiceer producten in WooCommerce om ze hier te tonen.</p></div>}
    </section>
    <footer className="footer wrap"><Link className="wordmark" href="/">BENDEMEN<span>®</span></Link><span>© {new Date().getFullYear()} Bendemen</span><Link href="/winkelwagen">Winkelwagen</Link></footer>
  </main>;
}
