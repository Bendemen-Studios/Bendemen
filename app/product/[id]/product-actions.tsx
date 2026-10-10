'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";

type Attribute = { id: number; name: string; options: string[]; variation?: boolean };
type Variation = {
  id: number; price: string; purchasable: boolean; stock_status: string;
  attributes: { id: number; name: string; option: string }[];
};
type Product = { id: number; name: string; price: string; image: string; type: string };
type CartItem = Product & { quantity: number; variationId?: number; variationLabel?: string };

export default function ProductActions({
  product, disabled, attributes = [], variations = [],
}: {
  product: Product; disabled: boolean; attributes?: Attribute[]; variations?: Variation[];
}) {
  const selectable = attributes.filter((attribute) => attribute.variation && attribute.options.length > 0);
  const initial = variations.find((variation) => variation.purchasable && variation.stock_status !== "outofstock") || variations[0];
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(selectable.map((attribute) => [
      attribute.name,
      initial?.attributes.find((item) => item.name === attribute.name)?.option || attribute.options[0],
    ]))
  );
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const chosen = useMemo(() => variations.find((variation) =>
    variation.purchasable && variation.stock_status !== "outofstock" &&
    selectable.every((attribute) => {
      const value = variation.attributes.find((item) => item.name === attribute.name)?.option;
      return !value || value === selected[attribute.name];
    })
  ), [variations, selectable, selected]);
  const variationLabel = selectable.map((attribute) => selected[attribute.name]).filter(Boolean).join(" · ");
  const isUnavailable = disabled || (product.type === "variable" && (!chosen || selectable.some((attribute) => !selected[attribute.name])));

  function add() {
    setError("");
    if (isUnavailable) {
      setError("Kies een beschikbare productvariant.");
      return;
    }
    try {
      const key = "bendemen-cart";
      const raw = JSON.parse(localStorage.getItem(key) || "[]");
      const items: CartItem[] = Array.isArray(raw) ? raw : [];
      const item = items.find((entry) => entry.id === product.id && entry.variationId === chosen?.id);
      if (item) item.quantity = Math.min(99, item.quantity + 1);
      else items.push({
        ...product, name: product.name + (variationLabel ? " — " + variationLabel : ""),
        price: chosen?.price || product.price, quantity: 1,
        ...(chosen ? { variationId: chosen.id, variationLabel } : {}),
      });
      localStorage.setItem(key, JSON.stringify(items));
      setAdded(true);
    } catch {
      setError("Toevoegen lukte niet. Probeer het opnieuw.");
    }
  }

  return <div className="product-actions">
    {selectable.map((attribute) => <label key={attribute.id} className="variant-field">{attribute.name}
      <select value={selected[attribute.name] || ""} onChange={(event) => { setSelected((current) => ({ ...current, [attribute.name]: event.target.value })); setAdded(false); }}>
        {attribute.options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    </label>)}
    {product.type === "variable" && chosen && <p className="variant-price">Variantprijs: <strong>{new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(chosen.price))}</strong></p>}
    <div className="product-action-row">
      <button className="button" disabled={isUnavailable} onClick={add}>
        <ShoppingBag size={16}/>{isUnavailable ? "Niet beschikbaar" : added ? "Toegevoegd ✓" : "Voeg toe aan winkelwagen"}
      </button>
      {added && <Link className="under-link" href="/winkelwagen">Bekijk winkelwagen ↗</Link>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
