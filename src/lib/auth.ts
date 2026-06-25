import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "./firebase";

export interface UserProfile {
  uid: string;
  username: string;   // 아이디 (로그인용)
  name: string;       // 실명
  phone: string;      // 연락처
  email: string;      // 이메일 (Firebase Auth 및 비밀번호 재설정용)
  type: "business" | "individual"; // 기존 거래처 | 신규 및 개인
  isAdmin?: boolean;  // 관리자 여부 (Firestore에서 수동 설정)
  clientId?: string;  // clients 컬렉션 연결 ID (구형)
  status?: "pending" | "approved" | "rejected"; // business 가입 시에만 사용 — staff admin 승인 필요
  linkedPartnerId?: string | null;              // staff partners 컬렉션 ID (승인 시 매핑)
  linkedPartnerName?: string | null;            // staff partners.name 스냅샷 (표시용)
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
}

// usernames/{username} 공개 매핑 문서 형태
interface UsernameDoc {
  uid: string;
  email: string;
}

// 기존 거래처 목록 조회 (관리자용 — 인증된 상태에서만 호출)
export async function getBusinessClients(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("type", "==", "business"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data() as UserProfile)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

// 회원가입
export async function register(
  username: string,
  password: string,
  name: string,
  phone: string,
  email: string,
  type: "business" | "individual"
): Promise<void> {
  if (!email) throw new Error("이메일은 필수입니다.");

  // 아이디 중복 체크 — 공개 조회용 usernames 컬렉션의 단일 문서 확인 (미인증 가능)
  const existing = await getDoc(doc(db, "usernames", username));
  if (existing.exists()) {
    throw new Error("이미 사용 중인 아이디입니다.");
  }

  // Firebase Auth 계정 생성 (실제 이메일 사용) — 이 시점부터 request.auth 발급됨
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // 이름 설정
  await updateProfile(credential.user, { displayName: name });

  // Firestore에 사용자 정보 저장
  // business(기존 거래처) 가입은 staff admin의 승인 + 거래처 연결을 거쳐야 주문 가능
  const profile: Record<string, unknown> = {
    uid: credential.user.uid,
    username,
    name,
    phone,
    email,
    type,
    createdAt: new Date().toISOString(),
  };
  if (type === "business") {
    profile.status = "pending";
    profile.linkedPartnerId = null;
  }
  await setDoc(doc(db, "users", credential.user.uid), profile);

  // 아이디 → 이메일 공개 매핑 생성 (로그인/중복확인이 미인증 상태에서 단일 조회 가능하도록)
  await setDoc(doc(db, "usernames", username), {
    uid: credential.user.uid,
    email,
  } satisfies UsernameDoc);
}

// 로그인 (username → usernames 매핑에서 이메일 조회 후 인증)
export async function login(username: string, password: string): Promise<User> {
  const snap = await getDoc(doc(db, "usernames", username));
  if (!snap.exists()) {
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
  const { email } = snap.data() as UsernameDoc;
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch {
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
}

// 로그아웃
export async function logout(): Promise<void> {
  await signOut(auth);
}

// 아이디 찾기 (이름 + 연락처) — 개인정보 역검색이라 서버(Cloud Function)에서 검증
export async function findUsername(name: string, phone: string): Promise<string | null> {
  const fn = httpsCallable<{ name: string; phone: string }, { username: string | null }>(
    functions,
    "findUsername",
  );
  const res = await fn({ name, phone });
  return res.data.username;
}

// 비밀번호 재설정 (아이디 + 이름 + 연락처) — 서버에서 본인 확인 후 이메일 회신, 클라이언트가 재설정 메일 발송
export async function resetPassword(
  username: string,
  name: string,
  phone: string
): Promise<void> {
  const fn = httpsCallable<{ username: string; name: string; phone: string }, { email: string }>(
    functions,
    "requestPasswordReset",
  );
  const res = await fn({ username, name, phone });
  await sendPasswordResetEmail(auth, res.data.email);
}

// 아이디 중복 확인 — 공개 조회용 usernames 컬렉션의 단일 문서 확인 (미인증 가능)
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "usernames", username));
  return !snap.exists();
}

// 현재 로그인된 사용자 프로필 조회
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserProfile;
}
