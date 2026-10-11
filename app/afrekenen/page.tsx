import CheckoutClient from "./checkout-client";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata = {
  title: "Veilig afrekenen | Bendemen",
  description: "Vul je bezorggegevens in om je bestelling af te ronden.",
};

export default function CheckoutPage() {
  return (
    <main className="wp-home">
      <SiteHeader />
      <section className="shop-head wrap">
        <span className="wp-eyebrow">VEILIG AFREKENEN</span>
        <h1>Jouw gegevens.<br /><em>Dan regelen wij de rest.</em></h1>
        <p>Vul je bezorggegevens in om door te gaan naar Mollie.</p>
      </section>
      <section className="wrap" style={{ paddingBottom: 80 }}>
        <CheckoutClient />
      </section>
      <SiteFooter />
    </main>
  );
}
