import type { Metadata } from "next";
import "./globals.css";

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
      <body className="h-full overflow-hidden bg-[#0a0a0f]">
        {children}
      </body>
    </html>
  );
}
