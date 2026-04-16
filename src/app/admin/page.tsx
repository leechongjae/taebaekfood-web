"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getBusinessClients, UserProfile, logout } from "@/lib/auth";
import {
  getProducts,
  updateGlobalProduct,
  deleteGlobalProduct,
  Product,
} from "@/lib/products";
import AddProductModal from "@/components/AddProductModal";

type Tab = "clients" | "products";

const YONGYANG_OPTIONS: Record<string, string[]> = {
  기름: ["300ml", "350ml", "1.75L", "1.8L", "16.5kg"],
  가루: ["200g", "400g", "1kg", "4kg", "20kg"],
};

const HAS_OPTIONS = ["기름", "가루"];

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

  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.replace("/login"); return; }
    if (!profile.isAdmin) { setFetching(false); return; }
    Promise.all([getBusinessClients(), getProducts()]).then(([c, p]) => {
      setClients(c);
      setProducts(p);
      setFetching(false);
    });
  }, [loading, user, profile, router]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  async function handleProductAdded() {
    setProducts(await getProducts());
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm("이 제품을 삭제하시겠습니까?")) return;
    await deleteGlobalProduct(productId);
    setProducts((p) => p.filter((x) => x.id !== productId));
    if (expandedId === productId) setExpandedId(null);
  }

  async function handleToggleYongyang(product: Product, opt: string) {
    const updated = product.yongyang.includes(opt)
      ? product.yongyang.filter((v) => v !== opt)
      : [...product.yongyang, opt];
    await updateGlobalProduct(product.id, { yongyang: updated });
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, yongyang: updated } : p)));
  }

  async function handleAddLabel(product: Product) {
    const val = labelInput.trim();
    if (!val) return;
    const updated = [...product.label, val];
    await updateGlobalProduct(product.id, { label: updated });
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, label: updated } : p)));
    setLabelInput("");
  }

  async function handleRemoveLabel(product: Product, idx: number) {
    const updated = product.label.filter((_, i) => i !== idx);
    await updateGlobalProduct(product.id, { label: updated });
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, label: updated } : p)));
  }

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></div>;
  }

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">관리자만 접근할 수 있습니다.</p>
          <Link href="/" className="text-orange-500 hover:underline">홈으로</Link>
        </div>
      </div>
    );
  }

  const filteredClients = clients.filter(
    (c) => c.name.includes(search) || c.username.includes(search) || c.phone.includes(search)
  );

  const expandedProduct = products.find((p) => p.id === expandedId) ?? null;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">태</span>
            </div>
            <span className="text-lg font-bold text-gray-800">태백식품</span>
          </Link>
          <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-1 rounded-full">관리자</span>
        </div>
        <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          로그아웃
        </button>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex gap-1 mb-6 bg-gray-200 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("clients")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "clients" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            거래처 관리
          </button>
          <button
            onClick={() => setTab("products")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "products" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            제품 관리
          </button>
        </div>

        {/* ── 거래처 관리 탭 ── */}
        {tab === "clients" && (
          <>
            <div className="relative mb-4">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="거래처명, 아이디, 연락처로 검색"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>
            {filteredClients.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                {search ? "검색 결과가 없습니다." : "등록된 거래처가 없습니다."}
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredClients.map((client) => (
                  <Link
                    key={client.uid}
                    href={`/admin/clients/${client.uid}`}
                    className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center justify-between hover:border-orange-300 hover:shadow-sm transition-all group"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">{client.name}</p>
                      <p className="text-sm text-gray-400 mt-0.5">@{client.username} · {client.phone}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-400 mt-4">총 {filteredClients.length}개 거래처{search && ` (전체 ${clients.length}개 중)`}</p>
          </>
        )}

        {/* ── 제품 관리 탭 ── */}
        {tab === "products" && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                제품 추가
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="mb-3">등록된 제품이 없습니다.</p>
                <button onClick={() => setShowAddModal(true)} className="text-orange-500 hover:underline text-sm font-medium">
                  첫 제품 추가하기
                </button>
              </div>
            ) : (
              <>
                {/* 제품 그리드 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                  {products.map((product) => {
                    const hasOpts = HAS_OPTIONS.includes(product.category);
                    const isExpanded = expandedId === product.id;
                    return (
                      <div key={product.id} className={`bg-white rounded-xl border-2 overflow-hidden transition-colors ${isExpanded ? "border-orange-400" : "border-gray-200 hover:border-orange-200"}`}>
                        <div className="aspect-square bg-gray-50">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">{product.category}</span>
                          <p className="font-semibold text-gray-800 text-base text-center mt-2 mb-3">{product.name}</p>
                          <div className="flex gap-1.5">
                            {hasOpts && (
                              <button
                                onClick={() => { setExpandedId(isExpanded ? null : product.id); setLabelInput(""); }}
                                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors border ${isExpanded ? "bg-orange-500 border-orange-500 text-white" : "border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-500"}`}
                              >
                                {isExpanded ? "접기" : "옵션"}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex-1 text-xs py-1.5 rounded-lg font-medium border border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 옵션 설정 패널 */}
                {expandedProduct && (
                  <div className="bg-white rounded-xl border border-orange-200 px-5 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-700">{expandedProduct.name} — 옵션 설정</p>
                      <button onClick={() => setExpandedId(null)} className="text-gray-400 hover:text-gray-600 text-sm">닫기</button>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">용량</p>
                      <div className="flex flex-wrap gap-2">
                        {(YONGYANG_OPTIONS[expandedProduct.category] ?? []).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleToggleYongyang(expandedProduct, opt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              expandedProduct.yongyang.includes(opt)
                                ? "bg-orange-500 border-orange-500 text-white"
                                : "bg-white border-gray-300 text-gray-600 hover:border-orange-300"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">라벨</p>
                      {expandedProduct.label.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {expandedProduct.label.map((val, idx) => (
                            <span key={idx} className="flex items-center gap-1 bg-white text-gray-700 text-xs px-2.5 py-1 rounded-lg border border-gray-200">
                              {val}
                              <button onClick={() => handleRemoveLabel(expandedProduct, idx)} className="text-gray-300 hover:text-red-400 transition-colors">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={labelInput}
                          onChange={(e) => setLabelInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLabel(expandedProduct))}
                          placeholder="라벨 추가"
                          className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <button
                          onClick={() => handleAddLabel(expandedProduct)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleProductAdded}
        />
      )}
    </main>
  );
}
