import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Mis Quiero en Acción",
  description: "Mis Quiero en Acción",
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

