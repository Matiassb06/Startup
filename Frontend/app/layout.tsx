import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillBridge - Conecta Talento con Oportunidades",
  description: "Plataforma que conecta estudiantes con proyectos reales de empresas. Gana experiencia práctica y construye tu portfolio profesional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
