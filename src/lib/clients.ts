import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteField,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
  region?: string;
  partnerType?: string;
  purchaseItems?: { id: string; name: string }[];
  linkedUserId?: string;
}

export interface ItemCustomer {
  id: string;
  item_id: string;
  customer_id: string;
  displaySize: string;
  qty_per_box: number;
  packageType: string;
  price?: number;
}

export async function getClients(): Promise<Client[]> {
  const snap = await getDocs(collection(db, "clients"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Client))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export async function getClient(clientId: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, "clients", clientId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Client;
}

export async function getItemCustomersForClient(clientId: string): Promise<ItemCustomer[]> {
  const q = query(collection(db, "item_customer"), where("customer_id", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ItemCustomer));
}

export async function linkUserToClient(userId: string, clientId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId), { clientId });
  await updateDoc(doc(db, "clients", clientId), { linkedUserId: userId });
}

export async function unlinkUserFromClient(userId: string, clientId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId), { clientId: deleteField() });
  await updateDoc(doc(db, "clients", clientId), { linkedUserId: deleteField() });
}
