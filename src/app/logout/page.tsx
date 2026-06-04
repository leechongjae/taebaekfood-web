"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * 자동 로그아웃 진입 페이지.
 * - staff/관리자 앱의 "거래처 주문 포털" 버튼이 이 경로로 새 탭을 열어
 *   거래처 웹에 남아있던 이전 세션을 정리하고 홈("/")으로 이동시킨다.
 * - 일반 사용자가 직접 /logout 으로 들어와도 동일하게 동작.
 */
export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { await signOut(auth); } catch { /* 세션이 없거나 실패해도 진행 */ }
      if (!cancelled) router.replace("/");
    })();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <p className="text-sm text-stone-400">잠시만 기다려 주세요...</p>
    </main>
  );
}
