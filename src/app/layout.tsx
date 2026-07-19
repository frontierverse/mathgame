import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppHeader from "./components/AppHeader";
import { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY } from "./theme";

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

const themeInitializationScript = `(function(){try{var r=document.documentElement;var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var l=t===${JSON.stringify(LIGHT_THEME)};r.classList.toggle("theme-light",l);r.classList.toggle("theme-dark",!l);r.dataset.theme=l?${JSON.stringify(LIGHT_THEME)}:${JSON.stringify(DARK_THEME)}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-theme={DARK_THEME}
      suppressHydrationWarning
      className={`${notoSansKr.variable} ${notoSansKrMono.variable} theme-dark h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
