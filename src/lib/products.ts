import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export const BOX_TYPES = ["1", "2", "3", "4", "5", "5-1", "5-2", "6", "8"] as const;

export interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  yongyang: string[];
  magae: string[];
  label: string[];
  createdAt: string;
}

export interface ClientAssignment {
  productId: string;
  yongyang: string;
  magae: string;
  label: string;
  boxType?: string;
  boxQty?: number;
}

export const CATEGORIES = ["기름", "가루", "부자재", "기타"];

// ── 글로벌 제품 카탈로그 ──────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs
    .map((d) => {
      const data = d.data() as Omit<Product, "id">;
      return {
        ...data,
        id: d.id,
        yongyang: data.yongyang ?? (data as Record<string, unknown>).yonggi as string[] ?? [],
        magae: data.magae ?? [],
        label: data.label ?? [],
      };
    })
    .sort(
      (a, b) =>
        CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
        a.name.localeCompare(b.name, "ko")
    );
}

export async function addGlobalProduct(
  product: Omit<Product, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "products"), {
    ...product,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateGlobalProduct(
  productId: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "products", productId), data);
}

export async function deleteGlobalProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, "products", productId));
}

// ── 거래처별 제품 배정 ────────────────────────────────────

export async function getClientAssignments(
  clientUid: string
): Promise<ClientAssignment[]> {
  const snapshot = await getDocs(
    collection(db, "users", clientUid, "assignedProducts")
  );
  return snapshot.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      productId: (data.productId ?? d.id) as string,
      yongyang: (data.yongyang ?? data.yonggi ?? "") as string,
      magae: (data.magae ?? "") as string,
      label: (data.label ?? "") as string,
      boxType: (data.boxType ?? "") as string,
      boxQty: (data.boxQty ?? 0) as number,
    };
  });
}

export async function setClientAssignment(
  clientUid: string,
  assignment: ClientAssignment
): Promise<void> {
  const { productId, yongyang, ...rest } = assignment;
  const docId = yongyang ? `${productId}::${yongyang}` : productId;
  await setDoc(doc(db, "users", clientUid, "assignedProducts", docId), { productId, yongyang, ...rest });
}

export async function removeClientAssignment(
  clientUid: string,
  productId: string,
  yongyang?: string
): Promise<void> {
  const docId = yongyang ? `${productId}::${yongyang}` : productId;
  await deleteDoc(doc(db, "users", clientUid, "assignedProducts", docId));
}

export async function getAssignedProductsWithDetail(
  clientUid: string
): Promise<(Product & { assignment: Omit<ClientAssignment, "productId"> })[]> {
  const [allProducts, assignments] = await Promise.all([
    getProducts(),
    getClientAssignments(clientUid),
  ]);
  const productMap = new Map(allProducts.map((p) => [p.id, p]));
  return assignments
    .filter((a) => productMap.has(a.productId) && a.yongyang)
    .map((a) => ({
      ...productMap.get(a.productId)!,
      assignment: {
        yongyang: a.yongyang,
        magae: a.magae,
        label: a.label,
        boxType: a.boxType,
        boxQty: a.boxQty,
      },
    }))
    .sort(
      (a, b) =>
        CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
        a.name.localeCompare(b.name, "ko")
    );
}
