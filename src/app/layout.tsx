import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoCore | Automotive Management System",
  description:
    "Smart automotive parts inventory, sales and vehicle compatibility management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}