"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMyOrders, Order, ORDER_STATUS_LABEL, OrderStatus } from "@/lib/orders";

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  shipped:   "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<"all" | "retail" | "wholesale">("all");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getMyOrders(user.uid).then((data) => {
      setOrders(data);
      setFetching(false);
    });
  }, [user]);

  const filtered = orders.filter((o) => filter === "all" || o.type === filter);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">내 주문 목록</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* 필터 탭 */}
        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 w-fit mb-6">
          {(["all", "retail", "wholesale"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all" ? "전체" : f === "retail" ? "소매" : "도매"}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-sm mb-4">주문 내역이 없습니다.</p>
            <Link href="/new" className="text-xs text-gray-600 underline underline-offset-2">상품 보러 가기</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                        {ORDER_STATUS_LABEL[order.status]}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {order.type === "retail" ? "소매" : "도매"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">배송 희망일: {order.deliveryDate}</p>
                </div>

                <ul className="space-y-1.5 mb-3">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.productName} <span className="text-gray-400">({item.yongyang})</span></span>
                      <span className="font-medium text-gray-900">{item.quantity}개</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-0.5">
                  <p>{order.ordererName} · {order.phone}</p>
                  <p>{order.address}</p>
                  {order.memo && <p className="text-gray-400">비고: {order.memo}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
