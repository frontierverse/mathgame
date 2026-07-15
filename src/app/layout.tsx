import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const notoSansKr = localFont({
  variable: "--font-geist-sans",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/MalgunGothic.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/MalgunGothic-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

const notoSansKrMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  src: "../../public/fonts/MalgunGothic.ttf",
});

export const metadata: Metadata = {
  title: "수학 공간 · 입체 수학 학습",
  description: "수식을 입력하고 입체 공간에서 수학 개념을 탐험하는 학습 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${notoSansKrMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
