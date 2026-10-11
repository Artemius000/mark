import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Roboto_Flex } from "next/font/google";
import "./globals.css";

const flex = Roboto_Flex({ subsets: ["latin", "cyrillic"], axes: ["wdth", "opsz"], variable: "--font-flex", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], style: ["italic"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Момент — ателье обслуживания Porsche, BMW M и AMG",
  description: "Независимый премиальный автосервис в Москве. Разбираем, измеряем и показываем каждую деталь до оплаты.",
};

export const viewport: Viewport = {
  themeColor: "#09090a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${flex.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
