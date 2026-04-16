# 🍶 태백식품 주문 홈페이지

태백식품 거래처 전용 온라인 주문 시스템입니다.

---

## 📌 주요 기능

### 고객
- 기존 거래처 로그인 후 배정된 제품 목록 확인
- 제품 이미지 · 용량 · 라벨 정보 조회
- 신규 및 개인 고객 회원가입

### 관리자
- 거래처 목록 조회 및 검색
- 제품 추가 / 삭제 / 옵션 설정 (용량 · 라벨)
- 거래처별 제품 배정 및 옵션 지정

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 인증 | Firebase Authentication |
| 데이터베이스 | Firebase Firestore |
| 배포 | Vercel (예정) |

---

## 📁 페이지 구조

```
/                        # 랜딩 페이지 (기존 거래처 / 신규 및 개인)
/login                   # 로그인
/register                # 회원가입
/find-id                 # 아이디 찾기
/reset-password          # 비밀번호 재설정
/existing                # 기존 거래처 주문 목록
/new                     # 신규·개인 고객 페이지
/admin                   # 관리자 (거래처 관리 / 제품 관리)
/admin/clients/[uid]     # 거래처별 제품 배정
```

---

## ⚙️ 로컬 실행

```bash
# 패키지 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local에 Firebase 설정값 입력

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인

---

## 🔐 환경변수

`.env.local` 파일에 아래 값을 설정하세요.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 📦 카테고리별 용량 옵션

| 카테고리 | 용량 |
|----------|------|
| 기름 | 300ml · 350ml · 1.75L · 1.8L · 16.5kg |
| 가루 | 200g · 400g · 1kg · 4kg · 20kg |
| 부자재 / 기타 | 옵션 없음 |
