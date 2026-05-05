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
      <body>{children}</body>
    </html>
  );
}
