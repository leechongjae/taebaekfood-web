"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, UserProfile } from "@/lib/auth";
import {
  getProducts,
  getClientAssignments,
  setClientAssignment,
  removeClientAssignment,
  Product,
  CATEGORIES,
  BOX_TYPES,
} from "@/lib/products";

type AssignData = { label: string; boxType: string; boxQty: number };

function aKey(productId: string, yongyang: string) {
  return `${productId}::${yongyang}`;
}

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
  const [assignments, setAssignments] = useState<Map<string, AssignData>>(new Map());
  const [originalKeys, setOriginalKeys] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.replace("/login"); return; }
    if (!profile.isAdmin) { router.replace("/"); return; }

    Promise.all([getUserProfile(uid), getProducts(), getClientAssignments(uid)]).then(
      ([clientData, products, existing]) => {
        setClient(clientData);
        setAllProducts(products);
        const map = new Map<string, AssignData>();
        existing.forEach((a) => {
          map.set(aKey(a.productId, a.yongyang), {
            label: a.label,
            boxType: a.boxType ?? "",
            boxQty: a.boxQty ?? 0,
          });
        });
        setAssignments(map);
        setOriginalKeys(new Set(map.keys()));
        setFetching(false);
      }
    );
  }, [loading, user, profile, uid, router]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function toggleYongyang(productId: string, yongyang: string, checked: boolean) {
    const key = aKey(productId, yongyang);
    setAssignments((prev) => {
      const next = new Map(prev);
      if (checked) next.set(key, { label: "", boxType: "", boxQty: 0 });
      else next.delete(key);
      return next;
    });
    setIsDirty(true);
  }

  function updateBoxConfig(productId: string, yongyang: string, field: "type" | "qty", val: string) {
    const key = aKey(productId, yongyang);
    setAssignments((prev) => {
      const next = new Map(prev);
      const cur = next.get(key) ?? { label: "", boxType: "", boxQty: 0 };
      next.set(key, field === "type"
        ? { ...cur, boxType: val, boxQty: val === "" ? 0 : cur.boxQty }
        : { ...cur, boxQty: Number(val) }
      );
      return next;
    });
    setIsDirty(true);
  }

  function updateLabel(productId: string, yongyang: string, val: string) {
    const key = aKey(productId, yongyang);
    setAssignments((prev) => {
      const next = new Map(prev);
      const cur = next.get(key) ?? { label: "", boxType: "", boxQty: 0 };
      next.set(key, { ...cur, label: val });
      return next;
    });
    setIsDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const key of originalKeys) {
        if (!assignments.has(key)) {
          const [productId, yongyang] = key.split("::");
          await removeClientAssignment(uid, productId, yongyang);
        }
      }
      for (const [key, data] of assignments) {
        const [productId, yongyang] = key.split("::");
        await setClientAssignment(uid, { productId, yongyang, magae: "", ...data });
      }
      setOriginalKeys(new Set(assignments.keys()));
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBack() {
    if (isDirty) {
      const confirmed = window.confirm(
        "저장되지 않은 변경사항이 있습니다.\n저장하시겠습니까?"
      );
      if (confirmed) await handleSave();
    }
    router.push("/admin");
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  const grouped = CATEGORIES.reduce<Record<string, Product[]>>((acc, cat) => {
    acc[cat] = allProducts.filter((p) => p.category === cat);
    return acc;
  }, {});

  const sel = "border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";

  return (
    <main className="min-h-screen flex flex-col pb-24">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={handleBack} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800">{client?.name ?? uid}</h1>
          <p className="text-sm text-gray-400 truncate">@{client?.username} · {client?.phone}</p>
        </div>
        {isDirty && <span className="text-xs text-orange-500 font-semibold flex-shrink-0">미저장</span>}
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex-shrink-0 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 space-y-4">
        <p className="text-sm text-gray-500">
          용량을 체크하면 거래처에 해당 품목이 연동됩니다.
        </p>

        {allProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            먼저{" "}
            <Link href="/admin" className="text-orange-500 underline">
              제품 관리
            </Link>
            에서 제품을 추가해주세요.
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
                  {items.map((product) => (
                    <li key={product.id} className="px-5 py-4">
                      <div className="flex items-center gap-3 mb-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                          />
                        )}
                        <span className="font-semibold text-gray-800">{product.name}</span>
                      </div>

                      {product.yongyang.length === 0 ? (
                        <p className="text-xs text-gray-300 ml-11 italic">용량 옵션 없음</p>
                      ) : (
                        <div className="space-y-2.5 ml-11">
                          {product.yongyang.map((size) => {
                            const key = aKey(product.id, size);
                            const isChecked = assignments.has(key);
                            const cfg = assignments.get(key);
                            return (
                              <div key={size} className="flex items-center gap-3 flex-wrap">
                                <label className="flex items-center gap-2 cursor-pointer w-20 flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => toggleYongyang(product.id, size, e.target.checked)}
                                    className="w-4 h-4 accent-orange-500"
                                  />
                                  <span className="text-sm text-gray-700 font-medium">{size}</span>
                                </label>
                                {isChecked && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <select
                                      value={cfg?.boxType ?? ""}
                                      onChange={(e) => updateBoxConfig(product.id, size, "type", e.target.value)}
                                      className={sel}
                                    >
                                      <option value="">낱개</option>
                                      {BOX_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}호</option>
                                      ))}
                                    </select>
                                    {cfg?.boxType && (
                                      <>
                                        <input
                                          type="number"
                                          min="1"
                                          placeholder="개수"
                                          value={cfg.boxQty || ""}
                                          onChange={(e) => updateBoxConfig(product.id, size, "qty", e.target.value)}
                                          className={`w-16 ${sel}`}
                                        />
                                        <span className="text-xs text-gray-400">개/박스</span>
                                      </>
                                    )}
                                    {product.label.length > 0 && (
                                      <select
                                        value={cfg?.label ?? ""}
                                        onChange={(e) => updateLabel(product.id, size, e.target.value)}
                                        className={sel}
                                      >
                                        <option value="">라벨 없음</option>
                                        {product.label.map((l) => (
                                          <option key={l} value={l}>{l}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? "저장 중..." : isDirty ? "변경사항 저장하기" : "저장된 상태"}
          </button>
        </div>
      </div>
    </main>
  );
}
