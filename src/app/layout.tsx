import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dropship Manager",
  description:
    "Manage customer orders, vendor purchase orders, and dropship shipment tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
