'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { id: number; name: string; price: string; image: string; quantity: number; variationId?: number; variationLabel?: string };
const money = (value: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
const sameItem = (a: Item, b: Item) => a.id === b.id && a.variationId === b.variationId;

export default function CartClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bendemen-cart") || "[]");
      setItems(Array.isArray(stored) ? stored.filter((item) => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : []);
    } catch { setItems([]); }
    setReady(true);
  }, []);
  function save(next: Item[]) {
    setItems(next);
    localStorage.setItem("bendemen-cart", JSON.stringify(next));
  }
  const total = items.reduce((sum, item) => sum + Math.max(0, Number(item.price) || 0) * item.quantity, 0);
  if (!ready) return <div className="empty-products" aria-live="polite">Winkelwagen laden…</div>;
  return items.length ? <>
    <div className="cart-list">
      {items.map((item) => <div key={item.id + "-" + (item.variationId || 0)} className="cart-item">
        <div className="cart-image">{item.image && <img src={item.image} alt="" loading="lazy" />}</div>
        <div className="cart-item-main">
          <b>{item.name}</b>
          {item.variationLabel && <small>{item.variationLabel}</small>}
          <span>{money(Number(item.price) || 0)} per stuk</span>
          <div className="quantity-control" aria-label={"Aantal voor " + item.name}>
            <button type="button" onClick={() => save(items.map((entry) => sameItem(entry, item) ? { ...entry, quantity: Math.max(1, entry.quantity - 1) } : entry))} aria-label="Aantal verlagen">−</button>
            <span>{item.quantity}</span>
            <button type="button" onClick={() => save(items.map((entry) => sameItem(entry, item) ? { ...entry, quantity: Math.min(99, entry.quantity + 1) } : entry))} aria-label="Aantal verhogen" disabled={item.quantity >= 99}>+</button>
          </div>
        </div>
        <strong className="cart-line-total">{money((Number(item.price) || 0) * item.quantity)}</strong>
        <button type="button" className="remove-item" onClick={() => save(items.filter((entry) => !sameItem(entry, item)))} aria-label={item.name + " verwijderen"}>Verwijderen</button>
      </div>)}
    </div>
    <div className="cart-summary">
      <p><span>Indicatief subtotaal</span><b>{money(total)}</b></p>
      <small>Dit is een indicatie op basis van de winkelwagen. WooCommerce controleert prijzen, voorraad, btw en verzendkosten opnieuw voordat je betaalt.</small>
      <Link className="button" href="/afrekenen">Verder naar afrekenen →</Link>
      <button type="button" className="text-button" onClick={() => save([])}>Winkelwagen leegmaken</button>
    </div>
  </> : <div className="empty-products"><h3>Je winkelwagen is nog leeg.</h3><p>Ontdek de collectie en voeg je favoriete producten toe.</p><Link className="button" href="/shop">Naar de shop →</Link></div>;
}
