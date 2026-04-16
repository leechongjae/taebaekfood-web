"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  async function handleLogout() {
    await logout();
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">태</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">태백식품</h1>
        </div>

        {!loading && (
          user && profile ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{profile.name}</span> 님
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              로그인
            </Link>
          )
        )}
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            태백식품에 오신 것을 환영합니다
          </h2>
          <p className="text-gray-500 text-lg">
            고객 유형을 선택하여 주문을 시작하세요
          </p>
        </div>

        {/* Customer Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* 기존 거래처 */}
          <Link href="/existing" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-orange-400 cursor-pointer h-full">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                <svg
                  className="w-10 h-10 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">기존 거래처</h3>
              <p className="text-gray-500 leading-relaxed">
                기존에 거래하시던 업체 고객님은 이곳을 통해 주문하세요
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-orange-500 font-semibold group-hover:gap-3 transition-all">
                주문하기
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>

          {/* 신규 및 개인 */}
          <Link href="/new" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-blue-400 cursor-pointer h-full">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">신규 및 개인</h3>
              <p className="text-gray-500 leading-relaxed">
                처음 방문하신 신규 고객 또는 개인 고객님은 이곳을 이용하세요
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-blue-500 font-semibold group-hover:gap-3 transition-all">
                시작하기
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-6 text-center text-gray-400 text-sm">
        © 2026 태백식품. All rights reserved.
      </footer>
    </main>
  );
}
