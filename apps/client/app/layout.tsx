import type { Metadata } from "next";
import "./globals.css";

import AuthProvider from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "RevSlot",
  description: "Academic project review scheduling",
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}