import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Bendemen — Een eigen merk. Een eigen koers.",description:"Ontdek de collectie van Bendemen.",metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3031")};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="nl"><body>{children}</body></html>}
