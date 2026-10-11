import Link from "next/link";
import { getProducts, type WooProduct } from "@/lib/woocommerce";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import WishlistPageClient from "./wishlist-page-client";

export const revalidate = 60;
export const metadata = { title: "Verlanglijst | Bendemen", description: "Je favoriete Bendemen-producten op één plek bewaren." };

export default async function WishlistPage() {
  let products: WooProduct[] = [];
  try { products = await getProducts(); } catch {}
  return <main className="wp-home"><SiteHeader />
    <section className="wp-content-hero"><div className="wrap"><span className="wp-eyebrow">JOUW FAVORIETEN</span><h1>Mijn verlanglijst</h1><p>Bewaar je favoriete items en kom er later eenvoudig op terug.</p><Link className="wp-text-link" href="/shop">Verder winkelen →</Link></div></section>
    <section className="wrap wp-wishlist-section"><WishlistPageClient products={products}/></section>
    <SiteFooter />
  </main>;
}
