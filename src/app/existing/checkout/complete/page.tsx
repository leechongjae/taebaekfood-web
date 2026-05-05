"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getOrder, Order } from "@/lib/orders";
import Logo from "@/components/Logo";

function WholesaleCompleteContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderId) getOrder(orderId).then(setOrder);
  }, [orderId]);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white/70 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4">
        <Logo />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/70 p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">주문이 접수되었습니다</h1>
          <p className="text-sm text-stone-500 mb-6">담당자 확인 후 연락드리겠습니다.</p>

          {order && (
            <div className="bg-stone-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
              <p className="text-xs font-semibold text-stone-400 mb-3">주문 내역</p>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-stone-600">{item.productName} <span className="text-stone-400">({item.yongyang})</span></span>
                  <span className="font-semibold text-stone-800">{item.quantity}개</span>
                </div>
              ))}
              <div className="pt-2 border-t border-stone-200 space-y-1 text-xs text-stone-500">
                <p>주문자: {order.ordererName}</p>
                <p>연락처: {order.phone}</p>
                <p>배송 희망일: {order.deliveryDate}</p>
                <p>주소: {order.address}</p>
                {order.memo && <p>비고: {order.memo}</p>}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link href="/my-orders" className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
              내 주문 목록 보기
            </Link>
            <Link href="/existing" className="w-full border border-stone-200 hover:bg-stone-50 text-stone-600 text-sm py-3 rounded-xl transition-colors">
              계속 주문하기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function WholesaleCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">불러오는 중...</div>}>
      <WholesaleCompleteContent />
    </Suspense>
  );
}
