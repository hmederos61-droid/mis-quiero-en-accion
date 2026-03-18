import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://misquieroenaccion.com"),
  title: "Mis Quiero en Acción",
  description:
    "Coaching ontológico y desarrollo personal para abrir nuevas posibilidades de acción.",
  openGraph: {
    title: "Mis Quiero en Acción",
    description:
      "Coaching ontológico y desarrollo personal para abrir nuevas posibilidades de acción.",
    url: "https://misquieroenaccion.com",
    siteName: "Mis Quiero en Acción",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mis Quiero en Acción",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mis Quiero en Acción",
    description:
      "Coaching ontológico y desarrollo personal para abrir nuevas posibilidades de acción.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Fondo fijo global */}
        <div className="app-bg" />

        {/* Contenido */}
        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}