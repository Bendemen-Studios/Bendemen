import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Bendemen Booster", description: "Prestatiebewaking en veilig beheer voor Bendemen.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="nl"><body>{children}</body></html>; }
