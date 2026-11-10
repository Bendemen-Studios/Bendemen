import Link from "next/link";

export function SiteHeader() {
  return <>
    <div className="announcement">Streetwear &amp; Lifestyle met karakter.</div>
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Bendemen home">BENDEMEN<span>®</span></Link>
      <nav aria-label="Hoofdnavigatie">
        <Link href="/">Home</Link><Link href="/shop">Shop</Link>
        <Link href="/het-verhaal">Het Verhaal</Link><Link href="/contact">Contact</Link>
      </nav>
      <Link href="/winkelwagen" className="cart-link">Winkelwagen <span>0</span></Link>
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="footer">
    <Link href="/" className="wordmark">BENDEMEN<span>®</span></Link>
    <p>Streetwear &amp; Lifestyle met karakter.</p>
    <small>© {new Date().getFullYear()} Bendemen. Alle rechten voorbehouden.</small>
  </footer>;
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}
