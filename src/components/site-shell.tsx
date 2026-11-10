import Link from "next/link";

export function SiteHeader() {
  return <>
    <div className="announcement">Streetwear &amp; Lifestyle met karakter.</div>
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Bendemen home">BENDEMEN<span>®</span></Link>
      <nav aria-label="Hoofdnavigatie">
        <Link href="/">Home</Link><Link href="/shop/">Shop</Link>
        <Link href="/het-verhaal/">Het Verhaal</Link><Link href="/contact/">Contact</Link>
      </nav>
      <Link href="/winkelwagen/" className="cart-link">Winkelwagen <span>↗</span></Link>
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="footer">
    <Link href="/" className="wordmark">BENDEMEN<span>®</span></Link>
    <p>Streetwear &amp; Lifestyle met karakter.</p>
    <div className="footer-links">
      <Link href="/terms-and-conditions/">Algemene voorwaarden</Link>
      <Link href="/privacyverklaring-eu/">Privacyverklaring</Link>
      <Link href="/retour-beleid/">Retourbeleid</Link>
      <Link href="/levering-betaling-beleid/">Levering &amp; betaling</Link>
      <Link href="/ons-bedrijf/">Ons bedrijf</Link>
      <Link href="/goede-doelen/">Goede doelen</Link>
      <Link href="/cookiebeleid-eu/">Cookiebeleid</Link>
    </div>
    <small>© {new Date().getFullYear()} Bendemen. Alle rechten voorbehouden.</small>
  </footer>;
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}
