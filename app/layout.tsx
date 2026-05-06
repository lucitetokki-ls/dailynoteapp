import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fcfbf8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
