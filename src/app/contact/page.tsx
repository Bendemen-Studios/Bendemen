import Link from "next/link";
import { PageShell } from "@/components/site-shell";

export const metadata = { title: "Contact | Bendemen", description: "Neem contact op met Bendemen." };

export default function ContactPage() {
  return <PageShell><main className="content-page contact-page">
    <div className="contact-card">
      <p className="eyebrow">WE HELPEN JE GRAAG</p>
      <h1>Contact Formulier</h1>
      <h2>Mail ons via dit formulier</h2>
      <form action="mailto:info@bendemen.nl" method="post" encType="text/plain">
        <div className="form-row"><label>Voornaam *<input name="Voornaam" required /></label><label>Achternaam<input name="Achternaam" /></label></div>
        <label>Contact van Naam<input name="Contact van Naam" /></label>
        <label>E-mail *<input type="email" name="E-mail" required /></label>
        <label>Telefoonnummer (Optioneel)<input type="tel" name="Telefoonnummer" /></label>
        <label>Reden van Contact *<select name="Reden van Contact" required defaultValue=""><option value="" disabled>Kies een onderwerp</option><option>Vraag over een bestelling</option><option>Productinformatie</option><option>Retourneren of ruilen</option><option>Overig</option></select></label>
        <label>Bericht *<textarea name="Bericht" rows={6} required /></label>
        <button className="button button-dark" type="submit">Verzend bericht ↗</button>
      </form>
      <p className="form-note">Het formulier opent je e-mailprogramma om het bericht te versturen. Liever rechtstreeks mailen? <Link href="mailto:info@bendemen.nl">info@bendemen.nl</Link>.</p>
    </div>
  </main></PageShell>;
}
