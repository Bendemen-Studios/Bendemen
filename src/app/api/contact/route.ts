import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subjects = new Set(["Vraag over een bestelling", "Productinformatie", "Retourneren of ruilen", "Overig"]);
const submissions = new Map<string, number>();
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  if (now - (submissions.get(ip) || 0) < 60_000) {
    return NextResponse.json({ message: "Wacht een minuut voordat je opnieuw een bericht verstuurt." }, { status: 429 });
  }

  let data: Record<string, unknown>;
  try { data = await request.json(); }
  catch { return NextResponse.json({ message: "Ongeldige formuliergegevens." }, { status: 400 }); }

  if (clean(data.website, 200)) return NextResponse.json({ ok: true });

  const firstName = clean(data.firstName, 80);
  const lastName = clean(data.lastName, 80);
  const email = clean(data.email, 254);
  const phone = clean(data.phone, 40);
  const subject = clean(data.subject, 100);
  const message = clean(data.message, 5000);

  if (!firstName || !email || !subjects.has(subject) || message.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email)) {
    return NextResponse.json({ message: "Controleer je naam, e-mailadres, onderwerp en bericht." }, { status: 400 });
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM || user;
  if (!host || !user || !pass || !from) {
    return NextResponse.json({ message: "Het contactformulier is nog niet aan de mailserver gekoppeld. Mail rechtstreeks naar info@bendemen.nl." }, { status: 503 });
  }

  try {
    const transporter = nodemailer.createTransport({ host, port, secure: process.env.SMTP_SECURE === "true" || port === 465, auth: { user, pass } });
    await transporter.sendMail({
      from: { name: "Bendemen website", address: from },
      to: process.env.CONTACT_EMAIL || "info@bendemen.nl",
      replyTo: { name: [firstName, lastName].filter(Boolean).join(" "), address: email },
      subject: `Website contact: ${subject}`,
      text: ["Nieuw contactbericht via bendemen.com", "", `Naam: ${[firstName, lastName].filter(Boolean).join(" ")}`, `E-mail: ${email}`, `Telefoon: ${phone || "Niet opgegeven"}`, `Onderwerp: ${subject}`, "", "Bericht:", message].join("\n")
    });
    submissions.set(ip, now);
    for (const [key, timestamp] of submissions) if (now - timestamp > 600_000) submissions.delete(key);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Bendemen contact form]", error);
    return NextResponse.json({ message: "Versturen is tijdelijk niet gelukt. Probeer het later opnieuw of mail info@bendemen.nl." }, { status: 502 });
  }
}
