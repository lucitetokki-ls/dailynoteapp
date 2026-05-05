import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ko">
      <head>
        <link
          as="font"
          crossOrigin="anonymous"
          href="/fonts/D2Coding.woff2?v=20260506"
          rel="preload"
          type="font/woff2"
        />
        <link
          as="font"
          crossOrigin="anonymous"
          href="/fonts/D2CodingBold.woff2?v=20260506"
          rel="preload"
          type="font/woff2"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
