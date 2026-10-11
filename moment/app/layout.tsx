import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest, Tektur } from "next/font/google";
import "./globals.css";

const tektur = Tektur({ subsets: ["latin", "cyrillic"], variable: "--font-tektur", display: "swap" });
const onest = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-onest", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Момент — ателье обслуживания Porsche, BMW M и AMG",
  description: "Независимый премиальный автосервис в Москве. Разбираем, измеряем и показываем каждую деталь до оплаты.",
};

export const viewport: Viewport = {
  themeColor: "#0c0d0f",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${tektur.variable} ${onest.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
