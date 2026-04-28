"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";
import { getProducts, Product, CATEGORIES } from "@/lib/products";
import { OrderItem } from "@/lib/orders";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

const ALL = "전체";

export type CartItem = OrderItem & { productCategory: string };

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("taebaek_cart") ?? "[]"); }
  catch { return []; }
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selections, setSelections] = useState<Record<string, { yongyang: string; qty: number }>>({});

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      const init: Record<string, { yongyang: string; qty: number }> = {};
      data.forEach((p) => { init[p.id] = { yongyang: p.yongyang[0] ?? "", qty: 1 }; });
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
    const existing = cart.findIndex((c) => c.productId === product.id && c.yongyang === sel.yongyang);
    let next: CartItem[];
    if (existing >= 0) {
      next = cart.map((c, i) => i === existing ? { ...c, quantity: c.quantity + sel.qty } : c);
    } else {
      next = [...cart, { productId: product.id, productName: product.name, category: product.category, productCategory: product.category, yongyang: sel.yongyang, quantity: sel.qty }];
    }
    setCart(next);
    saveCart(next);
  }

  function updateSelection(productId: string, key: "yongyang" | "qty", value: string | number) {
    setSelections((prev) => ({ ...prev, [productId]: { ...prev[productId], [key]: value } }));
  }

  const filtered = activeCategory === ALL ? products : products.filter((p) => p.category === activeCategory);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4 text-sm text-stone-500">
            <button
              onClick={() => user ? router.push("/new/checkout") : router.push("/login")}
              className="relative flex items-center gap-1.5 hover:text-stone-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">장바구니</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-orange-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
            {user && <Link href="/my-orders" className="hidden sm:block hover:text-stone-900 transition-colors">내 주문</Link>}
            {!loading && (user && profile ? (
              <>
                <span className="hidden md:block font-medium text-stone-700">{profile.name} 님</span>
                <button onClick={handleLogout} className="hover:text-stone-900 transition-colors">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-stone-900 transition-colors">로그인</Link>
                <Link href="/register" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors text-xs">회원가입</Link>
              </>
            ))}
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-6 flex gap-6 text-sm border-t border-stone-100">
          <Link href="/new" className="py-2.5 border-b-2 border-orange-600 text-stone-900 font-semibold">소매 주문</Link>
          <Link href="/existing" className="py-2.5 border-b-2 border-transparent text-stone-400 hover:text-stone-700 transition-colors">거래처 주문 (도매)</Link>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto w-full flex flex-1 px-6 py-8 gap-8">
        <aside className="w-40 flex-shrink-0 hidden md:block">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">카테고리</p>
          <ul className="space-y-0.5">
            {[ALL, ...CATEGORIES].map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${
                    activeCategory === cat
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 p-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-500 leading-relaxed space-y-1">
            <p className="font-semibold text-stone-700 mb-1.5">주문 안내</p>
            <p>· 로그인 후 주문 가능</p>
            <p>· 소량 주문 가능 (개인)</p>
            <p>· 도매 문의: 거래처 주문 탭</p>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          {/* 모바일 카테고리 */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 md:hidden scrollbar-hide">
            {[ALL, ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-orange-600 border-orange-600 text-white font-semibold"
                    : "border-stone-200 text-stone-500 bg-white hover:border-orange-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-stone-400">{fetching ? "" : `총 ${filtered.length}개 상품`}</p>
            {cartCount > 0 && (
              <button
                onClick={() => user ? router.push("/new/checkout") : router.push("/login")}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                주문하기 ({cartCount})
              </button>
            )}
          </div>

          {fetching ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-stone-100 rounded-xl mb-3" />
                  <div className="h-3 bg-stone-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-stone-300">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">등록된 상품이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
              {filtered.map((product) => {
                const sel = selections[product.id] ?? { yongyang: "", qty: 1 };
                return (
                  <div key={product.id} className="group">
                    <div className="aspect-square bg-white border border-stone-100 rounded-xl overflow-hidden mb-3 relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-200 gap-2">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-stone-300">이미지 준비 중</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-white/90 text-stone-600 text-[10px] px-2 py-0.5 rounded-full border border-stone-200 backdrop-blur-sm">
                        {product.category}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-stone-900 mb-2">{product.name}</p>

                    {product.yongyang.length > 0 && (
                      <select
                        value={sel.yongyang}
                        onChange={(e) => updateSelection(product.id, "yongyang", e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-stone-700"
                      >
                        {product.yongyang.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateSelection(product.id, "qty", Math.max(1, sel.qty - 1))} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-50 text-sm">−</button>
                        <span className="w-8 text-center text-xs font-medium text-stone-700">{sel.qty}</span>
                        <button onClick={() => updateSelection(product.id, "qty", sel.qty + 1)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-50 text-sm">+</button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 text-xs bg-orange-600 hover:bg-orange-700 text-white py-1.5 rounded-lg transition-colors font-medium"
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

      <SiteFooter />
    </main>
  );
}
