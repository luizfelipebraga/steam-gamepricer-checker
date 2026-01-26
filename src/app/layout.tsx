import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { CurrencyProvider } from "@/contexts/currency-context";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "Steam Game Price Checker",
  description: "Track Steam game prices and view price history",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
