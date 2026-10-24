import "@fontsource-variable/inter";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "SKANPROOV — Know it's genuine before you buy it", template: "%s · SKANPROOV" },
  description:
    "SKANPROOV gives every product a unique digital identity. Shoppers check it in seconds. Brands protect it from factory to shelf.",
  openGraph: { type: "website", siteName: site.name, locale: "en_NG" },
};

export const viewport: Viewport = { themeColor: "#02703f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>{children}</body>
    </html>
  );
}
