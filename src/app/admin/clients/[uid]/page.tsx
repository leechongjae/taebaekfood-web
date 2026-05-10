"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getBusinessClients, UserProfile } from "@/lib/auth";
import {
  getClient,
  getItemCustomersForClient,
  linkUserToClient,
  unlinkUserFromClient,
  Client,
  ItemCustomer,
} from "@/lib/clients";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid: clientId } = use(params);
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<ItemCustomer[]>([]);
  const [businessUsers, setBusinessUsers] = useState<UserProfile[]>([]);
  const [linkedUser, setLinkedUser] = useState<UserProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [fetching, setFetching] = useState(true);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) { router.replace("/login"); return; }
    if (!profile.isAdmin) { router.replace("/"); return; }

    Promise.all([
      getClient(clientId),
      getItemCustomersForClient(clientId),
      getBusinessClients(),
    ]).then(([clientData, itemData, users]) => {
      setClient(clientData);
      setItems(itemData);
      setBusinessUsers(users);
      if (clientData?.linkedUserId) {
        setLinkedUser(users.find((u) => u.uid === clientData.linkedUserId) ?? null);
      }
      setFetching(false);
    });
  }, [loading, user, profile, clientId, router]);

  async function handleLink() {
    if (!selectedUserId || !client) return;
    setLinking(true);
    try {
      await linkUserToClient(selectedUserId, client.id);
      const linked = businessUsers.find((u) => u.uid === selectedUserId) ?? null;
      setLinkedUser(linked);
      setClient((prev) => prev ? { ...prev, linkedUserId: selectedUserId } : prev);
      setSelectedUserId("");
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink() {
    if (!client?.linkedUserId || !linkedUser) return;
    if (!confirm(`${linkedUser.name} 계정 연결을 해제하시겠습니까?`)) return;
    setLinking(true);
    try {
      await unlinkUserFromClient(client.linkedUserId, client.id);
      setLinkedUser(null);
      setClient((prev) => prev ? { ...prev, linkedUserId: undefined } : prev);
    } finally {
      setLinking(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-400 text-sm">거래처를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const itemNameMap = new Map(
    (client.purchaseItems ?? []).map((p) => [p.id, p.name])
  );

  const unlinkedUsers = businessUsers.filter(
    (u) => !u.clientId && u.uid !== client.linkedUserId
  );

  const groupedItems = items.reduce<Record<string, ItemCustomer[]>>((acc, item) => {
    const name = itemNameMap.get(item.item_id) ?? item.item_id;
    if (!acc[name]) acc[name] = [];
    acc[name].push(item);
    return acc;
  }, {});

  return (
    <main className="min-h-screen flex flex-col pb-10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => router.push("/admin")}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-stone-800">{client.name}</h1>
          <p className="text-sm text-stone-400">
            {client.type ?? ""}
            {client.region ? ` · ${client.region}` : ""}
            {client.phone ? ` · ${client.phone}` : ""}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-6 py-6 space-y-6">

        {/* 웹 계정 연결 */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-sm font-bold text-stone-700 mb-4">웹 계정 연결</h2>
          {linkedUser ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-800">{linkedUser.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">@{linkedUser.username} · {linkedUser.phone}</p>
              </div>
              <button
                onClick={handleUnlink}
                disabled={linking}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                연결 해제
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-stone-400 mb-3">
                거래처가 회원가입한 계정을 선택하여 연결하세요. 연결 후 해당 계정으로 로그인하면 이 거래처의 품목으로 주문할 수 있습니다.
              </p>
              {unlinkedUsers.length === 0 ? (
                <p className="text-xs text-stone-300">연결 가능한 계정이 없습니다. 거래처가 먼저 회원가입해야 합니다.</p>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">계정 선택...</option>
                    {unlinkedUsers.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.name} (@{u.username})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleLink}
                    disabled={!selectedUserId || linking}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    연결
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 연동 품목 (읽기 전용) */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-stone-700">연동 품목</h2>
            <span className="text-xs text-stone-400">수정은 기존 앱에서 진행해주세요</span>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">연동된 품목이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([itemName, configs]) => (
                <div key={itemName}>
                  <p className="text-sm font-semibold text-stone-700 mb-2">{itemName}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {configs.map((ic) => (
                      <div
                        key={ic.id}
                        className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2"
                      >
                        <p className="text-sm font-medium text-stone-800">{ic.displaySize}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {ic.packageType}
                          {ic.qty_per_box ? ` · ${ic.qty_per_box}개/박스` : ""}
                          {ic.price ? ` · ${ic.price.toLocaleString()}원` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
