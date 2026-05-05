import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Action Log",
  description: "A personal action and reflection log.",
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
          href="https://cdn.jsdelivr.net/gh/joungkyun/font-d2coding@1.3.2/d2coding.css"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
