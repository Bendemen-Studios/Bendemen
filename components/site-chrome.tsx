import Link from "next/link";
import { Heart, UserRound, ShoppingBag, Menu } from "lucide-react";

const logoUrl = "https://www.bendemen.com/wp-content/uploads/2025/12/Kopie-van-Bendemen-Logo-Slogan-1.png";

export function SiteHeader() {
  return (
    <>
      <div className="wp-announcement">Streetwear &amp; Lifestyle met karakter.</div>
      <header className="wp-header">
        <div className="wp-header-inner">
          <Link className="wp-logo" href="/" aria-label="Bendemen home">
            <span className="wp-logo-image" style={{ backgroundImage: `url("${logoUrl}")` }} />
          </Link>
          <nav className="wp-nav" aria-label="Hoofdnavigatie">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/ons-bedrijf/">Het Verhaal</Link>
            <Link href="/goede-doelen/">Goede Doelen</Link>
            <Link href="/contact/">Contact</Link>
          </nav>
          <div className="wp-header-actions">
            <Link href="/wishlist/" aria-label="Verlanglijst"><Heart size={20} strokeWidth={1.8} /></Link>
            <Link href="/account" aria-label="Mijn account"><UserRound size={20} strokeWidth={1.8} /></Link>
            <Link href="/winkelwagen" aria-label="Winkelwagen"><ShoppingBag size={20} strokeWidth={1.8} /></Link>
          </div>
          <details className="wp-mobile-menu">
            <summary aria-label="Menu openen"><Menu size={23} /></summary>
            <nav aria-label="Mobiele navigatie">
              <Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/ons-bedrijf/">Het Verhaal</Link><Link href="/goede-doelen/">Goede Doelen</Link><Link href="/contact/">Contact</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="wp-footer">
      <div className="wp-footer-trust">
        <div><span className="wp-trust-icon">✦</span><strong>Met karakter</strong><small>Streetwear &amp; lifestyle</small></div>
        <div><span className="wp-trust-icon">↗</span><strong>Snelle levering</strong><small>Bestel eenvoudig online</small></div>
        <div><span className="wp-trust-icon">♥</span><strong>Met aandacht gekozen</strong><small>Bedankt voor je support</small></div>
      </div>
      <div className="wp-footer-main">
        <div className="wp-footer-brand">
          <Link className="wp-footer-wordmark" href="/">BENDEMEN<span>®</span></Link>
          <p>Bendemen staat voor streetwear met karakter. Premium kwaliteit en gemaakt voor iedereen die zichzelf blijft.</p>
          <a href="https://nl.trustpilot.com/review/bendemen.nl" target="_blank" rel="noreferrer">Bekijk alle reviews ↗</a>
        </div>
        <div><h2>Informatie</h2><Link href="/voorwaarden">Algemene voorwaarden</Link><Link href="/privacy">Privacyverklaring</Link><Link href="/retour-beleid/">Retourbeleid</Link><Link href="/levering-betaling-beleid/">Levering &amp; betaling</Link><Link href="/disclaimer/">Disclaimer</Link></div>
        <div><h2>Links</h2><a href="https://status.bendemen.com/" target="_blank" rel="noreferrer">Storingen</a><Link href="/goede-doelen/">Goede doelen</Link><Link href="/blog/">Blog</Link><Link href="/contact/">Contact</Link></div>
        <div><h2>Contact</h2><p>Forel 2c<br />3225 PA Hellevoetsluis</p><a href="mailto:info@bendemen.nl">info@bendemen.nl</a></div>
      </div>
      <div className="wp-footer-bottom"><span>© {new Date().getFullYear()} Bendemen. Alle rechten voorbehouden.</span><span>Streetwear &amp; Lifestyle met karakter.</span></div>
    </footer>
  );
}
