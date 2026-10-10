import Link from "next/link";
import AccountClient from "./account-client";
export const metadata = { title: "Mijn account | Bendemen", description: "Beheer je Bendemen-account en bekijk je spaarpunten." };
export default function AccountPage() {
  return <main><div className="announcement">BENDEMEN · MIJN ACCOUNT</div><header className="header wrap"><Link className="wordmark" href="/">BENDEMEN<span>®</span></Link><nav><Link href="/shop">Shop</Link><Link href="/winkelwagen">Winkelwagen</Link></nav></header><section className="shop-head wrap"><span className="eyebrow">JOUW ACCOUNT</span><h1>Jouw punten.<br/><em>Jouw Bendemen.</em></h1><p>Log in of maak een account aan om je spaarpunten bij te houden.</p></section><section className="wrap account-wrap"><AccountClient /></section><footer className="footer wrap"><Link className="wordmark" href="/">BENDEMEN<span>®</span></Link><span>© {new Date().getFullYear()} Bendemen</span></footer></main>;
}
