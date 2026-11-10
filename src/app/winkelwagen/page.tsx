"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type CartItem = { key: string; id: number; quantity: number; name: string; prices: { price: string; currency_symbol: string }; images?: { src: string; alt?: string }[] };
type Cart = { items: CartItem[]; totals?: { total_price: string; currency_symbol: string; total_items: string }; errors?: { message: string }[] };

function money(value?: string, symbol = "€") {
  if (!value) return "";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value) / 100);
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [nonce, setNonce] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/store/cart", { cache: "no-store" });
    setNonce(response.headers.get("X-WC-Store-API-Nonce") || "");
    if (!response.ok) throw new Error("Winkelwagen kon niet worden geladen.");
    setCart(await response.json());
  }

  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  async function update(key: string, quantity: number) {
    setBusy(key); setError("");
    try {
      const response = await fetch("/api/store/cart/update-item", {
        method: "POST", headers: { "Content-Type": "application/json", Nonce: nonce },
        body: JSON.stringify({ key, quantity })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Winkelwagen bijwerken mislukt.");
      setCart(data); setNonce(response.headers.get("X-WC-Store-API-Nonce") || nonce);
    } catch (e) { setError(e instanceof Error ? e.message : "Er ging iets mis."); }
    finally { setBusy(""); }
  }

  async function remove(key: string) {
    setBusy(key); setError("");
    try {
      const response = await fetch("/api/store/cart/remove-item", {
        method: "POST", headers: { "Content-Type": "application/json", Nonce: nonce },
        body: JSON.stringify({ key })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verwijderen mislukt.");
      setCart(data); setNonce(response.headers.get("X-WC-Store-API-Nonce") || nonce);
    } catch (e) { setError(e instanceof Error ? e.message : "Er ging iets mis."); }
    finally { setBusy(""); }
  }

  return <main className="content-page cart-page">
    <div className="page-intro"><p className="eyebrow">BENDEMEN / SHOPPING BAG</p><h1>Winkelwagen</h1></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!cart ? <p>Winkelwagen laden...</p> : cart.items.length === 0 ? <div className="empty-state"><h2>Je winkelwagen is leeg</h2><p>Ontdek de collectie en vind jouw favorieten.</p><Link className="button button-dark" href="/shop">Verder winkelen</Link></div> :
      <div className="cart-layout">
        <div className="cart-items">{cart.items.map(item => <article className="cart-item" key={item.key}>
          <div className="cart-thumb">{item.images?.[0]?.src && <Image src={item.images[0].src} alt={item.images[0].alt || item.name} fill sizes="110px" />}</div>
          <div className="cart-item-info"><h2>{item.name}</h2><strong>{money(item.prices?.price)}</strong>
            <div className="quantity-control">
              <button aria-label="Aantal verlagen" onClick={() => update(item.key, Math.max(0, item.quantity - 1))} disabled={!!busy}>−</button>
              <span>{item.quantity}</span>
              <button aria-label="Aantal verhogen" onClick={() => update(item.key, item.quantity + 1)} disabled={!!busy}>+</button>
              <button className="remove-item" onClick={() => remove(item.key)} disabled={!!busy}>Verwijderen</button>
            </div>
          </div>
        </article>)}</div>
        <aside className="cart-summary"><h2>Overzicht</h2><p><span>Subtotaal</span><strong>{money(cart.totals?.total_price)}</strong></p><small>Verzendkosten en eventuele kortingen worden bij het afrekenen berekend.</small><Link className="button button-dark" href="/afrekenen">Doorgaan naar afrekenen</Link></aside>
      </div>}
  </main>;
}
