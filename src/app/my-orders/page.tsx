"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMyOrders, Order, ORDER_STATUS_LABEL, OrderStatus, fmtQty } from "@/lib/orders";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  preparing: "bg-purple-50 text-purple-700 border border-purple-200",
  shipped:   "bg-indigo-50 text-indigo-700 border border-indigo-200",
  delivered: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-600 border border-red-200",
};

const PAST_STATUSES: OrderStatus[] = ["shipped", "delivered"];

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [view, setView] = useState<"active" | "past">("active");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getMyOrders(user.uid).then((data) => { setOrders(data); setFetching(false); });
  }, [user]);

  const activeOrders = orders.filter((o) => !PAST_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => PAST_STATUSES.includes(o.status));
  const shown = view === "active" ? activeOrders : pastOrders;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Logo />
        <span className="ml-1 text-sm font-semibold text-stone-700">주문 내역</span>
      </header>

      <div className="max-w-2xl mx-auto w-full px-6 py-8 flex-1">
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setView("active")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${view === "active" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-700"}`}
          >
            진행 중{activeOrders.length > 0 ? ` (${activeOrders.length})` : ""}
          </button>
          <button
            onClick={() => setView("past")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${view === "past" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-700"}`}
          >
            이전 주문{pastOrders.length > 0 ? ` (${pastOrders.length})` : ""}
          </button>
        </div>

        {fetching ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                <div className="h-3 bg-stone-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-stone-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-24 text-stone-300">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-stone-400 mb-4">
              {view === "active" ? "진행 중인 주문이 없습니다." : "이전 주문 내역이 없습니다."}
            </p>
            {view === "active" && (
              <Link href="/existing" className="text-xs text-orange-600 hover:underline font-medium">주문하러 가기</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(order.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 whitespace-nowrap">배송 희망일: <span className="text-stone-600">{order.deliveryDate}</span></p>
                </div>

                <ul className="space-y-1.5 mb-3">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-stone-700">{item.productName} <span className="text-stone-400">({item.yongyang})</span></span>
                      <span className="font-semibold text-stone-800">{fmtQty(item)}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 space-y-0.5">
                  <p>{order.ordererName} · {order.phone}</p>
                  <p>{order.address}</p>
                  {order.memo && <p className="text-stone-400">비고: {order.memo}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}
