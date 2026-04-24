"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createOrder } from "@/lib/orders";
import { WholesaleCartItem } from "@/app/existing/page";

function getCart(): WholesaleCartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("taebaek_wholesale_cart") ?? "[]"); }
  catch { return []; }
}
function saveCart(cart: WholesaleCartItem[]) {
  localStorage.setItem("taebaek_wholesale_cart", JSON.stringify(cart));
}

export default function WholesaleCheckoutPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [cart, setCart] = useState<WholesaleCartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    ordererName: "",
    phone: "",
    address: "",
    deliveryDate: "",
    memo: "",
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setCart(getCart());
    if (profile) setForm((f) => ({ ...f, ordererName: profile.name ?? "" }));
  }, [profile]);

  function updateQty(idx: number, delta: number) {
    const next = cart.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c);
    setCart(next);
    saveCart(next);
  }

  function removeItem(idx: number) {
    const next = cart.filter((_, i) => i !== idx);
    setCart(next);
    saveCart(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (cart.length === 0) { alert("장바구니가 비어 있습니다."); return; }
    if (!form.ordererName || !form.phone || !form.address || !form.deliveryDate) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const orderId = await createOrder({
        userId: user.uid,
        userEmail: user.email ?? "",
        type: "wholesale",
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          category: c.category,
          yongyang: c.yongyang,
          quantity: c.quantity,
        })),
        ordererName: form.ordererName,
        phone: form.phone,
        address: form.address,
        deliveryDate: form.deliveryDate,
        memo: form.memo,
      });
      saveCart([]);
      router.push(`/existing/checkout/complete?orderId=${orderId}`);
    } catch (err) {
      console.error(err);
      alert("주문 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/existing" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">도매 주문서</h1>
        <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">결제 없음</span>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* 주문 상품 */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">주문 상품</h2>
          </div>
          {cart.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              장바구니가 비어 있습니다.{" "}
              <Link href="/existing" className="underline text-gray-600">품목 보러 가기</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {cart.map((item, idx) => (
                <li key={idx} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.yongyang}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                      <button type="button" onClick={() => updateQty(idx, -1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-sm">−</button>
                      <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(idx, 1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-sm">+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 배송 정보 */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">배송 정보</h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">주문자 성함 <span className="text-red-400">*</span></label>
                <input type="text" required value={form.ordererName}
                  onChange={(e) => setForm((f) => ({ ...f, ordererName: e.target.value }))}
                  placeholder="홍길동"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">전화번호 <span className="text-red-400">*</span></label>
                <input type="tel" required value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">배송 주소 <span className="text-red-400">*</span></label>
              <input type="text" required value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="서울특별시 강남구 테헤란로 123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">배송 희망일 <span className="text-red-400">*</span></label>
              <input type="date" required value={form.deliveryDate}
                onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">비고</label>
              <textarea value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="요청사항을 입력해주세요"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting || cart.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition-colors text-sm"
        >
          {submitting ? "주문 처리 중..." : "주문 접수하기"}
        </button>
        <p className="text-center text-xs text-gray-400">결제 없이 주문이 접수됩니다. 담당자가 확인 후 연락드립니다.</p>
      </form>
    </main>
  );
}
