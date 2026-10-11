import AccountClient from "./account-client";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata = {
  title: "Mijn account | Bendemen",
  description: "Beheer je Bendemen-account en bekijk je spaarpunten.",
};

export default function AccountPage() {
  return (
    <main className="wp-home">
      <SiteHeader />
      <section className="shop-head wrap">
        <span className="wp-eyebrow">JOUW ACCOUNT</span>
        <h1>Jouw punten.<br /><em>Jouw Bendemen.</em></h1>
        <p>Log in of maak een account aan om je spaarpunten bij te houden.</p>
      </section>
      <section className="wrap account-wrap">
        <AccountClient />
      </section>
      <SiteFooter />
    </main>
  );
}
