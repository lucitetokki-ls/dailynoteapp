import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const d2Coding = localFont({
  display: "swap",
  preload: true,
  src: [
    {
      path: "../public/fonts/D2Coding.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "../public/fonts/D2CodingBold.woff2",
      style: "normal",
      weight: "600",
    },
    {
      path: "../public/fonts/D2CodingBold.woff2",
      style: "normal",
      weight: "700",
    },
    {
      path: "../public/fonts/D2CodingBold.woff2",
      style: "normal",
      weight: "800",
    },
  ],
  variable: "--font-d2coding",
});

export const metadata: Metadata = {
  title: {
    default: "Lucitetokki Daily Action Log",
    template: "%s | Lucitetokki Daily Action Log",
  },
  description: "A personal daily action log for diet, fitness, vibe coding, writing, and reflection.",
  applicationName: "Lucitetokki Daily Action Log",
  appleWebApp: {
    capable: true,
    title: "Lucitetokki Log",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/apple-touch-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={d2Coding.variable} lang="ko">
      <body className={d2Coding.className}>{children}</body>
    </html>
  );
}
