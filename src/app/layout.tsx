import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import AuthInitializer from "@/components/AuthInitializer";
import { I18nProvider } from "@/i18n";

export const metadata: Metadata = {
  title: "3D Modeler - Browser-based 3D Modeling Tool",
  description: "Create, edit, and share 3D models in your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">
        <AuthInitializer />
        <I18nProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
