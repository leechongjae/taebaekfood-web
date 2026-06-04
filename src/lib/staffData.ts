/**
 * staff 앱의 partner_item · items · orders 컬렉션을 직접 읽고 쓰는 어댑터.
 * 같은 Firebase 프로젝트(taebaek-3abe4)를 공유하므로 별도 동기화 없이 직결.
 */
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  documentId,
} from "firebase/firestore";
import { db } from "./firebase";

export interface StaffPartnerItem {
  itemId: string;
  name: string;
  spec: string;          // 용량 표기 (partnerItem.displaySize ?? item.spec)
  category: string;      // staff category 원본 문자열
  categoryLabel: string; // 거래처 화면 표기용 한글 라벨
  subtype?: string;
  qtyPerBox?: number;    // 박스당 개수 (있으면 박스 단위 선택 가능)
  price: number;         // 단가 (UI 비노출, 주문 작성 시 totalAmount 계산용)
}

const CATEGORY_LABEL: Record<string, string> = {
  product: "완제품",
  goods: "상품",
  giftset: "선물세트",
  wip: "반제품",
  raw: "원료",
  submaterial: "부자재",
  shipping: "배송",
  완제품: "완제품",
  향미유: "향미유",
  고춧가루: "고춧가루",
};

function labelOf(cat: string, subtype?: string): string {
  if (subtype) return subtype;
  return CATEGORY_LABEL[cat] ?? cat ?? "기타";
}

export async function getPartnerItemsForOrder(partnerId: string): Promise<StaffPartnerItem[]> {
  if (!partnerId) return [];

  const [piSnap, srSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "partner_item"),
        where("Partner_ID", "==", partnerId),
        where("Direction", "==", "out"),
      ),
    ),
    // shipping_rule 컬렉션 — 박스당 개수의 정식 출처 (거래처별 오버라이드 + 전체 기본값)
    getDocs(collection(db, "shipping_rule")),
  ]);
  if (piSnap.empty) return [];

  const piDocs = piSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const srDocs = srSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const itemIds = Array.from(
    new Set(piDocs.map((d) => d.Item_ID as string).filter(Boolean)),
  );
  if (itemIds.length === 0) return [];

  // Firestore "in" 쿼리는 최대 10개 → 청크
  const chunks: string[][] = [];
  for (let i = 0; i < itemIds.length; i += 10) chunks.push(itemIds.slice(i, i + 10));

  const itemMap = new Map<string, Record<string, unknown>>();
  for (const chunk of chunks) {
    const itSnap = await getDocs(
      query(collection(db, "items"), where(documentId(), "in", chunk)),
    );
    itSnap.docs.forEach((d) => itemMap.set(d.id, d.data() as Record<string, unknown>));
  }

  // 박스당 개수 해석: partner_item.qtyPerBox/qty_per_box 우선
  //   → shipping_rule (partner_id==이 거래처) → shipping_rule (partner_id 없음, 전체 기본값)
  const resolveQtyPerBox = (itemId: string, piQty?: number): number | undefined => {
    if (piQty && piQty > 0) return piQty;
    const specific = srDocs.find(
      (r) => r.item_id === itemId && r.partner_id === partnerId,
    );
    const specificQty = specific?.qty_per_box as number | undefined;
    if (specificQty && specificQty > 0) return specificQty;
    const fallback = srDocs.find(
      (r) => r.item_id === itemId && !r.partner_id,
    );
    const fallbackQty = fallback?.qty_per_box as number | undefined;
    if (fallbackQty && fallbackQty > 0) return fallbackQty;
    return undefined;
  };

  const seen = new Set<string>();
  const results: StaffPartnerItem[] = [];
  for (const pi of piDocs) {
    const itemId = pi.Item_ID as string;
    if (!itemId || seen.has(itemId)) continue;
    const item = itemMap.get(itemId);
    if (!item) continue;
    seen.add(itemId);

    const category = (item.category as string) ?? "";
    const subtype = item.subtype as string | undefined;
    const piQty =
      (pi.qtyPerBox as number | undefined) ?? (pi.qty_per_box as number | undefined);
    const qtyPerBox = resolveQtyPerBox(itemId, piQty);

    results.push({
      itemId,
      name: (item.name as string) ?? "(이름 없음)",
      spec: ((pi.displaySize as string | undefined) ?? (item.spec as string | undefined) ?? "").trim(),
      category,
      categoryLabel: labelOf(category, subtype),
      subtype,
      qtyPerBox,
      price:
        (pi.price as number | undefined) ??
        (pi.Standard_Price as number | undefined) ??
        (item.price as number | undefined) ??
        0,
    });
  }

  results.sort(
    (a, b) =>
      a.categoryLabel.localeCompare(b.categoryLabel, "ko") ||
      a.name.localeCompare(b.name, "ko"),
  );
  return results;
}

