import type { Metadata, Viewport } from "next";
import "./globals.css";

import AuthProvider from "@/components/providers/AuthProvider";
import PwaRegister from "@/components/providers/PwaRegister";

export const viewport: Viewport = {
  themeColor: "#003366",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "RevSlot",
  description: "Academic project review scheduling",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RevSlot",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({children}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Outfit loaded via plain <link>, not next/font/google — avoids
            a Turbopack bug in next@16.3.0 where the internal font-fetch
            package fails to resolve at dev-server startup. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
       <body className="bg-surface text-on-surface antialiased">
        <AuthProvider>
          <PwaRegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}