import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "parkET | Turkcell Otopark Yönetim Sistemi",
  description:
    "Turkcell CodeNight 2026 — Akıllı otopark rezervasyon ve yönetim platformu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