// ── staff orders 컬렉션에 쓰는 주문 ──────────────────────────────────────────

export interface StaffOrderItemInput {
  itemId: string;
  name: string;
  quantity: number;        // 최종 수량 (낱개 단위)
  price: number;           // 단가 (서버측 계산용)
  isBoxUnit?: boolean;
  boxQuantity?: number;    // 박스 수 (isBoxUnit=true일 때)
  unitsPerBox?: number;
  displaySize?: string;    // 서류 규격란 표기
}

export interface CreateStaffOrderInput {
  partnerId: string;
  partnerName: string;
  items: StaffOrderItemInput[];
  deliveryDate: string;    // YYYY-MM-DD
  email: string;
  memo?: string;
  ordererName?: string;
  phone?: string;
  address?: string;
  region?: string;
}

/**
 * staff Order 스키마(src/shared/types.ts)에 맞춰 orders 컬렉션에 한 건 생성.
 * - status: 'PENDING'
 * - source: '일반'
 * - totalAmount: items의 price * quantity 합계
 */
export async function createStaffOrder(input: CreateStaffOrderInput): Promise<string> {
  const totalAmount = input.items.reduce((sum, it) => sum + (it.price ?? 0) * it.quantity, 0);
  const orderItems = input.items.map((it) => {
    const itemDoc: Record<string, unknown> = {
      itemId: it.itemId,
      name: it.name,
      quantity: it.quantity,
      price: it.price ?? 0,
    };
    if (it.isBoxUnit) {
      itemDoc.isBoxUnit = true;
      if (it.boxQuantity !== undefined) itemDoc.boxQuantity = it.boxQuantity;
      if (it.unitsPerBox !== undefined) itemDoc.unitsPerBox = it.unitsPerBox;
    }
    if (it.displaySize) itemDoc.displaySize = it.displaySize;
    return itemDoc;
  });

  const orderDoc: Record<string, unknown> = {
    partnerId: input.partnerId,
    partnerName: input.partnerName,
    items: orderItems,
    totalAmount,
    status: "PENDING",
    source: "일반",
    createdAt: new Date().toISOString(),
    deliveryDate: input.deliveryDate,
    email: input.email,
  };
  if (input.memo) orderDoc.memo = input.memo;
  if (input.ordererName) orderDoc.ordererName = input.ordererName;
  if (input.phone) orderDoc.phone = input.phone;
  if (input.address) orderDoc.address = input.address;
  if (input.region) orderDoc.region = input.region;

  const ref = await addDoc(collection(db, "orders"), orderDoc);
  return ref.id;
}

// ── staff orders 조회 (완료 화면 · 내 주문 화면용) ───────────────────────────

export type StaffOrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DISPATCHED" | "DELIVERED" | "ON_HOLD";

export const STAFF_ORDER_STATUS_LABEL: Record<StaffOrderStatus, string> = {
  PENDING: "주문 접수",
  PROCESSING: "처리 중",
  SHIPPED: "출고",
  DISPATCHED: "배송 중",
  DELIVERED: "배송 완료",
  ON_HOLD: "보류",
};

export interface StaffOrderItemDoc {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  isBoxUnit?: boolean;
  boxQuantity?: number;
  unitsPerBox?: number;
  displaySize?: string;
}

export interface StaffOrder {
  id: string;
  partnerId?: string;
  partnerName: string;
  items: StaffOrderItemDoc[];
  totalAmount: number;
  status: StaffOrderStatus;
  createdAt: string;
  deliveryDate: string;
  email?: string;
  source?: string;
  ordererName?: string;
  phone?: string;
  address?: string;
  memo?: string;
  region?: string;
}

export async function getStaffOrder(orderId: string): Promise<StaffOrder | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<StaffOrder, "id">) };
}

export async function getStaffOrdersByPartner(partnerId: string): Promise<StaffOrder[]> {
  if (!partnerId) return [];
  const snap = await getDocs(
    query(collection(db, "orders"), where("partnerId", "==", partnerId)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<StaffOrder, "id">) }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export function fmtStaffOrderItem(item: StaffOrderItemDoc): string {
  if (item.isBoxUnit && item.boxQuantity) {
    if (item.unitsPerBox) return `${item.boxQuantity}박스 · ${item.quantity}개`;
    return `${item.boxQuantity}박스`;
  }
  return `${item.quantity}개`;
}

