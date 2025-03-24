import type { Metadata } from "next";
import { Karla, Poppins } from "next/font/google";
import "./globals.css";

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "700"],
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
    <html lang="en">
      <body
        className={`${karla.variable} ${poppins.variable} bg-background-1 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
