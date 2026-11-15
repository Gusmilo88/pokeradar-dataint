import type { Metadata, Viewport } from "next";
import { Exo_2, IBM_Plex_Mono, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const exo2 = Exo_2({
  variable: "--font-exo",
  subsets: ["latin"],
  weight: "800",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const description =
  "Radar de exploración Pokémon sobre el mapa real de Argentina. Las fichas salen de PokéAPI y las posiciones son una simulación por hábitat.";

const title = "PokéRadar — Expedición Argentina";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "PokéRadar",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/branding/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/branding/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/branding/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title,
    description,
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/branding/og.png",
        width: 1200,
        height: 630,
        alt: title,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/branding/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1E35",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${sora.variable} ${exo2.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-void font-sans text-ink">
        <Script id="pokeradar-intro-boot" strategy="beforeInteractive">
          {`(function(){try{var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var preview=new URLSearchParams(window.location.search).get("planetPreview")==="1";var seen=false;try{seen=window.sessionStorage.getItem("pokeradar.intro.session")==="seen"}catch(e){seen=true}if(!reduce&&!preview&&!seen){document.documentElement.dataset.intro="play";try{window.sessionStorage.setItem("pokeradar.intro.session","seen")}catch(e){}}else{document.documentElement.dataset.intro="skip"}}catch(e){document.documentElement.dataset.intro="skip"}})();`}
        </Script>
        <a className="skip-link" href="#mapa">
          Saltar al mapa
        </a>
        {children}
      </body>
    </html>
  );
}
