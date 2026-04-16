"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";

export default function NewPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">태</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">태백식품</h1>
        </Link>

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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {!loading && user && profile ? (
          /* 로그인 상태 */
          <div className="bg-white rounded-2xl shadow-lg p-12 w-full max-w-2xl text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">안녕하세요, {profile.name} 님!</h2>
            <p className="text-gray-500 mb-8">신규 및 개인 고객 주문 페이지입니다.</p>
            <div className="bg-blue-50 rounded-xl p-5 text-left">
              <p className="text-sm text-blue-700">주문 기능은 준비 중입니다.</p>
            </div>
          </div>
        ) : (
          /* 비로그인 상태 */
          <div className="bg-white rounded-2xl shadow-lg p-12 w-full max-w-2xl text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">신규 및 개인 고객</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              처음 방문하신 신규 고객 또는 개인 고객님을 환영합니다.<br />
              회원가입 후 다양한 상품을 주문하실 수 있습니다.
            </p>
            <div className="bg-blue-50 rounded-xl p-5 mb-8 text-left">
              <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                이용 안내
              </h3>
              <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
                <li>회원가입 후 로그인하시면 주문이 가능합니다</li>
                <li>주문 내역 및 배송 현황을 확인하실 수 있습니다</li>
                <li>문의사항은 고객센터로 연락해 주세요</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
                회원가입 하기
              </Link>
              <Link href="/login" className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
                로그인
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100">
              <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← 처음 화면으로
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-6 text-center text-gray-400 text-sm">
        © 2026 태백식품. All rights reserved.
      </footer>
    </main>
  );
}
