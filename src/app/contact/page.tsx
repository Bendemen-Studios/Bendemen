"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/site-shell";

export default function ContactPage() {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setStatus(null);
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Versturen is niet gelukt.");
      form.reset();
      setStatus({ type: "success", message: "Bedankt! Je bericht is verstuurd. We nemen zo snel mogelijk contact met je op." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Er ging iets mis. Mail info@bendemen.nl rechtstreeks." });
    } finally {
      setSending(false);
    }
  }

  return <PageShell><main className="content-page contact-page">
    <div className="contact-card">
      <p className="eyebrow">WE HELPEN JE GRAAG</p>
      <h1>Contactformulier</h1>
      <h2>Stuur ons een bericht</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Voornaam *<input name="firstName" autoComplete="given-name" required maxLength={80} /></label>
          <label>Achternaam<input name="lastName" autoComplete="family-name" maxLength={80} /></label>
        </div>
        <label>E-mail *<input type="email" name="email" autoComplete="email" required maxLength={254} /></label>
        <label>Telefoonnummer (optioneel)<input type="tel" name="phone" autoComplete="tel" maxLength={40} /></label>
        <label>Reden van contact *
          <select name="subject" required defaultValue="">
            <option value="" disabled>Kies een onderwerp</option>
            <option value="Vraag over een bestelling">Vraag over een bestelling</option>
            <option value="Productinformatie">Productinformatie</option>
            <option value="Retourneren of ruilen">Retourneren of ruilen</option>
            <option value="Overig">Overig</option>
          </select>
        </label>
        <label>Bericht *<textarea name="message" rows={6} required minLength={10} maxLength={5000} /></label>
        <div className="contact-honeypot" aria-hidden="true"><label>Laat dit veld leeg<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <button className="button button-dark" type="submit" disabled={sending}>{sending ? "Versturen..." : "Verzend bericht ↗"}</button>
      </form>
      {status && <p className={status.type === "success" ? "contact-status success" : "contact-status error"} role="status">{status.message}</p>}
      <p className="form-note">Liever rechtstreeks mailen? <Link href="mailto:info@bendemen.nl">info@bendemen.nl</Link>.</p>
    </div>
  </main></PageShell>;
}
