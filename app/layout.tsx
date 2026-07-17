import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lucitetokki Daily Action Log",
    template: "%s | Lucitetokki Daily Action Log",
  },
  description: "식단, 운동, 코딩, 공부, 정리, 관계를 기록하는 개인용 데일리 로그.",
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
  colorScheme: "light dark",
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
