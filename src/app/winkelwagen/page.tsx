"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site-shell";
import { getMediaUrl } from "@/lib/media";

type CartItem = { key: string; id: number; quantity: number; name: string; prices: { price: string; currency_symbol: string }; images?: { src: string; alt?: string }[] };
type Cart = {
  items: CartItem[];
  coupons?: { code: string; totals?: { total_discount: string } }[];
  totals?: { total_price: string; total_items: string; total_shipping?: string; total_tax?: string; total_discount?: string };
};

function money(value?: string) {
  if (value == null) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value) / 100);
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [nonce, setNonce] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/store/cart", { cache: "no-store", credentials: "same-origin" });
    setNonce(response.headers.get("X-WC-Store-API-Nonce") || "");
    if (!response.ok) throw new Error("Winkelwagen kon niet worden geladen.");
    setCart(await response.json());
  }

  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  async function mutate(endpoint: string, body: object, label: string) {
    setBusy(label); setError("");
    try {
      const response = await fetch(`/api/store/cart/${endpoint}`, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", Nonce: nonce },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data?.data?.message || `${label} is mislukt.`);
      setCart(data); setNonce(response.headers.get("X-WC-Store-API-Nonce") || nonce);
    } catch (e) { setError(e instanceof Error ? e.message : "Er ging iets mis."); }
    finally { setBusy(""); }
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!coupon.trim()) return;
    setCouponBusy(true); setError("");
    try {
      const response = await fetch("/api/store/cart/apply-coupon", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", Nonce: nonce },
        body: JSON.stringify({ code: coupon.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Kortingscode kon niet worden toegepast.");
      setCoupon(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Kortingscode kon niet worden toegepast."); }
    finally { setCouponBusy(false); }
  }

  async function removeCoupon(code: string) {
    setCouponBusy(true); setError("");
    try {
      const response = await fetch("/api/store/cart/remove-coupon", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", Nonce: nonce },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Kortingscode verwijderen is mislukt.");
      setCart(data); setNonce(response.headers.get("X-WC-Store-API-Nonce") || nonce);
    } catch (e) { setError(e instanceof Error ? e.message : "Er ging iets mis."); }
    finally { setCouponBusy(false); }
  }

  return <PageShell><main className="content-page cart-page">
    <div className="page-intro"><p className="eyebrow">BENDEMEN / SHOPPING BAG</p><h1>Winkelwagen</h1></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!cart ? <p>Winkelwagen laden...</p> : cart.items.length === 0 ? <div className="empty-state"><h2>Je winkelwagen is leeg</h2><p>Ontdek de collectie en vind jouw favorieten.</p><Link className="button button-dark" href="/shop">Verder winkelen</Link></div> :
      <div className="cart-layout">
        <div className="cart-items">{cart.items.map(item => <article className="cart-item" key={item.key}>
          <div className="cart-thumb">{item.images?.[0]?.src && <Image src={getMediaUrl(item.images[0].src)} unoptimized alt={item.images[0].alt || item.name} fill sizes="110px" />}</div>
          <div className="cart-item-info"><h2>{item.name}</h2><strong>{money(item.prices?.price)}</strong>
            <div className="quantity-control">
              <button aria-label="Aantal verlagen" onClick={() => mutate("update-item", { key: item.key, quantity: Math.max(0, item.quantity - 1) }, item.key)} disabled={!!busy}>−</button>
              <span>{item.quantity}</span>
              <button aria-label="Aantal verhogen" onClick={() => mutate("update-item", { key: item.key, quantity: item.quantity + 1 }, item.key)} disabled={!!busy}>+</button>
              <button className="remove-item" onClick={() => mutate("remove-item", { key: item.key }, item.key)} disabled={!!busy}>Verwijderen</button>
            </div>
          </div>
        </article>)}
          <form className="coupon-form" onSubmit={applyCoupon}><label htmlFor="coupon-code">Kortingscode</label><div><input id="coupon-code" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Vul je kortingscode in"/><button className="button button-dark" disabled={couponBusy || !coupon.trim()}>{couponBusy ? "Toepassen..." : "Toepassen"}</button></div></form>
          {cart.coupons?.map(c => <div className="applied-coupon" key={c.code}><span>Code <strong>{c.code}</strong> toegepast</span><button onClick={() => removeCoupon(c.code)} disabled={couponBusy}>Verwijderen</button></div>)}
        </div>
        <aside className="cart-summary"><h2>Overzicht</h2>
          <p><span>Subtotaal en kortingen</span><strong>{money(cart.totals?.total_price)}</strong></p>
          {cart.totals?.total_discount && Number(cart.totals.total_discount)>0 && <p><span>Korting</span><strong>− {money(cart.totals.total_discount)}</strong></p>}
          {cart.totals?.total_shipping && <p><span>Verzending</span><strong>{money(cart.totals.total_shipping)}</strong></p>}
          {cart.totals?.total_tax && <p><span>BTW</span><strong>{money(cart.totals.total_tax)}</strong></p>}
          <small>Definitieve verzendkosten en belastingen worden berekend zodra je je adres invult.</small>
          <Link className="button button-dark" href="/afrekenen">Doorgaan naar afrekenen</Link>
        </aside>
      </div>}
  </main></PageShell>;
}
