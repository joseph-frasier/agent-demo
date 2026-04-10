import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Irongrove — Agent Pipeline Demo",
  description: "AI-automated pipeline from intake to live website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-brand-dark text-white min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
