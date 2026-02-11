import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lottery.io.kr"),
  title: {
    default: "로또리 - 한국 복권 번호 추천 | 로또 6/45 당첨번호 분석",
    template: "%s | 로또리",
  },
  description:
    "로또 6/45 번호 추천, 당첨번호 조회, 통계 분석을 한 곳에서. 통계 기반 스마트한 번호 추천으로 행운을 잡으세요!",
  keywords: [
    "로또",
    "로또 번호 추천",
    "로또 당첨번호",
    "로또 6/45",
    "연금복권",
    "복권 번호 추천",
    "로또 통계",
    "당첨번호 조회",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "로또리 - 한국 복권 번호 추천",
    description: "통계 기반 스마트한 로또 번호 추천 서비스",
    url: "/",
    siteName: "로또리",
    locale: "ko_KR",
    type: "website",
  },
  verification: {
    google: "l9x3-7Ka7vQqGyceePwBraUm1GpiQxsWF0MhGyLDNVQ",
    other: {
      "naver-site-verification": ["f850dc4f90a4d1aca1e3d93539678a1a18fcd8ea"],
    },
  },
  other: {
    "theme-color": "#2563eb",
  },
  robots: {
    index: true,
    follow: true,
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
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
