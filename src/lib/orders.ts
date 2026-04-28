import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "주문 접수",
  confirmed: "주문 확인",
  preparing: "출고 준비",
  shipped: "배송 중",
  delivered: "배송 완료",
  cancelled: "취소",
};

export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  yongyang: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  type: "retail" | "wholesale";
  items: OrderItem[];
  ordererName: string;
  phone: string;
  address: string;
  deliveryDate: string;
  memo: string;
  status: OrderStatus;
  paymentKey?: string;
  createdAt: string;
}

export async function createOrder(
  order: Omit<Order, "id" | "createdAt" | "status"> & { type: "retail" | "wholesale" }
): Promise<string> {
  const ref = await addDoc(collection(db, "orders"), {
    ...order,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Order))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), { status });
}

export async function updateOrderPaymentKey(
  orderId: string,
  paymentKey: string
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), { paymentKey, status: "confirmed" });
}
