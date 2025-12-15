import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlackNight",
  description: "Compra tus entradas online con BlackNight 🌙",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* 🔥 AGREGAMOS EL SCRIPT AQUÍ SIN TOCAR NADA */}
      <head>
        <script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          async
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {/* Contexto global de autenticación */}
        <AuthProvider>
          {/* Header visible en todas las páginas */}
          <Header />
          {/* Contenido general */}
          <main className="pt-24">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
