"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { resetPassword } from "@/lib/auth";

export default function ResetPasswordPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    if (!username || !name || !phone) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(username, name, phone);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="비밀번호 재설정" subtitle="">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">재설정 이메일이 전송됐습니다</h3>
          <p className="text-sm text-gray-500 mb-6">
            가입 시 등록한 이메일로 비밀번호 재설정 링크를 발송했습니다.<br />
            메일함을 확인해 주세요.
          </p>
          <Link
            href="/login"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            로그인하러 가기
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="비밀번호 재설정" subtitle="아이디와 이름, 연락처로 본인을 확인합니다">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            아이디
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디를 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="가입 시 등록한 이름을 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            연락처
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="가입 시 등록한 연락처를 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          {loading ? "확인 중..." : "본인 확인"}
        </button>
      </form>

      <div className="flex justify-center gap-6 mt-8 text-sm text-gray-500">
        <Link href="/login" className="hover:text-orange-500 transition-colors">로그인</Link>
        <span className="text-gray-300">|</span>
        <Link href="/find-id" className="hover:text-orange-500 transition-colors">아이디 찾기</Link>
        <span className="text-gray-300">|</span>
        <Link href="/register" className="hover:text-orange-500 transition-colors">회원가입</Link>
      </div>
    </AuthLayout>
  );
}
