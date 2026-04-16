"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { login, getUserProfile } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 이미 로그인된 경우 유형에 맞는 페이지로 이동
  useEffect(() => {
    if (!loading && user && profile) {
      router.replace(profile.type === "business" ? "/existing" : "/new");
    }
  }, [loading, user, profile, router]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const firebaseUser = await login(username, password);
      const userProfile = await getUserProfile(firebaseUser.uid);
      router.push(userProfile?.type === "business" ? "/existing" : "/new");
    } catch {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <AuthLayout title="로그인" subtitle="태백식품 계정으로 로그인하세요">
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-200" />
        <span className="mx-4 text-sm text-gray-400">또는</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/register"
          className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50 py-3 rounded-lg font-semibold text-center transition-colors duration-200"
        >
          회원가입
        </Link>

        <div className="flex justify-center gap-6 mt-2 text-sm text-gray-500">
          <Link href="/find-id" className="hover:text-orange-500 transition-colors">
            아이디 찾기
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/reset-password" className="hover:text-orange-500 transition-colors">
            비밀번호 재설정
          </Link>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </AuthLayout>
  );
}
