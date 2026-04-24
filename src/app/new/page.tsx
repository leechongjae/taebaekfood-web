"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";
import { getProducts, Product, CATEGORIES } from "@/lib/products";
import { OrderItem } from "@/lib/orders";

const ALL = "전체";

export type CartItem = OrderItem & { productCategory: string };

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("taebaek_cart") ?? "[]");
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("taebaek_cart", JSON.stringify(cart));
}

export default function NewPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selections, setSelections] = useState<Record<string, { yongyang: string; qty: number }>>({});

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      const init: Record<string, { yongyang: string; qty: number }> = {};
      data.forEach((p) => {
        init[p.id] = { yongyang: p.yongyang[0] ?? "", qty: 1 };
      });
      setSelections(init);
      setFetching(false);
    });
    setCart(getCart());
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  function handleAddToCart(product: Product) {
    if (!user) { router.push("/login"); return; }
    const sel = selections[product.id];
    if (!sel?.yongyang) return;

    const existing = cart.findIndex(
      (c) => c.productId === product.id && c.yongyang === sel.yongyang
    );
    let next: CartItem[];
    if (existing >= 0) {
      next = cart.map((c, i) =>
        i === existing ? { ...c, quantity: c.quantity + sel.qty } : c
      );
    } else {
      next = [
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          category: product.category,
          productCategory: product.category,
          yongyang: sel.yongyang,
          quantity: sel.qty,
        },
      ];
    }
    setCart(next);
    saveCart(next);
  }

  function updateSelection(productId: string, key: "yongyang" | "qty", value: string | number) {
    setSelections((prev) => ({ ...prev, [productId]: { ...prev[productId], [key]: value } }));
  }

  const filtered =
    activeCategory === ALL ? products : products.filter((p) => p.category === activeCategory);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {bannerVisible && (
        <div className="bg-gray-900 text-white text-center text-xs py-2.5 px-4 flex items-center justify-center gap-4">
          <span>신규 회원가입 시 첫 주문 혜택 제공</span>
          <button onClick={() => setBannerVisible(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">태백식품</Link>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            {/* 장바구니 */}
            <button
              onClick={() => user ? router.push("/new/checkout") : router.push("/login")}
              className="relative flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>장바구니</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-gray-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* 내 주문 */}
            {user && (
              <Link href="/my-orders" className="hover:text-gray-900 transition-colors">내 주문</Link>
            )}

            {!loading && (user && profile ? (
              <>
                <span className="font-medium text-gray-800">{profile.name} 님</span>
                <button onClick={handleLogout} className="hover:text-gray-900 transition-colors">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-gray-900 transition-colors">로그인</Link>
                <Link href="/register" className="hover:text-gray-900 transition-colors">회원가입</Link>
              </>
            ))}
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-6 flex gap-8 text-sm font-medium border-t border-gray-100">
          <Link href="/new" className="py-3 border-b-2 border-gray-900 text-gray-900">소매 주문</Link>
          <Link href="/existing" className="py-3 border-b-2 border-transparent text-gray-400 hover:text-gray-700 transition-colors">거래처 주문 (도매)</Link>
          <Link href="/" className="py-3 border-b-2 border-transparent text-gray-400 hover:text-gray-700 transition-colors ml-auto">홈</Link>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto w-full flex flex-1 px-6 py-8 gap-10">
        {/* 사이드바 */}
        <aside className="w-44 flex-shrink-0">
          <ul>
            {[ALL, ...CATEGORIES].map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left text-sm py-2 border-b border-gray-200 transition-colors ${
                    activeCategory === cat ? "font-bold text-gray-900" : "text-gray-400 hover:text-gray-800"
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 p-4 bg-gray-50 rounded text-xs text-gray-500 leading-relaxed space-y-1">
            <p className="font-semibold text-gray-700 mb-2">주문 안내</p>
            <p>· 로그인 후 주문 가능합니다</p>
            <p>· 소량 주문 가능 (개인)</p>
            <p>· 도매 문의: 거래처 주문 탭</p>
          </div>
        </aside>

        {/* 상품 그리드 */}
        <section className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-gray-400">{fetching ? "" : `총 ${filtered.length}개 상품`}</p>
          </div>

          {fetching ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-300">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">등록된 상품이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
              {filtered.map((product) => {
                const sel = selections[product.id] ?? { yongyang: "", qty: 1 };
                return (
                  <div key={product.id} className="group">
                    <div className="aspect-square bg-gray-50 rounded overflow-hidden mb-3 relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-2">
                          <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs">이미지 준비 중</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-white text-gray-600 text-[10px] px-2 py-0.5 rounded-full border border-gray-200">
                        {product.category}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-900 mb-2">{product.name}</p>

                    {/* 용량 선택 */}
                    {product.yongyang.length > 0 && (
                      <select
                        value={sel.yongyang}
                        onChange={(e) => updateSelection(product.id, "yongyang", e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                      >
                        {product.yongyang.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    )}

                    {/* 수량 + 담기 */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                        <button
                          onClick={() => updateSelection(product.id, "qty", Math.max(1, sel.qty - 1))}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-sm"
                        >−</button>
                        <span className="w-8 text-center text-xs font-medium">{sel.qty}</span>
                        <button
                          onClick={() => updateSelection(product.id, "qty", sel.qty + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-sm"
                        >+</button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 text-xs bg-gray-900 text-white py-1.5 rounded hover:bg-gray-700 transition-colors"
                      >
                        {user ? "담기" : "로그인 후 주문"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="border-t border-gray-100 py-10 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-6 text-xs text-gray-400">
          <div className="space-y-1">
            <p className="font-semibold text-gray-700 text-sm">태백식품</p>
            <p>참기름 · 들기름 · 들깨가루 전문 제조</p>
          </div>
          <div className="space-y-1 text-right">
            <p>© 2026 태백식품. All rights reserved.</p>
            <p>도매 문의: <Link href="/existing" className="underline underline-offset-2">거래처 주문 페이지</Link></p>
          </div>
        </div>
      </footer>
    </main>
  );
}
