import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "EYF 2026 Experience",
  description: "Your personal EYF 2026 convention companion.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/eyf-logo.png", apple: "/eyf-logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003B63",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PwaRegister />{children}</body></html>;
}
