import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const notoSansKR = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSerifKR = Noto_Serif_KR({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "태백식품",
  description: "태백식품 주문 홈페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${notoSerifKR.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: 'linear-gradient(160deg, #f6f1e8 0%, #ede8dc 100%)' }}>
        {/* 전통 산수화 고정 배경 — 모든 페이지 공통 */}
        <div className="fixed inset-0 pointer-events-none select-none z-0" aria-hidden="true">
          <svg
            viewBox="0 0 1200 500"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-0 w-full"
            preserveAspectRatio="xMidYMax slice"
          >
            <path d="M0,320 C80,260 160,220 260,240 C340,255 400,200 500,180 C600,160 670,200 760,220 C860,242 940,200 1040,185 C1110,175 1165,190 1200,200 L1200,500 L0,500 Z" fill="#8fa882" fillOpacity="0.13" />
            <path d="M-20,370 C60,300 160,255 280,275 C380,292 440,235 560,215 C670,197 730,240 840,265 C940,288 1020,245 1120,230 C1170,223 1200,235 1220,245 L1220,500 L-20,500 Z" fill="#7d9872" fillOpacity="0.18" />
            <path d="M-30,430 C60,370 150,330 260,350 C360,368 410,310 530,290 C650,270 710,315 820,340 C930,365 1020,325 1120,308 C1175,300 1215,315 1240,328 L1240,500 L-30,500 Z" fill="#6b8a60" fillOpacity="0.22" />
            <defs>
              <linearGradient id="mistGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f6f1e8" stopOpacity="0" />
                <stop offset="60%" stopColor="#f6f1e8" stopOpacity="0" />
                <stop offset="100%" stopColor="#ede8dc" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="1200" height="500" fill="url(#mistGradient)" />
          </svg>
        </div>
        <div className="relative z-10 min-h-full flex flex-col">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
