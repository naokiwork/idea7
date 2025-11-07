import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Hour Calendar",
  description: "Track and visualize your study hours with a beautiful calendar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

