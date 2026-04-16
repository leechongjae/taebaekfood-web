"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, UserProfile } from "@/lib/auth";
import {
  getProducts,
  getClientAssignments,
  setClientAssignment,
  removeClientAssignment,
  Product,
  ClientAssignment,
  CATEGORIES,
} from "@/lib/products";

export default function ClientProductsPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [client, setClient] = useState<UserProfile | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [assignments, setAssignments] = useState<Map<string, Omit<ClientAssignment, "productId">>>(new Map());
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.replace("/login"); return; }
    if (!profile.isAdmin) { router.replace("/"); return; }

    Promise.all([
      getUserProfile(uid),
      getProducts(),
      getClientAssignments(uid),
    ]).then(([clientData, products, existing]) => {
      setClient(clientData);
      setAllProducts(products);
      const map = new Map<string, Omit<ClientAssignment, "productId">>();
      existing.forEach((a) => map.set(a.productId, { yongyang: a.yongyang, magae: a.magae, label: a.label }));
      setAssignments(map);
      setFetching(false);
    });
  }, [loading, user, profile, uid, router]);

  async function handleToggle(product: Product, checked: boolean) {
    if (checked) {
      const newAssign = { yongyang: "", magae: "", label: "" };
      await setClientAssignment(uid, { productId: product.id, ...newAssign });
      setAssignments((prev) => new Map(prev).set(product.id, newAssign));
    } else {
      await removeClientAssignment(uid, product.id);
      setAssignments((prev) => {
        const next = new Map(prev);
        next.delete(product.id);
        return next;
      });
    }
  }

  async function handleOptionChange(
    product: Product,
    field: "yongyang" | "label",
    value: string
  ) {
    setSaving(product.id);
    const current = assignments.get(product.id) ?? { yongyang: "", magae: "", label: "" };
    const updated = { ...current, [field]: value };
    await setClientAssignment(uid, { productId: product.id, ...updated });
    setAssignments((prev) => new Map(prev).set(product.id, updated));
    setSaving(null);
  }

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></div>;
  }

  const grouped = CATEGORIES.reduce<Record<string, Product[]>>((acc, cat) => {
    acc[cat] = allProducts.filter((p) => p.category === cat);
    return acc;
  }, {});

  const OPTION_LABELS: Record<"yongyang" | "label", string> = {
    yongyang: "용량",
    label: "라벨",
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{client?.name ?? uid}</h1>
          <p className="text-sm text-gray-400">@{client?.username} · {client?.phone}</p>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-4">
        <p className="text-sm text-gray-500 mb-2">
          제품을 체크하면 이 거래처에 연동됩니다. 체크 후 용량/마개/라벨을 선택하세요.
        </p>

        {allProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            먼저 <Link href="/admin" className="text-orange-500 underline">제품 관리</Link>에서 제품을 추가해주세요.
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            return (
              <section key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-700 text-sm">{cat}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {items.map((product) => {
                    const isAssigned = assignments.has(product.id);
                    const current = assignments.get(product.id) ?? { yongyang: "", magae: "", label: "" };
                    const isSaving = saving === product.id;

                    return (
                      <li key={product.id} className="px-5 py-4">
                        <label className="flex items-center gap-3 cursor-pointer mb-3">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => handleToggle(product, e.target.checked)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                          )}
                          <span className="font-medium text-gray-800">{product.name}</span>
                          {isSaving && <span className="text-xs text-orange-400 ml-auto">저장 중...</span>}
                        </label>

                        {isAssigned && (
                          <div className="grid grid-cols-3 gap-3 ml-7">
                            {(["yongyang", "label"] as const).map((field) => (
                              <div key={field}>
                                <p className="text-xs text-gray-400 mb-1">{OPTION_LABELS[field]}</p>
                                {product[field].length === 0 ? (
                                  <p className="text-xs text-gray-300 italic">옵션 없음</p>
                                ) : (
                                  <select
                                    value={current[field]}
                                    onChange={(e) => handleOptionChange(product, field, e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                  >
                                    <option value="">선택 안함</option>
                                    {product[field].map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
