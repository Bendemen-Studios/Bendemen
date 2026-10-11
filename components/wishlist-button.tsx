"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

const STORAGE_KEY = "bendemen-wishlist";
const EVENT_NAME = "bendemen-wishlist-updated";
type SavedProduct = { id: number; name: string };

function readWishlist(): SavedProduct[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SavedProduct[];
    return Array.isArray(value) ? value.filter((item) => Number.isInteger(item.id) && typeof item.name === "string") : [];
  } catch { return []; }
}

export function emitWishlistUpdate() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export default function WishlistButton({ productId, productName }: { productId: number; productName: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const refresh = () => setSaved(readWishlist().some((item) => item.id === productId));
    refresh();
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [productId]);

  function toggle() {
    const items = readWishlist();
    const next = saved ? items.filter((item) => item.id !== productId) : [...items.filter((item) => item.id !== productId), { id: productId, name: productName }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(!saved);
    emitWishlistUpdate();
  }

  return <button type="button" className={`wishlist-toggle${saved ? " is-saved" : ""}`} aria-label={saved ? `Verwijder ${productName} van verlanglijst` : `Bewaar ${productName} op verlanglijst`} aria-pressed={saved} onClick={toggle}>
    <Heart size={18} fill={saved ? "currentColor" : "none"} strokeWidth={1.8} />
  </button>;
}
