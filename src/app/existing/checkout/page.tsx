"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createOrder } from "@/lib/orders";
import { WholesaleCartItem } from "@/app/existing/page";
import Logo from "@/components/Logo";

function getCart(): WholesaleCartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("taebaek_wholesale_cart") ?? "[]"); }
  catch { return []; }
}
function saveCart(cart: WholesaleCartItem[]) {
  localStorage.setItem("taebaek_wholesale_cart", JSON.stringify(cart));
}

function formatPhone(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

function isValidPhone(phone: string) {
  return /^(02-\d{3,4}-\d{4}|0[3-9]\d-\d{3,4}-\d{4}|01[0-9]-\d{3,4}-\d{4})$/.test(phone);
}

const inputClass = "w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition";

export default function WholesaleCheckoutPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [cart, setCart] = useState<WholesaleCartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [form, setForm] = useState({ ordererName: "", phone: "", address: "", addressDetail: "", deliveryDate: "", memo: "" });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setCart(getCart());
    if (profile) setForm((f) => ({ ...f, ordererName: profile.name ?? "" }));
  }, [profile]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  function handlePhoneChange(val: string) {
    const formatted = formatPhone(val);
    setForm((f) => ({ ...f, phone: formatted }));
    if (formatted && !isValidPhone(formatted)) {
      setPhoneError("올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)");
    } else {
      setPhoneError("");
    }
  }

  function openAddressSearch() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (window as any).daum.Postcode({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oncomplete: (data: any) => {
        const addr = data.roadAddress || data.jibunAddress;
        setForm((f) => ({ ...f, address: addr, addressDetail: "" }));
      },
    }).open();
  }

  function updateQty(idx: number, delta: number) {
    const next = cart.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c);
    setCart(next); saveCart(next);
  }

  function removeItem(idx: number) {
    const next = cart.filter((_, i) => i !== idx);
    setCart(next); saveCart(next);
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!user) return;
    if (cart.length === 0) { alert("장바구니가 비어 있습니다."); return; }
    if (!form.ordererName || !form.phone || !form.address || !form.deliveryDate) {
      alert("필수 항목을 모두 입력해주세요."); return;
    }
    if (!isValidPhone(form.phone)) {
      setPhoneError("올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)");
      return;
    }
    setSubmitting(true);
    const fullAddress = form.addressDetail ? `${form.address} ${form.addressDetail}` : form.address;
    try {
      const orderId = await createOrder({
        userId: user.uid, userEmail: user.email ?? "", type: "wholesale",
        items: cart.map((c) => ({ productId: c.productId, productName: c.productName, category: c.category, yongyang: c.yongyang, quantity: c.quantity, unit: c.unit, boxType: c.boxType, boxQty: c.boxQty })),
        ordererName: form.ordererName, phone: form.phone, address: fullAddress, deliveryDate: form.deliveryDate, memo: form.memo,
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
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4">
        <Link href="/existing" className="text-stone-400 hover:text-stone-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <Logo />
        <span className="ml-2 text-sm font-semibold text-stone-700">도매 주문서</span>
        <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full border border-orange-200">결제 없음</span>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <section className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-800">주문 상품</h2>
            {cart.length > 0 && <span className="text-xs text-stone-400">{cart.length}개 품목</span>}
          </div>
          {cart.length === 0 ? (
            <div className="px-5 py-10 text-center text-stone-400 text-sm">
              장바구니가 비어 있습니다.{" "}
              <Link href="/existing" className="text-orange-600 hover:underline font-medium">품목 보러 가기</Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {cart.map((item, idx) => (
                <li key={idx} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm">{item.productName}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{item.yongyang}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                        <button type="button" onClick={() => updateQty(idx, -1)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-50 text-sm">−</button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.quantity}
                          onChange={(e) => {
                            const v = parseInt(e.target.value.replace(/\D/g, ""));
                            if (!isNaN(v) && v >= 1) {
                              const next = cart.map((c, i) => i === idx ? { ...c, quantity: v } : c);
                              setCart(next); saveCart(next);
                            }
                          }}
                          onBlur={(e) => {
                            if (!e.target.value || parseInt(e.target.value) < 1) {
                              const next = cart.map((c, i) => i === idx ? { ...c, quantity: 1 } : c);
                              setCart(next); saveCart(next);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-10 text-center text-xs font-medium text-stone-700 focus:outline-none bg-transparent"
                        />
                        <button type="button" onClick={() => updateQty(idx, 1)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-50 text-sm">+</button>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {item.unit === "박스" && item.boxQty
                          ? `${item.unit} (${item.quantity * item.boxQty}개)`
                          : item.unit ?? "개"}
                      </span>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="text-stone-300 hover:text-red-400 transition-colors p-1">
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

        <section className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">배송 정보</h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">주문자 성함 <span className="text-red-400">*</span></label>
                <input type="text" required value={form.ordererName} onChange={(e) => setForm((f) => ({ ...f, ordererName: e.target.value }))} placeholder="홍길동" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">전화번호 <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010-0000-0000"
                  className={`${inputClass} ${phoneError ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">배송 주소 <span className="text-red-400">*</span></label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  readOnly
                  value={form.address}
                  placeholder="주소 검색 버튼을 클릭하세요"
                  className={`${inputClass} flex-1 bg-stone-50 cursor-default`}
                />
                <button
                  type="button"
                  onClick={openAddressSearch}
                  className="whitespace-nowrap bg-stone-700 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
                >
                  주소 검색
                </button>
              </div>
              {form.address && (
                <input
                  type="text"
                  value={form.addressDetail}
                  onChange={(e) => setForm((f) => ({ ...f, addressDetail: e.target.value }))}
                  placeholder="상세주소 (동/호수 등)"
                  className={inputClass}
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">배송 희망일 <span className="text-red-400">*</span></label>
              <input type="date" required value={form.deliveryDate} onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))} min={new Date().toISOString().split("T")[0]} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">비고</label>
              <textarea value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} placeholder="요청사항을 입력해주세요" rows={3} className={`${inputClass} resize-none`} />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting || cart.length === 0 || !!phoneError}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-4 rounded-xl transition-colors text-sm"
        >
          {submitting ? "주문 처리 중..." : "주문 접수하기"}
        </button>
        <p className="text-center text-xs text-stone-400">결제 없이 주문이 접수됩니다. 담당자가 확인 후 연락드립니다.</p>
      </form>
    </main>
  );
}
