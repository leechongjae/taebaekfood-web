"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";
import { getPartnerItemsForOrder, StaffPartnerItem } from "@/lib/staffData";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export type WholesaleCartItem = {
  itemId: string;
  name: string;
  categoryLabel: string;
  spec: string;
  quantity: number;        // 박스 단위면 박스 수, 낱개면 낱개 수
  unit: "박스" | "개";
  qtyPerBox?: number;      // 박스 단위일 때 박스당 개수
  displaySize?: string;
  price: number;           // 단가 (UI 비노출, 주문 작성 시 사용)
};

const CART_KEY = "tb_wholesale_cart_v2";

function getCart(): WholesaleCartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"); }
  catch { return []; }
}
function saveCart(cart: WholesaleCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export default function ExistingPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [items, setItems] = useState<StaffPartnerItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [cart, setCart] = useState<WholesaleCartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // 항목별 단위 선택: 'box' 또는 'each'. qtyPerBox가 있으면 기본 box, 없으면 each.
  const [unitMode, setUnitMode] = useState<Record<string, "box" | "each">>({});

  useEffect(() => { refreshProfile(); }, []); // eslint-disable-line

  const linkedPartnerId = profile?.linkedPartnerId ?? null;
  const status = profile?.status;
  const isBusiness = profile?.type === "business";
  // 승인된 거래처 계정만 품목 로딩 (개인/관리자 등은 별도 분기에서 처리)
  const canOrder = !!user && !!profile && isBusiness && status === "approved" && !!linkedPartnerId;

  useEffect(() => {
    if (loading) return;
    if (!canOrder || !linkedPartnerId) {
      setItems([]);
      return;
    }
    setFetching(true);
    getPartnerItemsForOrder(linkedPartnerId)
      .then((data) => {
        setItems(data);
        const initQty: Record<string, number> = {};
        const initUnit: Record<string, "box" | "each"> = {};
        data.forEach((p) => {
          initQty[p.itemId] = 1;
          initUnit[p.itemId] = p.qtyPerBox ? "box" : "each";
        });
        setQuantities(initQty);
        setUnitMode(initUnit);
      })
      .finally(() => setFetching(false));
    setCart(getCart());
  }, [loading, canOrder, linkedPartnerId]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  function updateQty(itemId: string, delta: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(1, (prev[itemId] || 1) + delta) }));
  }

  function handleAddToCart(item: StaffPartnerItem) {
    const qty = quantities[item.itemId] || 0;
    if (qty < 1) { alert("수량을 입력해주세요."); return; }
    const mode = unitMode[item.itemId] ?? (item.qtyPerBox ? "box" : "each");
    const next: WholesaleCartItem[] = [...cart];
    const existingIdx = next.findIndex((c) => c.itemId === item.itemId && c.unit === (mode === "box" ? "박스" : "개"));
    if (existingIdx >= 0) {
      next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + qty };
    } else {
      next.push({
        itemId: item.itemId,
        name: item.name,
        categoryLabel: item.categoryLabel,
        spec: item.spec,
        displaySize: item.spec || undefined,
        quantity: qty,
        unit: mode === "box" ? "박스" : "개",
        qtyPerBox: mode === "box" ? item.qtyPerBox : undefined,
        price: item.price,
      });
    }
    setCart(next);
    saveCart(next);
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  // 카테고리(라벨) 그룹핑
  const grouped = useMemo(() => {
    const map = new Map<string, StaffPartnerItem[]>();
    for (const it of items) {
      const k = it.categoryLabel || "기타";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  // ── 로그인 안 됨 ──
  if (!loading && !user) {
    return <UnauthLanding />;
  }

  // ── business 가 아닌 경우 (개인은 /new 흐름) ──
  if (!loading && profile && !isBusiness) {
    return (
      <MessageScreen
        title="기존 거래처 전용 페이지입니다"
        body="개인 회원은 신규/개인 주문 페이지를 이용해주세요."
        action={<Link href="/new" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl text-sm font-semibold">신규/개인 주문 페이지로</Link>}
        onLogout={handleLogout}
      />
    );
  }

  // ── 승인 대기 ──
  if (!loading && profile && isBusiness && status === "pending") {
    return (
      <MessageScreen
        title="가입 승인 대기 중입니다"
        body={`태백식품 담당자가 ${profile.name} 님(${profile.username})의 가입을 검토하고 거래처 정보를 연결한 후 이용하실 수 있습니다. 보통 영업일 1~2일 내 처리됩니다.`}
        onLogout={handleLogout}
      />
    );
  }

  // ── 거절됨 ──
  if (!loading && profile && isBusiness && status === "rejected") {
    return (
      <MessageScreen
        title="가입 신청이 거절되었습니다"
        body="문의: 태백식품 (등록된 거래처 정보와 불일치할 수 있습니다. 담당자에게 연락 주세요.)"
        onLogout={handleLogout}
      />
    );
  }

  // ── 승인됐지만 거래처 매핑 누락 ──
  if (!loading && profile && isBusiness && status === "approved" && !linkedPartnerId) {
    return (
      <MessageScreen
        title="거래처 연결 정보가 없습니다"
        body="관리자에게 거래처 연결을 요청해주세요."
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Logo />
        {!loading && user && profile && (
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
              <span className="font-semibold text-stone-800">{profile.linkedPartnerName ?? profile.name}</span> 님
            </span>
            <button onClick={handleLogout} className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">로그아웃</button>
          </div>
        )}
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">안녕하세요, {profile?.linkedPartnerName ?? profile?.name} 님</h2>
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
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400">
            <p>주문 가능한 품목이 없습니다.</p>
            <p className="text-sm mt-2 text-stone-300">관리자에게 문의해 주세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([label, list]) => (
              <section key={label} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-6 py-3 bg-orange-50 border-b border-orange-100">
                  <h3 className="font-semibold text-orange-700 text-sm">{label}</h3>
                </div>
                <ul className="divide-y divide-stone-100">
                  {list.map((it) => {
                    const mode = unitMode[it.itemId] ?? (it.qtyPerBox ? "box" : "each");
                    return (
                      <li key={it.itemId} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-800 text-sm">{it.name}</p>
                          {it.spec && <p className="text-xs text-stone-400 mt-0.5">{it.spec}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {it.qtyPerBox ? (
                            <div className="flex items-center text-[11px] rounded-lg border border-stone-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setUnitMode((prev) => ({ ...prev, [it.itemId]: "box" }))}
                                className={`px-2.5 py-1.5 transition-colors ${mode === "box" ? "bg-orange-600 text-white font-semibold" : "text-stone-500 hover:bg-stone-50"}`}
                              >
                                박스
                              </button>
                              <button
                                type="button"
                                onClick={() => setUnitMode((prev) => ({ ...prev, [it.itemId]: "each" }))}
                                className={`px-2.5 py-1.5 transition-colors ${mode === "each" ? "bg-orange-600 text-white font-semibold" : "text-stone-500 hover:bg-stone-50"}`}
                              >
                                낱개
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400">낱개</span>
                          )}
                          <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                            <button type="button" onClick={() => updateQty(it.itemId, -1)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-50 text-sm">−</button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={quantities[it.itemId] || ""}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                setQuantities((prev) => ({ ...prev, [it.itemId]: raw === "" ? 0 : parseInt(raw) }));
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-12 text-center text-xs font-medium text-stone-700 focus:outline-none bg-transparent"
                            />
                            <button type="button" onClick={() => updateQty(it.itemId, 1)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-50 text-sm">+</button>
                          </div>
                          <button
                            onClick={() => handleAddToCart(it)}
                            className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition-colors whitespace-nowrap font-medium"
                          >
                            담기
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function MessageScreen({
  title,
  body,
  action,
  onLogout,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  onLogout: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4 flex items-center justify-between">
        <Logo />
        <button onClick={onLogout} className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">로그아웃</button>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl border border-stone-200 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-2">{title}</h2>
          <p className="text-stone-500 text-sm leading-relaxed whitespace-pre-line">{body}</p>
          {action && <div className="mt-6">{action}</div>}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

function UnauthLanding() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4 flex items-center justify-between">
        <Logo />
        <Link href="/login" className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">로그인</Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md w-full">
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
      </div>
      <SiteFooter />
    </main>
  );
}
