import type { Metadata } from "next";
import { Karla, Poppins } from "next/font/google";
import "./globals.css";

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  weight: ["400", "700"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arthveda",
  description: "Your trading analytics dashboard, journal & more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${karla.variable} ${poppins.variable} `}>
      <body className="bg-background-1 antialiased">{children}</body>
    </html>
  );
}
