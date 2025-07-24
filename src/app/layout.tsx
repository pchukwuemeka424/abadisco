import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow, Pacifico } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-barlow",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

export const metadata: Metadata = {
  title: "Aba Traders | Aba Markets & Businesses Directory",
  description: "Discover Aba, Eastern Nigeria's commercial hub. Curated by founders Prince Chukwuemeka and Princess C Ibekwe. Explore markets, businesses, and services in Aba with Aba Traders.",
  keywords: [
    "Aba",
    "Aba Markets",
    "Aba Businesses",
    "Aba Traders",
    "Prince Chukwuemeka",
    "Princess C Ibekwe",
    "Founder",
    "Co-founder",
    "Nigeria",
    "Markets",
    "Business Directory"
  ],
  other: {
    founders: "Prince Chukwuemeka, Princess C Ibekwe"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} ${pacifico.variable} antialiased bg-gray-50`}
      >
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}
