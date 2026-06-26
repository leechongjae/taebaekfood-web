import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase Hosting 정적 배포용 — 전 페이지 "use client" SSR 미사용이라 정적 export 가능
  output: "export",
  images: { unoptimized: true },
  // 정적 호스팅에서 새로고침/직접접속 시 경로 일관성 (Firebase cleanUrls와 정합)
  trailingSlash: true,
};

export default nextConfig;
