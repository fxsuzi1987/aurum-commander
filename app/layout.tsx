import type { Metadata } from "next";
import { Cinzel, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Three roles, three faces — per the blueprint's dashboard design language
// (black glass + metallic gold + baby-blue): Cinzel for the AURUM wordmark
// (a serif with real gold-leaf weight, used sparingly), Manrope for all UI
// text, IBM Plex Mono for anything that's a number (prices, confidence,
// timestamps) so digits line up in columns.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Aurum Commander",
  description: "Sujan's personal AI command center — one front door, many specialists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${manrope.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
