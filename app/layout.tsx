import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurum Commander",
  description: "Sujan's personal AI command center — one front door, many specialists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
