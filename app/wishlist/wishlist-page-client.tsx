"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import WishlistButton from "@/components/wishlist-button";

const STORAGE_KEY = "bendemen-wishlist";
const EVENT_NAME = "bendemen-wishlist-updated";
type Product = { id: number; name: string; slug: string; price: string; regular_price: string; images: { src: string; alt?: string }[]; categories: { name: string }[] };
type Saved = { id: number; name: string };

export default function WishlistPageClient({ products }: { products: Product[] }) {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    const refresh = () => {
      try {
        const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Saved[];
        setIds(Array.isArray(items) ? items.map((item) => item.id).filter(Number.isInteger) : []);
      } catch { setIds([]); }
    };
    refresh();
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(EVENT_NAME, refresh); window.removeEventListener("storage", refresh); };
  }, []);
  const saved = useMemo(() => products.filter((product) => ids.includes(product.id)), [products, ids]);

  if (!ids.length) return <div className="wishlist-empty"><Heart size={30}/><h2>Je verlanglijst is nog leeg</h2><p>Bewaar je favoriete producten met het hartje en vind ze hier terug.</p><Link className="wp-red-button" href="/shop">Ontdek de collectie <ShoppingBag size={16}/></Link></div>;
  return <div className="wp-wishlist-grid">{saved.map((product) => <article className="wp-wishlist-card" key={product.id}>
    <Link href={`/shop/${product.slug}/`} className="wp-wishlist-image">
      {product.images?.[0]?.src ? <Image src={product.images[0].src} alt={product.images[0].alt || product.name} fill sizes="(max-width: 760px) 50vw, 25vw"/> : <span>B.</span>}
    </Link>
    <div className="wp-wishlist-meta"><div><h2><Link href={`/shop/${product.slug}/`}>{product.name}</Link></h2><p>{product.categories?.[0]?.name || "BENDEMEN"}</p><strong>{new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}).format(Number(product.price || product.regular_price || 0))}</strong></div><WishlistButton productId={product.id} productName={product.name}/></div>
  </article>)}</div>;
}
