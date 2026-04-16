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

export interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  yongyang: string[];  // 용량 선택지
  magae: string[];     // 마개 선택지
  label: string[];     // 라벨 선택지
  createdAt: string;
}

export interface ClientAssignment {
  productId: string;
  yongyang: string;
  magae: string;
  label: string;
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
      productId: d.id,
      yongyang: (data.yongyang ?? data.yonggi ?? "") as string,
      magae: (data.magae ?? "") as string,
      label: (data.label ?? "") as string,
    };
  });
}

export async function setClientAssignment(
  clientUid: string,
  assignment: ClientAssignment
): Promise<void> {
  const { productId, ...rest } = assignment;
  await setDoc(
    doc(db, "users", clientUid, "assignedProducts", productId),
    rest
  );
}

export async function removeClientAssignment(
  clientUid: string,
  productId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "users", clientUid, "assignedProducts", productId)
  );
}

// 거래처의 배정된 제품 + 상세 정보 합쳐서 반환
export async function getAssignedProductsWithDetail(
  clientUid: string
): Promise<(Product & { assignment: Omit<ClientAssignment, "productId"> })[]> {
  const [allProducts, assignments] = await Promise.all([
    getProducts(),
    getClientAssignments(clientUid),
  ]);
  const assignMap = new Map(assignments.map((a) => [a.productId, a]));
  return allProducts
    .filter((p) => assignMap.has(p.id))
    .map((p) => ({
      ...p,
      assignment: {
        yongyang: assignMap.get(p.id)!.yongyang,
        magae: assignMap.get(p.id)!.magae,
        label: assignMap.get(p.id)!.label,
      },
    }));
}
