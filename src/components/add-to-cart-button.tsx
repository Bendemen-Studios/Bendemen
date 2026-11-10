"use client";

import { useState } from "react";

export function AddToCartButton({ productId, disabled = false }: { productId: number; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function add() {
    setLoading(true);
    setMessage("");
    try {
      const cart = await fetch("/api/store/cart", { credentials: "same-origin", cache: "no-store" });
      const nonce = cart.headers.get("X-WC-Store-API-Nonce") || "";
      const response = await fetch("/api/store/cart/add-item", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...(nonce ? { Nonce: nonce } : {}) },
        body: JSON.stringify({ id: productId, quantity: 1 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Toevoegen is niet gelukt.");
      window.dispatchEvent(new CustomEvent("bendemen:cart-updated", { detail: data }));
      setMessage("Toegevoegd aan je winkelwagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Er ging iets mis.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="add-cart-wrap">
    <button className="button button-dark" onClick={add} disabled={disabled || loading}>
      {loading ? "Even geduld..." : "Voeg toe aan winkelwagen"}
    </button>
    {message && <p className="cart-feedback" role="status">{message}</p>}
  </div>;
}
