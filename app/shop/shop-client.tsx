'use client';

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import WishlistButton from "@/components/wishlist-button";
type WooProduct = { id: number; name: string; short_description: string; categories: { id: number; name: string }[]; images: { src: string; alt?: string }[]; stock_status: string; type: string; price: string; regular_price: string };
const formatPrice = (value: string | number) => { const amount = Number(value); return Number.isFinite(amount) ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount) : "Prijs op aanvraag"; };

export default function ShopClient({ products }: { products: WooProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const categories = useMemo(() => {
    const seen = new Map<number, string>();
    products.forEach((product) => product.categories.forEach((item) => seen.set(item.id, item.name)));
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "nl"));
  }, [products]);
  const visible = useMemo(() => {
    const filtered = products.filter((product) =>
      (category === "all" || product.categories.some((item) => String(item.id) === category)) &&
      (product.name + " " + product.short_description + " " + product.categories.map((c) => c.name).join(" "))
        .toLocaleLowerCase("nl").includes(query.trim().toLocaleLowerCase("nl"))
    );
    if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "nl"));
    if (sort === "price-asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
    return filtered;
  }, [products, query, category, sort]);

  return <>
    <div className="shop-controls" aria-label="Producten filteren">
      <label className="shop-search">Zoeken
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek een product…" type="search" />
      </label>
      <label>Categorie
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Alle categorieën</option>
          {categories.map((item) => <option value={String(item.id)} key={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label>Sorteren
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">Aanbevolen</option>
          <option value="name">Naam: A–Z</option>
          <option value="price-asc">Prijs: laag naar hoog</option>
          <option value="price-desc">Prijs: hoog naar laag</option>
        </select>
      </label>
    </div>
    <p className="shop-result-count">{visible.length} {visible.length === 1 ? "product" : "producten"}</p>
    {visible.length ? <div className="product-grid">{visible.map((product) =>
      <article className="product-card-wrap" key={product.id}>
        <Link className="product-card" href={"/shop/" + (("slug" in product && product.slug) || product.id) + "/"}>
          <div className="product-image">
            {product.images?.[0]?.src ? <Image src={product.images[0].src} alt={product.images[0].alt || product.name} fill sizes="(max-width: 760px) 50vw, (max-width: 1180px) 25vw, 280px" /> : <div className="image-placeholder">B.</div>}
            {product.stock_status === "outofstock" && <span className="stock-label">Uitverkocht</span>}
          </div>
          <div className="product-meta"><div><h3>{product.name}</h3><p>{product.categories?.[0]?.name || "BENDEMEN"}</p></div><strong>{product.type === "variable" && !product.price ? "Vanaf " : ""}{formatPrice(product.price || product.regular_price)}</strong></div>
        </Link>
        <WishlistButton productId={product.id} productName={product.name}/>
      </article>
    )}</div> : <div className="empty-products"><h3>Geen producten gevonden.</h3><p>Pas je zoekopdracht of filters aan.</p><button className="button" onClick={() => { setQuery(""); setCategory("all"); setSort("featured"); }}>Wis filters</button></div>}
  </>;
}
