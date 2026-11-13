import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PokéRadar — Expedición Argentina",
  description:
    "Radar de exploración Pokémon sobre el mapa real de Argentina. Las fichas salen de PokéAPI y las posiciones son una simulación por hábitat.",
};

export const viewport: Viewport = {
  themeColor: "#06141c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-void font-sans text-ink">
        <a className="skip-link" href="#mapa">
          Saltar al mapa
        </a>
        {children}
      </body>
    </html>
  );
}
