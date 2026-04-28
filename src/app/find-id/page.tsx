"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { findUsername } from "@/lib/auth";

export default function FindIdPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setResult(null);
    setNotFound(false);
    if (!name || !phone) return;
    setLoading(true);
    try {
      const username = await findUsername(name, phone);
      if (username) {
        setResult(username);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="아이디 찾기" subtitle="가입 시 등록한 이름과 연락처로 아이디를 찾을 수 있습니다">
      <form onSubmit={handleSubmit} className="space-y-5">
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
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          {loading ? "조회 중..." : "아이디 찾기"}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
          <p className="text-sm text-gray-500 mb-1">고객님의 아이디는</p>
          <p className="text-xl font-bold text-green-600">{result}</p>
          <p className="text-sm text-gray-500 mt-1">입니다.</p>
          <Link
            href="/login"
            className="mt-3 inline-block text-sm text-orange-600 font-semibold hover:underline"
          >
            로그인하러 가기 →
          </Link>
        </div>
      )}

      {notFound && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200 text-center">
          <p className="text-sm text-red-500">입력하신 정보와 일치하는 계정이 없습니다.</p>
        </div>
      )}

      <div className="flex justify-center gap-6 mt-8 text-sm text-gray-500">
        <Link href="/login" className="hover:text-orange-600 transition-colors">로그인</Link>
        <span className="text-gray-300">|</span>
        <Link href="/reset-password" className="hover:text-orange-600 transition-colors">비밀번호 재설정</Link>
        <span className="text-gray-300">|</span>
        <Link href="/register" className="hover:text-orange-600 transition-colors">회원가입</Link>
      </div>
    </AuthLayout>
  );
}
