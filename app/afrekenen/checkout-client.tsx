'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Item = { id: number; name: string; price: string; quantity: number; variationId?: number; variationLabel?: string };
type ShippingRate = { id: string; method_id: string; instance_id: number; label: string; cost: string; taxes: { id: number; total: string }[]; total: string };
const money = (value: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);

export default function CheckoutClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRateId, setSelectedShippingRateId] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const quoteRequestId = useRef(0);

  function invalidateShippingQuote() {
    quoteRequestId.current += 1;
    setShippingRates([]);
    setSelectedShippingRateId("");
    setShippingError("");
    setShippingLoading(false);
  }

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bendemen-cart") || "[]");
      setItems(Array.isArray(stored) ? stored.filter((item) => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : []);
    } catch { setItems([]); }
    setReady(true);
  }, []);

  async function refreshShippingRates() {
    if (!items.length || !address.trim() || postcode.trim().length < 4 || !city.trim()) return;
    const requestId = ++quoteRequestId.current;
    setShippingLoading(true);
    setShippingError("");
    setShippingRates([]);
    setSelectedShippingRateId("");
    try {
      const response = await fetch("/api/shipping", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity, ...(item.variationId ? { variationId: item.variationId } : {}) })),
          destination: { country: "NL", address_1: address.trim(), postcode: postcode.trim(), city: city.trim() },
        }),
      });
      const data = await response.json();
      if (requestId !== quoteRequestId.current) return;
      if (!response.ok) throw new Error(data.error || "Verzendopties ophalen is niet gelukt.");
      const rates: ShippingRate[] = Array.isArray(data.rates) ? data.rates : [];
      setShippingRates(rates);
      if (rates.length) setSelectedShippingRateId(rates[0].id);
      else setShippingError("Er zijn geen verzendopties beschikbaar voor dit adres. Controleer de verzendzones in WooCommerce.");
    } catch (reason) {
      if (requestId === quoteRequestId.current) setShippingError(reason instanceof Error ? reason.message : "Verzendopties ophalen is niet gelukt.");
    } finally {
      if (requestId === quoteRequestId.current) setShippingLoading(false);
    }
  }

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      if (!selectedShippingRateId) throw new Error("Vul je volledige bezorgadres in en haal de verzendopties op.");
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity, ...(item.variationId ? { variationId: item.variationId } : {}) })),
          email: form.get("email"), firstName: form.get("firstName"), lastName: form.get("lastName"),
          address: form.get("address"), postcode: form.get("postcode"), city: form.get("city"),
          phone: form.get("phone"), note: form.get("note"), acceptedTerms: form.get("acceptedTerms") === "on",
          shippingRateId: selectedShippingRateId,
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
  const selectedRate = shippingRates.find((rate) => rate.id === selectedShippingRateId);
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
        <label>Straat en huisnummer<input name="address" required maxLength={150} autoComplete="street-address" value={address} onChange={(event) => { setAddress(event.target.value); invalidateShippingQuote(); }} onBlur={() => void refreshShippingRates()} /></label>
        <div className="form-row">
          <label>Postcode<input name="postcode" required maxLength={20} autoComplete="postal-code" value={postcode} onChange={(event) => { setPostcode(event.target.value); invalidateShippingQuote(); }} onBlur={() => void refreshShippingRates()} /></label>
          <label>Woonplaats<input name="city" required maxLength={150} autoComplete="address-level2" value={city} onChange={(event) => { setCity(event.target.value); invalidateShippingQuote(); }} onBlur={() => void refreshShippingRates()} /></label>
        </div>
        <label>Land<input value="Nederland" readOnly aria-readonly="true" /></label>
        <label>Opmerking bij je bestelling <span className="optional">(optioneel)</span><textarea name="note" rows={3} maxLength={500} placeholder="Bijvoorbeeld bezorginstructies" /></label>
        <div className="shipping-options" aria-live="polite">
          <h3>Verzendmethode</h3>
          {!shippingRates.length && !shippingLoading && <p>Vul straat, postcode en woonplaats in om de beschikbare verzendopties te bekijken.</p>}
          {shippingLoading && <p>Verzendopties ophalen…</p>}
          {shippingError && <p className="form-error" role="alert">{shippingError}</p>}
          {shippingRates.map((rate) => <label className="consent-row" key={rate.id}>
            <input type="radio" name="shippingRate" value={rate.id} checked={selectedShippingRateId === rate.id} onChange={() => setSelectedShippingRateId(rate.id)} />
            <span>{rate.label} <strong>{money(Number(rate.total))}</strong></span>
          </label>)}
        </div>
      </section>
      <section className="checkout-section">
        <h2>3. Controleren en betalen</h2>
        <label className="consent-row"><input type="checkbox" name="acceptedTerms" required /> <span>Ik heb de <Link href="/voorwaarden" target="_blank">algemene voorwaarden</Link> gelezen en het <Link href="/privacy" target="_blank">privacybeleid</Link> bekeken.</span></label>
        <p className="secure-note">Je betaalt veilig via de beveiligde betaalomgeving van Mollie. Het definitieve ordertotaal wordt door WooCommerce berekend op basis van je producten, verzendkeuze en btw-instellingen.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button checkout-submit" disabled={busy || !ready || !items.length || !selectedShippingRateId || shippingLoading}>
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
        {selectedRate && <div className="checkout-total"><span>{selectedRate.label}</span><strong>{money(Number(selectedRate.total))}</strong></div>}
        <p className="summary-disclaimer">Verzendtarief opgehaald uit WooCommerce. Het definitieve totaal inclusief btw verschijnt op de beveiligde betaalpagina.</p>
      </> : <div className="empty-checkout"><p>Je winkelwagen is leeg.</p><Link href="/shop">Bekijk de collectie →</Link></div>}
      <Link className="text-button" href="/winkelwagen">← Terug naar winkelwagen</Link>
    </aside>
  </div>;
}
