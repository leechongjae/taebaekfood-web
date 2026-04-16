"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";
import { getAssignedProductsWithDetail, CATEGORIES } from "@/lib/products";

type AssignedProduct = Awaited<ReturnType<typeof getAssignedProductsWithDetail>>[number];

export default function ExistingPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [products, setProducts] = useState<AssignedProduct[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    setFetching(true);
    getAssignedProductsWithDetail(user.uid).then((data) => {
      setProducts(data);
      setFetching(false);
    });
  }, [loading, user]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const grouped = CATEGORIES.reduce<Record<string, AssignedProduct[]>>((acc, cat) => {
    acc[cat] = products.filter((p) => p.category === cat);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col">
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
              {profile.isAdmin && (
                <Link href="/admin" className="bg-orange-100 hover:bg-orange-200 text-orange-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  관리자
                </Link>
              )}
              <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition-colors">
              로그인
            </Link>
          )
        )}
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {!loading && user && profile ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">안녕하세요, {profile.name} 님</h2>
              <p className="text-gray-500 mt-1">주문 가능한 품목 목록입니다.</p>
            </div>

            {fetching ? (
              <div className="text-center py-16 text-gray-400">불러오는 중...</div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
                <p>등록된 품목이 없습니다.</p>
                <p className="text-sm mt-2">관리자에게 문의해 주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {CATEGORIES.map((cat) => {
                  const items = grouped[cat];
                  if (items.length === 0) return null;
                  return (
                    <section key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-6 py-3 bg-orange-50 border-b border-orange-100">
                        <h3 className="font-semibold text-orange-700">{cat}</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                        {items.map((product) => (
                          <div key={product.id} className="flex flex-col">
                            <div className="aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 mb-2">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="font-semibold text-gray-800 text-base mb-1 text-center">{product.name}</p>
                            <div className="flex flex-col gap-0.5 text-sm text-gray-500 text-center">
                              {product.assignment.yongyang && (
                                <span>용량: <span className="text-gray-700 font-medium">{product.assignment.yongyang}</span></span>
                              )}
                              {product.assignment.label && (
                                <span>라벨: <span className="text-gray-700 font-medium">{product.assignment.label}</span></span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">기존 거래처</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              로그인 후 주문 가능한 품목을 확인하실 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                로그인하고 주문하기
              </Link>
              <Link href="/register" className="border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-8 py-3 rounded-lg font-semibold transition-colors">
                회원가입
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100">
              <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← 처음 화면으로</Link>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t py-6 text-center text-gray-400 text-sm">
        © 2026 태백식품. All rights reserved.
      </footer>
    </main>
  );
}
