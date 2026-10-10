'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
type Points = { balance: number; label: string; user: { email: string; firstName: string; lastName: string } };
export default function AccountClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [points, setPoints] = useState<Points | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refundNotice, setRefundNotice] = useState("");
  async function load() {
    const response = await fetch("/api/account/points", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setPoints(data);
    else setPoints(null);
  }
  useEffect(() => {
    void load();
    if (new URLSearchParams(window.location.search).get("refunds") === "unavailable") {
      setRefundNotice("De terugbetalingspagina is niet beschikbaar. Controleer of YITH Advanced Refund System actief is en probeer het opnieuw.");
    }
  }, []);
  async function submit(form: FormData) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/account/auth", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email: form.get("email"), password: form.get("password"),
          firstName: form.get("firstName"), lastName: form.get("lastName") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Dit is niet gelukt.");
      await load();
      setMessage(mode === "register" ? "Je account is aangemaakt." : "Je bent ingelogd.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Dit is niet gelukt."); }
    finally { setBusy(false); }
  }
  async function logout() {
    await fetch("/api/account/auth", { method: "DELETE" });
    setPoints(null); setMessage("Je bent uitgelogd."); setError("");
  }
  return <section className="account-card">
    {points ? <>
      <span className="eyebrow">MIJN BENDEMEN</span>
      <h2>Welkom terug, {points.user.firstName}.</h2>
      <p className="account-email">{points.user.email}</p>
      <div className="points-balance"><strong>{points.balance}</strong><span>{points.label || "punten"}</span></div>
      <p>Je puntensaldo wordt beheerd door WooCommerce Points &amp; Rewards.</p>
      <div className="account-actions"><Link className="button" href="/shop">Verder winkelen ↗</Link><button className="text-button" type="button" onClick={() => void logout()}>Uitloggen</button></div>
    </> : <>
      <span className="eyebrow">MIJN BENDEMEN</span>
      <h2>{mode === "login" ? "Log in." : "Maak je account."}</h2>
      <p>Log in om je puntensaldo te bekijken en punten te sparen bij bestellingen.</p>
      <form action={submit} className="account-form">
        {mode === "register" && <div className="form-row"><label>Voornaam<input name="firstName" required maxLength={100} autoComplete="given-name" /></label><label>Achternaam<input name="lastName" required maxLength={100} autoComplete="family-name" /></label></div>}
        <label>E-mailadres<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label>Wachtwoord<input name="password" type="password" required minLength={mode === "register" ? 12 : 1} maxLength={256} autoComplete={mode === "register" ? "new-password" : "current-password"} /></label>
        {mode === "register" && <small>Gebruik minimaal 12 tekens.</small>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? "Even geduld…" : mode === "login" ? "Inloggen" : "Account aanmaken"}</button>
      </form>
      <button className="text-button" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }}>
        {mode === "login" ? "Nog geen account? Maak er een aan." : "Heb je al een account? Log in."}
      </button>
    </>}
  </section>;
}
