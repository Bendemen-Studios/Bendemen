import Link from "next/link";

export const metadata = { title: "Privacybeleid | Bendemen", description: "Concept privacybeleid van de Bendemen-webshop." };

export default function PrivacyPage() {
  return <main className="legal-page wrap">
    <header className="header"><Link className="wordmark" href="/">BENDEMEN<span>®</span></Link><Link className="under-link" href="/shop">Terug naar de shop</Link></header>
    <span className="eyebrow">JURIDISCHE INFORMATIE</span>
    <h1>Privacybeleid</h1>
    <p className="legal-warning"><strong>Conceptpagina:</strong> controleer dit beleid vóór livegang en vul de juridische bedrijfs- en contactgegevens aan. De definitieve tekst moet aansluiten op de daadwerkelijk gebruikte plugins, analytics en bewaartermijnen.</p>
    <h2>1. Wie verwerkt je gegevens?</h2>
    <p>Verwerkingsverantwoordelijke: <strong>[VUL DE JURIDISCHE BEDRIJFSNAAM IN]</strong>, gevestigd op <strong>[VUL HET VESTIGINGSADRES IN]</strong>. Contact: <strong>[VUL HET PRIVACY- OF CONTACTE-MAILADRES IN]</strong>.</p>
    <h2>2. Welke gegevens verwerken we?</h2>
    <p>Bij een bestelling verwerken we de gegevens die nodig zijn om de bestelling uit te voeren, zoals naam, bezorgadres, e-mailadres, eventueel telefoonnummer, bestelde producten, ordergegevens en betaalstatus. Technische gegevens kunnen worden verwerkt om de webshop veilig en betrouwbaar te laten werken.</p>
    <h2>3. Waarom verwerken we gegevens?</h2>
    <ul><li>Om bestellingen te verwerken, te leveren en klantenservice te bieden.</li><li>Om betalingen en administratie af te handelen en te voldoen aan wettelijke verplichtingen.</li><li>Om fraude te voorkomen en de beveiliging van de webshop te beschermen.</li><li>Voor andere doeleinden, zoals statistieken of marketing, alleen als daarvoor een geldige grondslag bestaat en waar nodig toestemming is verkregen.</li></ul>
    <h2>4. Met wie delen we gegevens?</h2>
    <p>Gegevens worden alleen gedeeld voor zover nodig met dienstverleners die de webshop ondersteunen, zoals WooCommerce/hosting en Mollie voor betalingen, en met vervoerders voor bezorging. Met verwerkers worden waar nodig passende afspraken gemaakt. Vul hier alle werkelijk gebruikte dienstverleners aan.</p>
    <h2>5. Bewaartermijnen</h2>
    <p>We bewaren persoonsgegevens niet langer dan nodig voor het doel waarvoor ze zijn verzameld, tenzij een wettelijke bewaarplicht geldt. Administratieve gegevens kunnen bijvoorbeeld op grond van fiscale wetgeving langer moeten worden bewaard. Stel de concrete termijnen vast voor de daadwerkelijke bedrijfsvoering.</p>
    <h2>6. Je rechten</h2>
    <p>Afhankelijk van de toepasselijke wetgeving kun je verzoeken om inzage, correctie, verwijdering, beperking of overdraagbaarheid van je gegevens en kun je bezwaar maken tegen bepaalde verwerkingen. Je kunt een verzoek sturen naar <strong>[VUL HET PRIVACY- OF CONTACTE-MAILADRES IN]</strong>. Je hebt ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens.</p>
    <h2>7. Cookies en beveiliging</h2>
    <p>De webshop gebruikt technisch noodzakelijke opslag om bijvoorbeeld de winkelwagen te onthouden. Als aanvullende analytische of marketingcookies worden gebruikt, moet de informatie en eventuele toestemmingskeuze daarop worden aangepast. We nemen passende technische en organisatorische maatregelen om persoonsgegevens te beschermen.</p>
    <h2>8. Wijzigingen en contact</h2>
    <p>Dit beleid kan worden aangepast wanneer de webshop of de wetgeving verandert. Voor vragen over privacy kun je contact opnemen via <strong>[VUL HET PRIVACY- OF CONTACTE-MAILADRES IN]</strong>.</p>
    <p className="legal-warning">Vul de gemarkeerde gegevens aan en controleer de inhoud op basis van alle diensten die daadwerkelijk op de webshop actief zijn vóór publicatie.</p>
    <footer className="footer"><Link href="/voorwaarden">Algemene voorwaarden</Link><Link href="/shop">Shop</Link></footer>
  </main>;
}
