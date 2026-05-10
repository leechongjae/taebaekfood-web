import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  uid: string;
  username: string;   // 아이디 (로그인용)
  name: string;       // 실명
  phone: string;      // 연락처
  email: string;      // 이메일 (Firebase Auth 및 비밀번호 재설정용)
  type: "business" | "individual"; // 기존 거래처 | 신규 및 개인
  isAdmin?: boolean;  // 관리자 여부 (Firestore에서 수동 설정)
  clientId?: string;  // clients 컬렉션 연결 ID
  createdAt: string;
}

// 기존 거래처 목록 조회 (관리자용)
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

  // 아이디 중복 체크
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error("이미 사용 중인 아이디입니다.");
  }

  // Firebase Auth 계정 생성 (실제 이메일 사용)
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // 이름 설정
  await updateProfile(credential.user, { displayName: name });

  // Firestore에 사용자 정보 저장
  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    username,
    name,
    phone,
    email,
    type,
    createdAt: new Date().toISOString(),
  });
}

// 로그인 (username → Firestore에서 실제 이메일 조회 후 인증)
export async function login(username: string, password: string): Promise<User> {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
  const userData = snapshot.docs[0].data() as UserProfile;
  try {
    const credential = await signInWithEmailAndPassword(auth, userData.email, password);
    return credential.user;
  } catch {
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
}

// 로그아웃
export async function logout(): Promise<void> {
  await signOut(auth);
}

// 아이디 찾기 (이름 + 연락처로 조회)
export async function findUsername(name: string, phone: string): Promise<string | null> {
  const q = query(
    collection(db, "users"),
    where("name", "==", name),
    where("phone", "==", phone)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data() as UserProfile;
  return data.username;
}

// 비밀번호 재설정 (아이디 + 이름 + 연락처 확인 후 실제 이메일로 재설정 메일 발송)
export async function resetPassword(
  username: string,
  name: string,
  phone: string
): Promise<void> {
  const q = query(
    collection(db, "users"),
    where("username", "==", username),
    where("name", "==", name),
    where("phone", "==", phone)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error("입력하신 정보와 일치하는 계정이 없습니다.");
  }

  const userData = snapshot.docs[0].data() as UserProfile;
  await sendPasswordResetEmail(auth, userData.email);
}

// 아이디 중복 확인
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

// 현재 로그인된 사용자 프로필 조회
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserProfile;
}
