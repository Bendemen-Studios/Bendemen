import Link from "next/link";

export const metadata = { title: "Algemene voorwaarden | Bendemen", description: "Concept algemene voorwaarden van de Bendemen-webshop." };

export default function VoorwaardenPage() {
  return <main className="legal-page wrap">
    <header className="header"><Link className="wordmark" href="/">BENDEMEN<span>®</span></Link><Link className="under-link" href="/shop">Terug naar de shop</Link></header>
    <span className="eyebrow">JURIDISCHE INFORMATIE</span>
    <h1>Algemene voorwaarden</h1>
    <p className="legal-warning"><strong>Conceptpagina:</strong> vul vóór livegang de juridische bedrijfsgegevens hieronder aan en laat de voorwaarden controleren op de producten en werkwijze van Bendemen.</p>
    <h2>1. Verkoper</h2>
    <p>Verkoper: <strong>[VUL DE JURIDISCHE BEDRIJFSNAAM IN]</strong><br/>Vestigingsadres: <strong>[VUL HET VESTIGINGSADRES IN]</strong><br/>E-mail: <strong>[VUL HET CONTACTE-MAILADRES IN]</strong><br/>KvK-nummer en btw-identificatienummer: <strong>[VUL INDIEN VAN TOEPASSING IN]</strong></p>
    <h2>2. Bestellen en betalen</h2>
    <p>Het productaanbod, de prijs en eventuele verzendkosten worden vóór het afronden van de bestelling getoond. De bestelling wordt via de webshop geplaatst. Betalingen worden verwerkt in de beveiligde betaalomgeving van Mollie. Een bestelling wordt pas als betaald verwerkt nadat de betaalstatus is bevestigd.</p>
    <h2>3. Prijzen en beschikbaarheid</h2>
    <p>Productprijzen, eventuele btw en verzendkosten worden in de webshop vermeld. Beschikbaarheid en prijzen worden bij het plaatsen van de bestelling opnieuw gecontroleerd. Als een bestelling niet kan worden uitgevoerd, nemen we contact op en wordt een eventueel betaald bedrag terugbetaald.</p>
    <h2>4. Levering</h2>
    <p>We leveren op het bezorgadres dat bij de bestelling is opgegeven. De toepasselijke verzendmethode, verzendkosten en verwachte levertijd moeten vóór betaling duidelijk worden vermeld. Als levering vertraging oploopt, informeren we de klant waar dat redelijkerwijs mogelijk is.</p>
    <h2>5. Herroepingsrecht en retourneren</h2>
    <p>Consumenten hebben bij online aankopen doorgaans het recht om de overeenkomst binnen 14 dagen na ontvangst zonder opgave van reden te herroepen. Er gelden wettelijke uitzonderingen, onder meer voor bepaalde maatwerkproducten en verzegelde producten die om redenen van gezondheidsbescherming of hygiëne niet geschikt zijn om terug te sturen nadat de verzegeling is verbroken. De klant meldt de herroeping binnen de termijn en stuurt het product vervolgens volgens de retourinstructies terug. Terugbetaling vindt plaats binnen de wettelijke termijn; we mogen wachten totdat we het product hebben ontvangen of de klant bewijs van terugzending heeft geleverd. De wettelijke regels bepalen wie de retourkosten draagt.</p>
    <p><strong>Retouradres en retourprocedure:</strong> [VUL HET RETOURADRES EN DE RETOURINSTRUCTIES IN].</p>
    <h2>6. Klachten en contact</h2>
    <p>Neem bij vragen of klachten contact op via <strong>[VUL HET CONTACTE-MAILADRES IN]</strong>. We reageren zo snel mogelijk en zoeken samen naar een passende oplossing.</p>
    <h2>7. Toepasselijk recht</h2>
    <p>Op de overeenkomst is Nederlands recht van toepassing, zonder afbreuk te doen aan dwingende consumentenbescherming die op grond van het recht van het land van de consument geldt.</p>
    <p className="legal-warning">Controleer deze concepttekst juridisch en vul alle gemarkeerde gegevens aan vóór de webshop live gaat.</p>
    <footer className="footer"><Link href="/privacy">Privacybeleid</Link><Link href="/shop">Shop</Link></footer>
  </main>;
}
