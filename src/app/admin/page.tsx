"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";
import { getClients, Client } from "@/lib/clients";
import {
  getProducts, updateGlobalProduct, deleteGlobalProduct, Product, CATEGORIES,
} from "@/lib/products";
import AddProductModal from "@/components/AddProductModal";
import {
  getAllOrders, updateOrderStatus, Order, OrderItem, OrderStatus, ORDER_STATUS_LABEL, fmtQty,
} from "@/lib/orders";
import Logo from "@/components/Logo";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Tab = "clients" | "products" | "orders";
type OrderView = "active" | "past";
type ProductSort = "category" | "alpha" | "clients";

const PAST_STATUSES: OrderStatus[] = ["shipped", "delivered"];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  preparing: "bg-purple-50 text-purple-700",
  shipped:   "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

const STATUS_CARD: Record<OrderStatus, string> = {
  pending:   "bg-amber-50/60 border-amber-200",
  confirmed: "bg-blue-50/60 border-blue-200",
  preparing: "bg-purple-50/60 border-purple-200",
  shipped:   "bg-indigo-50/60 border-indigo-200",
  delivered: "bg-green-50/60 border-green-200",
  cancelled: "bg-red-50/60 border-red-200",
};

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("clients");

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<"all" | "retail" | "wholesale">("all");
  const [orderView, setOrderView] = useState<OrderView>("active");
  const [productSort, setProductSort] = useState<ProductSort>("category");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.replace("/login"); return; }
    if (!profile.isAdmin) { setFetching(false); return; }
    Promise.all([getClients(), getProducts(), getAllOrders()]).then(([c, p, o]) => {
      setClients(c); setProducts(p); setOrders(o); setFetching(false);
    });
  }, [loading, user, profile, router]);

  async function handleLogout() { await logout(); router.push("/"); }
  async function handleProductAdded() { setProducts(await getProducts()); }

  async function handleDeleteProduct(productId: string) {
    if (!confirm("이 제품을 삭제하시겠습니까?")) return;
    await deleteGlobalProduct(productId);
    setProducts((p) => p.filter((x) => x.id !== productId));
  }

  function openImageUpload(productId: string) {
    setTargetProductId(productId);
    fileInputRef.current?.click();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !targetProductId) return;
    setUploadingId(targetProductId);
    try {
      const storageRef = ref(storage, `products/${targetProductId}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateGlobalProduct(targetProductId, { imageUrl: url });
      setProducts((prev) =>
        prev.map((p) => p.id === targetProductId ? { ...p, imageUrl: url } : p)
      );
    } finally {
      setUploadingId(null);
      setTargetProductId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-stone-400 text-sm">불러오는 중...</p></div>;
  }

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/70 p-10">
          <p className="text-stone-600 mb-4">관리자만 접근할 수 있습니다.</p>
          <Link href="/" className="text-orange-600 hover:underline text-sm font-medium">홈으로</Link>
        </div>
      </div>
    );
  }

  const filteredClients = clients.filter(
    (c) => c.name.includes(search) || (c.phone ?? "").includes(search)
  );
  const typeFiltered = orders.filter((o) => orderFilter === "all" || o.type === orderFilter);
  const activeOrders = typeFiltered.filter((o) => !PAST_STATUSES.includes(o.status));
  const pastOrders = typeFiltered.filter((o) => PAST_STATUSES.includes(o.status));
  const shownOrders = orderView === "active" ? activeOrders : pastOrders;

  const productsWithCount = products.map((p) => ({
    ...p,
    clientCount: clients.filter((c) =>
      c.purchaseItems?.some((item) => item.name === p.name)
    ).length,
  }));

  const sortedProducts = [...productsWithCount].sort((a, b) => {
    if (productSort === "alpha") return a.name.localeCompare(b.name, "ko");
    if (productSort === "clients") return b.clientCount - a.clientCount || a.name.localeCompare(b.name, "ko");
    return CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name, "ko");
  });

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-orange-200">관리자</span>
        </div>
        <button onClick={handleLogout} className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          로그아웃
        </button>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1 w-fit">
          {(["clients", "products", "orders"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-700"}`}>
              {t === "clients" ? "거래처 관리" : t === "products" ? "제품 관리" : (() => {
                const active = orders.filter((o) => !PAST_STATUSES.includes(o.status));
                return `주문 관리${active.length > 0 ? ` (${active.length})` : ""}`;
              })()}
            </button>
          ))}
        </div>

        {/* 거래처 관리 */}
        {tab === "clients" && (
          <>
            <div className="relative mb-4">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="거래처명, 연락처로 검색"
                className="w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm" />
            </div>
            {filteredClients.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-sm">
                {search ? "검색 결과가 없습니다." : "등록된 거래처가 없습니다."}
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredClients.map((client) => (
                  <Link key={client.id} href={`/admin/clients/${client.id}`}
                    className="bg-white rounded-xl border border-stone-200 px-6 py-4 flex items-center justify-between hover:border-orange-300 hover:shadow-sm transition-all group">
                    <div>
                      <p className="font-semibold text-stone-800 group-hover:text-orange-600 transition-colors">{client.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {client.type ?? ""}{client.phone ? ` · ${client.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${client.linkedUserId ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-400"}`}>
                        {client.linkedUserId ? "연결됨" : "미연결"}
                      </span>
                      <svg className="w-4 h-4 text-stone-300 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <p className="text-xs text-stone-400 mt-4">총 {filteredClients.length}개 거래처{search && ` (전체 ${clients.length}개 중)`}</p>
          </>
        )}

        {/* 제품 관리 */}
        {tab === "products" && (
          <>
            <div className="flex items-center justify-between mb-4">
              {/* 정렬 버튼 */}
              <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
                {([
                  { key: "category", label: "카테고리순" },
                  { key: "alpha",    label: "가나다순" },
                  { key: "clients",  label: "거래처 연동순" },
                ] as { key: ProductSort; label: string }[]).map(({ key, label }) => (
                  <button key={key} onClick={() => setProductSort(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${productSort === key ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-700"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {/* 제품 추가 */}
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                제품 추가
              </button>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm">
                <p className="mb-3">등록된 제품이 없습니다.</p>
                <button onClick={() => setShowAddModal(true)} className="text-orange-600 hover:underline text-sm font-medium">첫 제품 추가하기</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sortedProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl border-2 border-stone-200 overflow-hidden">
                    {/* 이미지 영역 */}
                    <div className="relative aspect-square bg-stone-50 group">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-200">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* 사진 업로드 오버레이 */}
                      <button
                        onClick={() => openImageUpload(product.id)}
                        disabled={uploadingId === product.id}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {uploadingId === product.id ? (
                          <span className="text-white text-xs font-semibold">업로드 중...</span>
                        ) : (
                          <span className="text-white text-xs font-semibold">사진 변경</span>
                        )}
                      </button>
                    </div>

                    {/* 제품 정보 */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full">{product.category}</span>
                        {product.clientCount > 0 && (
                          <span className="text-xs text-stone-400">거래처 {product.clientCount}</span>
                        )}
                      </div>
                      <p className="font-semibold text-stone-800 text-sm text-center mt-2 mb-3">{product.name}</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openImageUpload(product.id)}
                          disabled={uploadingId === product.id}
                          className="flex-1 text-xs py-1.5 rounded-lg font-medium border border-stone-200 text-stone-500 hover:border-orange-400 hover:text-orange-600 transition-colors"
                        >
                          {uploadingId === product.id ? "업로드 중" : "사진 업로드"}
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 text-xs py-1.5 rounded-lg font-medium border border-stone-200 text-stone-400 hover:border-red-300 hover:text-red-500 transition-colors">
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 주문 관리 */}
        {tab === "orders" && (
          <>
            <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit mb-4">
              <button onClick={() => setOrderView("active")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${orderView === "active" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-700"}`}>
                진행 중{activeOrders.length > 0 ? ` (${activeOrders.length})` : ""}
              </button>
              <button onClick={() => setOrderView("past")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${orderView === "past" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-700"}`}>
                이전 주문{pastOrders.length > 0 ? ` (${pastOrders.length})` : ""}
              </button>
            </div>

            <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit mb-4">
              {(["all", "retail", "wholesale"] as const).map((f) => (
                <button key={f} onClick={() => setOrderFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${orderFilter === f ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}>
                  {f === "all" ? "전체" : f === "retail" ? "소매" : "도매"}
                </button>
              ))}
            </div>

            {shownOrders.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-sm">
                {orderView === "active" ? "진행 중인 주문이 없습니다." : "이전 주문 내역이 없습니다."}
              </div>
            ) : (
              <div className="space-y-3">
                {shownOrders.map((order) => (
                  <div key={order.id} className={`rounded-xl border p-5 ${STATUS_CARD[order.status]}`}>
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                          {ORDER_STATUS_LABEL[order.status]}
                        </span>
                        <span className="text-xs text-stone-500 bg-white/70 px-2 py-0.5 rounded-full border border-stone-200">
                          {order.type === "retail" ? "소매" : "도매"}
                        </span>
                        <span className="text-xs text-stone-400">
                          {new Date(order.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 whitespace-nowrap">배송 희망일: <span className="font-medium text-stone-600">{order.deliveryDate}</span></p>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {order.items.map((item: OrderItem, i: number) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-stone-700">{item.productName} <span className="text-stone-400">({item.yongyang})</span></span>
                          <span className="font-medium text-stone-800">{fmtQty(item)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3 border-t border-black/5 text-xs text-stone-500 space-y-0.5 mb-3">
                      <p className="font-medium text-stone-700">{order.ordererName} · {order.phone}</p>
                      <p>{order.address}</p>
                      {order.memo && <p className="text-stone-400">비고: {order.memo}</p>}
                    </div>
                    {orderView === "active" ? (
                      <div className="flex justify-end">
                        <select value={order.status}
                          onChange={async (e) => {
                            const s = e.target.value as OrderStatus;
                            await updateOrderStatus(order.id, s);
                            setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: s } : o));
                          }}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 ${STATUS_COLOR[order.status]}`}>
                          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
                            <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${STATUS_COLOR[order.status]}`}>
                          {ORDER_STATUS_LABEL[order.status]}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onAdded={handleProductAdded} />
      )}
    </main>
  );
}
