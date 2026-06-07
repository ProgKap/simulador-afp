import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AFP Simulator Chile — Calcula tu pensión",
  description:
    "Simulador gratuito y open source de pensión AFP. Calcula tu pensión estimada con rentabilidades históricas reales, Monte Carlo, comparador de AFPs y PGU. Datos vigentes 2026.",
  keywords: ["AFP", "pensión", "simulador", "Chile", "jubilación", "PGU", "APV", "previsión"],
  authors: [{ name: "AFP Simulator contributors" }],
  openGraph: {
    title: "AFP Simulator Chile — Calcula tu pensión",
    description:
      "Simula tu pensión con rentabilidades históricas reales del sistema previsional chileno. Gratis y open source.",
    type: "website",
    locale: "es_CL",
    siteName: "AFP Simulator",
  },
  twitter: {
    card: "summary_large_image",
    title: "AFP Simulator Chile",
    description:
      "Simula tu pensión AFP con datos reales. Comparador de todas las AFPs incluido.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
