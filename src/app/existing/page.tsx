"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";
import { getAssignedProductsWithDetail, CATEGORIES } from "@/lib/products";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

type AssignedProduct = Awaited<ReturnType<typeof getAssignedProductsWithDetail>>[number];

export type WholesaleCartItem = {
  productId: string;
  productName: string;
  category: string;
  yongyang: string;
  quantity: number;
};

function getCart(): WholesaleCartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("taebaek_wholesale_cart") ?? "[]"); }
  catch { return []; }
}
function saveCart(cart: WholesaleCartItem[]) {
  localStorage.setItem("taebaek_wholesale_cart", JSON.stringify(cart));
}

export default function ExistingPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [products, setProducts] = useState<AssignedProduct[]>([]);
  const [fetching, setFetching] = useState(false);
  const [cart, setCart] = useState<WholesaleCartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => { refreshProfile(); }, []); // eslint-disable-line

  useEffect(() => {
    if (loading || !user) return;
    setFetching(true);
    getAssignedProductsWithDetail(user.uid).then((data) => {
      setProducts(data);
      const init: Record<string, number> = {};
      data.forEach((p) => { init[p.id] = 1; });
      setQuantities(init);
      setFetching(false);
    });
    setCart(getCart());
  }, [loading, user]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  function updateQty(productId: string, delta: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, (prev[productId] ?? 1) + delta) }));
  }

  function handleAddToCart(product: AssignedProduct) {
    const qty = quantities[product.id] ?? 1;
    const existing = cart.findIndex(
      (c) => c.productId === product.id && c.yongyang === product.assignment.yongyang
    );
    let next: WholesaleCartItem[];
    if (existing >= 0) {
      next = cart.map((c, i) => i === existing ? { ...c, quantity: c.quantity + qty } : c);
    } else {
      next = [...cart, {
        productId: product.id,
        productName: product.name,
        category: product.category,
        yongyang: product.assignment.yongyang,
        quantity: qty,
      }];
    }
    setCart(next);
    saveCart(next);
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const grouped = CATEGORIES.reduce<Record<string, AssignedProduct[]>>((acc, cat) => {
    acc[cat] = products.filter((p) => p.category === cat);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Logo />
        {!loading && (user && profile ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/existing/checkout")}
              className="relative flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-1 bg-orange-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
            <Link href="/my-orders" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">내 주문</Link>
            <span className="hidden sm:block text-sm text-stone-500">
              <span className="font-semibold text-stone-800">{profile.name}</span> 님
            </span>
            {profile.isAdmin && (
              <Link href="/admin" className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">관리자</Link>
            )}
            <button onClick={handleLogout} className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">로그아웃</button>
          </div>
        ) : (
          <Link href="/login" className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">로그인</Link>
        ))}
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {!loading && user && profile ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900">안녕하세요, {profile.name} 님</h2>
                <p className="text-stone-500 text-sm mt-0.5">주문 가능한 품목 목록입니다.</p>
              </div>
              {cartCount > 0 && (
                <button
                  onClick={() => router.push("/existing/checkout")}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  주문서 작성 ({cartCount}개)
                </button>
              )}
            </div>

            {fetching ? (
              <div className="text-center py-16 text-stone-400 text-sm">불러오는 중...</div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400">
                <p>등록된 품목이 없습니다.</p>
                <p className="text-sm mt-2 text-stone-300">관리자에게 문의해 주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {CATEGORIES.map((cat) => {
                  const items = grouped[cat];
                  if (items.length === 0) return null;
                  return (
                    <section key={cat} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                      <div className="px-6 py-3 bg-orange-50 border-b border-orange-100">
                        <h3 className="font-semibold text-orange-700 text-sm">{cat}</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                        {items.map((product) => (
                          <div key={product.id} className="flex flex-col">
                            <div className="aspect-square rounded-xl overflow-hidden border border-stone-100 bg-stone-50 mb-2">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="font-semibold text-stone-800 text-sm mb-1 text-center">{product.name}</p>
                            <div className="text-xs text-stone-400 text-center mb-2">
                              {product.assignment.yongyang && <p className="text-stone-500">{product.assignment.yongyang}</p>}
                              {product.assignment.label && <p>{product.assignment.label}</p>}
                            </div>
                            <div className="flex items-center gap-1 mt-auto">
                              <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden flex-1">
                                <button type="button" onClick={() => updateQty(product.id, -1)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-50 text-sm flex-shrink-0">−</button>
                                <span className="flex-1 text-center text-xs font-medium text-stone-700">{quantities[product.id] ?? 1}</span>
                                <button type="button" onClick={() => updateQty(product.id, 1)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-50 text-sm flex-shrink-0">+</button>
                              </div>
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium"
                              >
                                담기
                              </button>
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
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">기존 거래처 주문</h2>
            <p className="text-stone-500 text-sm mb-8 leading-relaxed">로그인 후 주문 가능한 품목을 확인하실 수 있습니다.</p>
            <div className="flex flex-col gap-3">
              <Link href="/login" className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">로그인하고 주문하기</Link>
              <Link href="/register" className="border border-stone-200 hover:bg-stone-50 text-stone-700 py-3 rounded-xl font-semibold text-sm transition-colors">회원가입</Link>
            </div>
            <Link href="/" className="inline-block mt-6 text-xs text-stone-400 hover:text-stone-600 transition-colors">← 처음 화면으로</Link>
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}
