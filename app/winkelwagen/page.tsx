import CartClient from "./cart-client";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata = {
  title: "Winkelwagen | Bendemen",
  description: "Controleer je selectie voordat je afrekent.",
};

export default function CartPage() {
  return (
    <main className="wp-home">
      <SiteHeader />
      <section className="shop-head wrap">
        <span className="wp-eyebrow">BIJNA VAN JOU</span>
        <h1>Jouw <em>winkelwagen.</em></h1>
        <p>Controleer je selectie voordat je verdergaat.</p>
      </section>
      <section className="wrap">
        <CartClient />
      </section>
      <SiteFooter />
    </main>
  );
}
