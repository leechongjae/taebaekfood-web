"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { register, checkUsernameAvailable } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
    email: "",
    type: "business" as "business" | "individual",
  });
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "available" | "taken">("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 이미 로그인된 경우 유형에 맞는 페이지로 이동
  useEffect(() => {
    if (!authLoading && user && profile) {
      router.replace(profile.type === "business" ? "/existing" : "/new");
    }
  }, [authLoading, user, profile, router]);

  function handleChange(e: { target: HTMLInputElement }) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "username") setUsernameStatus("idle");
  }

  async function handleCheckUsername() {
    if (!form.username) return;
    const available = await checkUsernameAvailable(form.username);
    setUsernameStatus(available ? "available" : "taken");
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");

    if (usernameStatus !== "available") {
      setError("아이디 중복 확인을 해주세요.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (form.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (!form.name || !form.phone) {
      setError("이름과 연락처는 필수입니다.");
      return;
    }
    if (!form.email) {
      setError("이메일은 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      await register(form.username, form.password, form.name, form.phone, form.email, form.type);
      router.push(form.type === "business" ? "/existing" : "/new");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return null;

  return (
    <AuthLayout title="회원가입" subtitle="태백식품 회원이 되어보세요">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 아이디 */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            아이디 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={handleCheckUsername}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              중복확인
            </button>
          </div>
          {usernameStatus === "available" && (
            <p className="text-xs text-green-500 mt-1">사용 가능한 아이디입니다.</p>
          )}
          {usernameStatus === "taken" && (
            <p className="text-xs text-red-500 mt-1">이미 사용 중인 아이디입니다.</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요 (8자 이상)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* 이름 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="이름을 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* 연락처 */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="예: 010-0000-0000"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* 이메일 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* 회원 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            회원 유형 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer transition ${form.type === "business" ? "border-orange-400 bg-orange-50" : "border-gray-300 hover:border-orange-300"}`}>
              <input
                type="radio"
                name="type"
                value="business"
                checked={form.type === "business"}
                onChange={handleChange}
                className="accent-orange-500"
              />
              <span className="text-sm text-gray-700">기존 거래처</span>
            </label>
            <label className={`flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer transition ${form.type === "individual" ? "border-orange-400 bg-orange-50" : "border-gray-300 hover:border-orange-300"}`}>
              <input
                type="radio"
                name="type"
                value="individual"
                checked={form.type === "individual"}
                onChange={handleChange}
                className="accent-orange-500"
              />
              <span className="text-sm text-gray-700">신규 / 개인</span>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <div className="text-center mt-5 text-sm text-gray-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-orange-600 font-semibold hover:underline">
          로그인
        </Link>
      </div>
    </AuthLayout>
  );
}
