"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  async function handleLogout() {
    await logout();
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <Logo />
        {!loading && (
          user && profile ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-500">
                <span className="font-semibold text-stone-800">{profile.name}</span> 님
              </span>
              <button
                onClick={handleLogout}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              로그인
            </Link>
          )
        )}
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-orange-600 font-semibold text-sm tracking-wide uppercase mb-3">태백식품 주문 시스템</p>
          <h2 className="text-3xl font-bold text-stone-900 mb-3">
            고객 유형을 선택해 주세요
          </h2>
          <p className="text-stone-500">
            주문 방식에 맞는 페이지로 이동합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Link href="/existing" className="group">
            <div className="bg-white rounded-2xl border border-stone-200 p-8 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all duration-200 h-full">
              <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">기존 거래처</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                기존 거래처 고객님을 위한 도매 주문 페이지입니다
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-orange-600 text-sm font-semibold group-hover:gap-2.5 transition-all">
                도매 주문하기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>

          <Link href="/new" className="group">
            <div className="bg-white rounded-2xl border border-stone-200 p-8 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all duration-200 h-full">
              <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">신규 및 개인</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                처음 방문하신 신규 고객 또는 개인 소매 주문 페이지입니다
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-orange-600 text-sm font-semibold group-hover:gap-2.5 transition-all">
                소매 주문하기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
