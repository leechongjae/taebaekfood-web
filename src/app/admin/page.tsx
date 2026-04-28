"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getBusinessClients, UserProfile, logout } from "@/lib/auth";
import {
  getProducts, addGlobalProduct, updateGlobalProduct, deleteGlobalProduct, Product,
} from "@/lib/products";
import AddProductModal from "@/components/AddProductModal";
import {
  getAllOrders, updateOrderStatus, Order, OrderStatus, ORDER_STATUS_LABEL,
} from "@/lib/orders";
import Logo from "@/components/Logo";

type Tab = "clients" | "products" | "orders";

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

  const [clients, setClients] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [yongyangInput, setYongyangInput] = useState("");
  const [magaeInput, setMagaeInput] = useState("");
  const [fetching, setFetching] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<"all" | "retail" | "wholesale">("all");

  const SEED_PRODUCTS: Omit<Product, "id" | "createdAt">[] = [
    { name: "참기름", category: "기름", yongyang: ["300ml", "350ml", "1.75L", "1.8L", "16.5kg"], magae: [], label: [] },
    { name: "들기름", category: "기름", yongyang: ["300ml", "350ml", "1.75L", "1.8L", "16.5kg"], magae: [], label: [] },
    { name: "향미유", category: "기름", yongyang: ["300ml", "350ml", "1.75L", "1.8L"], magae: [], label: [] },
    { name: "들깨가루", category: "가루", yongyang: ["200g", "400g", "1kg", "4kg", "20kg"], magae: [], label: [] },
    { name: "탈피들깨가루", category: "가루", yongyang: ["200g", "400g", "1kg", "4kg", "20kg"], magae: [], label: [] },
  ];

  async function handleSeed() {
    if (!confirm("샘플 상품 5개를 Firestore에 추가하시겠습니까?")) return;
    setSeeding(true);
    for (const p of SEED_PRODUCTS) await addGlobalProduct(p);
    setProducts(await getProducts());
    setSeeding(false);
  }

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.replace("/login"); return; }
    if (!profile.isAdmin) { setFetching(false); return; }
    Promise.all([getBusinessClients(), getProducts(), getAllOrders()]).then(([c, p, o]) => {
      setClients(c); setProducts(p); setOrders(o); setFetching(false);
    });
  }, [loading, user, profile, router]);

  async function handleLogout() { await logout(); router.push("/"); }
  async function handleProductAdded() { setProducts(await getProducts()); }

  async function handleDeleteProduct(productId: string) {
    if (!confirm("이 제품을 삭제하시겠습니까?")) return;
    await deleteGlobalProduct(productId);
    setProducts((p) => p.filter((x) => x.id !== productId));
    if (expandedId === productId) setExpandedId(null);
  }

  async function handleAddYongyang(product: Product) {
    const val = yongyangInput.trim();
    if (!val || product.yongyang.includes(val)) return;
    const updated = [...product.yongyang, val];
    await updateGlobalProduct(product.id, { yongyang: updated });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, yongyang: updated } : p));
    setYongyangInput("");
  }

  async function handleRemoveYongyang(product: Product, idx: number) {
    const updated = product.yongyang.filter((_, i) => i !== idx);
    await updateGlobalProduct(product.id, { yongyang: updated });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, yongyang: updated } : p));
  }

  async function handleAddMagae(product: Product) {
    const val = magaeInput.trim();
    if (!val || product.magae.includes(val)) return;
    const updated = [...product.magae, val];
    await updateGlobalProduct(product.id, { magae: updated });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, magae: updated } : p));
    setMagaeInput("");
  }

  async function handleRemoveMagae(product: Product, idx: number) {
    const updated = product.magae.filter((_, i) => i !== idx);
    await updateGlobalProduct(product.id, { magae: updated });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, magae: updated } : p));
  }

  async function handleAddLabel(product: Product) {
    const val = labelInput.trim();
    if (!val) return;
    const updated = [...product.label, val];
    await updateGlobalProduct(product.id, { label: updated });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, label: updated } : p));
    setLabelInput("");
  }

  async function handleRemoveLabel(product: Product, idx: number) {
    const updated = product.label.filter((_, i) => i !== idx);
    await updateGlobalProduct(product.id, { label: updated });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, label: updated } : p));
  }

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-stone-400 text-sm">불러오는 중...</p></div>;
  }

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center bg-white rounded-2xl border border-stone-200 p-10">
          <p className="text-stone-600 mb-4">관리자만 접근할 수 있습니다.</p>
          <Link href="/" className="text-orange-600 hover:underline text-sm font-medium">홈으로</Link>
        </div>
      </div>
    );
  }

  const filteredClients = clients.filter(
    (c) => c.name.includes(search) || c.username.includes(search) || c.phone.includes(search)
  );
  const filteredOrders = orders.filter((o) => orderFilter === "all" || o.type === orderFilter);

  const inputClass = "border border-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white";

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-orange-200">관리자</span>
        </div>
        <button onClick={handleLogout} className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          로그아웃
        </button>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1 w-fit">
          {(["clients", "products", "orders"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-700"}`}>
              {t === "clients" ? "거래처 관리" : t === "products" ? "제품 관리" : `주문 관리${orders.length > 0 ? ` (${orders.length})` : ""}`}
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
                placeholder="거래처명, 아이디, 연락처로 검색"
                className="w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm" />
            </div>
            {filteredClients.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-sm">
                {search ? "검색 결과가 없습니다." : "등록된 거래처가 없습니다."}
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredClients.map((client) => (
                  <Link key={client.uid} href={`/admin/clients/${client.uid}`}
                    className="bg-white rounded-xl border border-stone-200 px-6 py-4 flex items-center justify-between hover:border-orange-300 hover:shadow-sm transition-all group">
                    <div>
                      <p className="font-semibold text-stone-800 group-hover:text-orange-600 transition-colors">{client.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">@{client.username} · {client.phone}</p>
                    </div>
                    <svg className="w-4 h-4 text-stone-300 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={handleSeed} disabled={seeding}
                className="bg-stone-700 hover:bg-stone-800 disabled:bg-stone-300 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                {seeding ? "추가 중..." : "샘플 데이터"}
              </button>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                제품 추가
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm">
                <p className="mb-3">등록된 제품이 없습니다.</p>
                <button onClick={() => setShowAddModal(true)} className="text-orange-600 hover:underline text-sm font-medium">첫 제품 추가하기</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => {
                  const isExpanded = expandedId === product.id;
                  return (
                    <div key={product.id} className={`bg-white rounded-xl border-2 overflow-hidden transition-colors ${isExpanded ? "border-orange-400" : "border-stone-200 hover:border-orange-200"}`}>
                      <div className="aspect-square bg-stone-50">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-200">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full">{product.category}</span>
                        <p className="font-semibold text-stone-800 text-sm text-center mt-2 mb-3">{product.name}</p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setExpandedId(isExpanded ? null : product.id); setYongyangInput(""); setMagaeInput(""); setLabelInput(""); }}
                            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors border ${isExpanded ? "bg-orange-600 border-orange-600 text-white" : "border-stone-200 text-stone-500 hover:border-orange-400 hover:text-orange-600"}`}>
                            {isExpanded ? "접기" : "옵션"}
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)}
                            className="flex-1 text-xs py-1.5 rounded-lg font-medium border border-stone-200 text-stone-400 hover:border-red-300 hover:text-red-500 transition-colors">
                            삭제
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-orange-100 px-3 py-3 space-y-3 bg-orange-50">
                          {/* 용량 */}
                          <div>
                            <p className="text-xs font-semibold text-stone-500 mb-1.5">용량</p>
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {product.yongyang.map((val, idx) => (
                                <span key={idx} className="flex items-center gap-0.5 bg-white text-orange-700 text-xs px-2 py-0.5 rounded border border-orange-200">
                                  {val}
                                  <button onClick={() => handleRemoveYongyang(product, idx)} className="text-orange-300 hover:text-red-500 ml-0.5">×</button>
                                </span>
                              ))}
                              {product.yongyang.length === 0 && <span className="text-xs text-stone-300">없음</span>}
                            </div>
                            <div className="flex gap-1">
                              <input type="text" value={yongyangInput} onChange={(e) => setYongyangInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddYongyang(product))}
                                placeholder="500ml" className={`flex-1 min-w-0 ${inputClass}`} />
                              <button onClick={() => handleAddYongyang(product)} className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs font-semibold">+</button>
                            </div>
                          </div>
                          {/* 마개 */}
                          <div>
                            <p className="text-xs font-semibold text-stone-500 mb-1.5">마개</p>
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {product.magae.map((val, idx) => (
                                <span key={idx} className="flex items-center gap-0.5 bg-white text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-200">
                                  {val}
                                  <button onClick={() => handleRemoveMagae(product, idx)} className="text-blue-300 hover:text-red-500 ml-0.5">×</button>
                                </span>
                              ))}
                              {product.magae.length === 0 && <span className="text-xs text-stone-300">없음</span>}
                            </div>
                            <div className="flex gap-1">
                              <input type="text" value={magaeInput} onChange={(e) => setMagaeInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMagae(product))}
                                placeholder="일반" className={`flex-1 min-w-0 ${inputClass}`} />
                              <button onClick={() => handleAddMagae(product)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">+</button>
                            </div>
                          </div>
                          {/* 라벨 */}
                          <div>
                            <p className="text-xs font-semibold text-stone-500 mb-1.5">라벨</p>
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {product.label.map((val, idx) => (
                                <span key={idx} className="flex items-center gap-0.5 bg-white text-stone-700 text-xs px-2 py-0.5 rounded border border-stone-200">
                                  {val}
                                  <button onClick={() => handleRemoveLabel(product, idx)} className="text-stone-300 hover:text-red-400 ml-0.5">×</button>
                                </span>
                              ))}
                              {product.label.length === 0 && <span className="text-xs text-stone-300">없음</span>}
                            </div>
                            <div className="flex gap-1">
                              <input type="text" value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLabel(product))}
                                placeholder="태백식품" className={`flex-1 min-w-0 ${inputClass}`} />
                              <button onClick={() => handleAddLabel(product)} className="bg-stone-700 hover:bg-stone-800 text-white px-2 py-1 rounded text-xs font-semibold">+</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 주문 관리 */}
        {tab === "orders" && (
          <>
            <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit mb-4">
              {(["all", "retail", "wholesale"] as const).map((f) => (
                <button key={f} onClick={() => setOrderFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${orderFilter === f ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}>
                  {f === "all" ? "전체" : f === "retail" ? "소매" : "도매"}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-sm">주문 내역이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div key={order.id} className={`rounded-xl border p-5 ${STATUS_CARD[order.status]}`}>
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
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
                      {order.items.map((item, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-stone-700">{item.productName} <span className="text-stone-400">({item.yongyang})</span></span>
                          <span className="font-medium text-stone-800">{item.quantity}개</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3 border-t border-black/5 text-xs text-stone-500 space-y-0.5 mb-3">
                      <p className="font-medium text-stone-700">{order.ordererName} · {order.phone}</p>
                      <p>{order.address}</p>
                      {order.memo && <p className="text-stone-400">비고: {order.memo}</p>}
                    </div>
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
