import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PantryChat } from "@/components/PantryChat";

export const metadata: Metadata = {
  title: "Pantry Tracker",
  description: "Track your pantry, reduce waste",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2D5CB0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" style={{ height: "100%", colorScheme: "light" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ height: "100%", margin: 0 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100%", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
        <PantryChat />
      </body>
    </html>
  );
}
