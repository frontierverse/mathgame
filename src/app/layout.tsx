import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "수학 적립 금고",
  description: "문제를 풀고 별을 모으고, 최종 테스트로 6개월 적립 금고를 채우는 수학 학습 공간",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "수학 금고" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
