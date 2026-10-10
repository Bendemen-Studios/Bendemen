'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { id: number; name: string; price: string; quantity: number; variationId?: number; variationLabel?: string };
const money = (value: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);

export default function CheckoutClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bendemen-cart") || "[]");
      setItems(Array.isArray(stored) ? stored.filter((item) => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : []);
    } catch { setItems([]); }
    setReady(true);
  }, []);

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity, ...(item.variationId ? { variationId: item.variationId } : {}) })),
          email: form.get("email"), firstName: form.get("firstName"), lastName: form.get("lastName"),
          address: form.get("address"), postcode: form.get("postcode"), city: form.get("city"),
          phone: form.get("phone"), note: form.get("note"), acceptedTerms: form.get("acceptedTerms") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Afrekenen is niet gelukt.");
      if (typeof data.checkoutUrl !== "string" || !data.checkoutUrl.startsWith("https://")) throw new Error("De betaalpagina kon niet veilig worden geopend.");
      window.location.assign(data.checkoutUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Er ging iets mis. Probeer het opnieuw.");
      setBusy(false);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + Math.max(0, Number(item.price) || 0) * item.quantity, 0);
  return <div className="checkout-layout">
    <form action={submit} className="checkout-form">
      <section className="checkout-section">
        <h2>1. Contactgegevens</h2>
        <label>E-mailadres<input type="email" name="email" required maxLength={254} autoComplete="email" /></label>
        <label>Telefoonnummer <span className="optional">(optioneel)</span><input type="tel" name="phone" maxLength={40} autoComplete="tel" /></label>
      </section>
      <section className="checkout-section">
        <h2>2. Bezorgadres</h2>
        <div className="form-row">
          <label>Voornaam<input name="firstName" required maxLength={150} autoComplete="given-name" /></label>
          <label>Achternaam<input name="lastName" required maxLength={150} autoComplete="family-name" /></label>
        </div>
        <label>Straat en huisnummer<input name="address" required maxLength={150} autoComplete="street-address" /></label>
        <div className="form-row">
          <label>Postcode<input name="postcode" required maxLength={20} autoComplete="postal-code" /></label>
          <label>Woonplaats<input name="city" required maxLength={150} autoComplete="address-level2" /></label>
        </div>
        <label>Land<input value="Nederland" readOnly aria-readonly="true" /></label>
        <label>Opmerking bij je bestelling <span className="optional">(optioneel)</span><textarea name="note" rows={3} maxLength={500} placeholder="Bijvoorbeeld bezorginstructies" /></label>
      </section>
      <section className="checkout-section">
        <h2>3. Controleren en betalen</h2>
        <label className="consent-row"><input type="checkbox" name="acceptedTerms" required /> <span>Ik heb de <Link href="/voorwaarden" target="_blank">algemene voorwaarden</Link> gelezen en het <Link href="/privacy" target="_blank">privacybeleid</Link> bekeken.</span></label>
        <p className="secure-note">Je betaalt veilig via de beveiligde betaalomgeving van Mollie. WooCommerce berekent het definitieve totaal inclusief btw en verzending. Je ziet het bedrag op de Mollie-betaalpagina voordat je de betaling bevestigt.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button checkout-submit" disabled={busy || !ready || !items.length}>
          {busy ? "Bestelling voorbereiden…" : "Bestelling plaatsen en naar Mollie →"}
        </button>
        <small>Je bestelling wordt pas als betaald gemarkeerd nadat Mollie de betaling server-side heeft bevestigd.</small>
      </section>
    </form>
    <aside className="checkout-summary">
      <h2>Jouw bestelling</h2>
      {!ready ? <p>Winkelwagen laden…</p> : items.length ? <>
        {items.map((item) => <div className="checkout-line" key={item.id + "-" + (item.variationId || 0)}>
          <span><b>{item.name}</b><small>Aantal: {item.quantity}</small></span>
          <strong>{money((Number(item.price) || 0) * item.quantity)}</strong>
        </div>)}
        <div className="checkout-total"><span>Indicatief subtotaal</span><strong>{money(subtotal)}</strong></div>
        <p className="summary-disclaimer">Verzendkosten en btw kunnen afwijken. WooCommerce berekent het definitieve ordertotaal. Mollie toont het bedrag voordat je de betaling bevestigt.</p>
      </> : <div className="empty-checkout"><p>Je winkelwagen is leeg.</p><Link href="/shop">Bekijk de collectie →</Link></div>}
      <Link className="text-button" href="/winkelwagen">← Terug naar winkelwagen</Link>
    </aside>
  </div>;
}
