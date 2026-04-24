"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getOrder, Order } from "@/lib/orders";

function WholesaleCompleteContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderId) getOrder(orderId).then(setOrder);
  }, [orderId]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">주문이 접수되었습니다</h1>
        <p className="text-sm text-gray-500 mb-6">담당자 확인 후 연락드리겠습니다.</p>

        {order && (
          <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
            <p className="text-xs font-semibold text-gray-500 mb-3">주문 내역</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-700">{item.productName} ({item.yongyang})</span>
                <span className="font-medium text-gray-900">{item.quantity}개</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200 space-y-1 text-xs text-gray-500">
              <p>주문자: {order.ordererName}</p>
              <p>연락처: {order.phone}</p>
              <p>배송 희망일: {order.deliveryDate}</p>
              <p>주소: {order.address}</p>
              {order.memo && <p>비고: {order.memo}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link href="/my-orders" className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors">
            내 주문 목록 보기
          </Link>
          <Link href="/existing" className="w-full border border-gray-200 text-gray-600 text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors">
            계속 주문하기
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function WholesaleCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>}>
      <WholesaleCompleteContent />
    </Suspense>
  );
}
