# Supabase Token Viewer - 구현 계획

## 기술 스택

| 역할 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | SvelteKit | 파일 기반 라우팅, 서버/클라이언트 분리가 OAuth 콜백 처리에 자연스러움 |
| 언어 | TypeScript | 타입 안전성 |
| Auth SDK | @supabase/supabase-js v2 | 공식 SDK, PKCE flow + autoRefreshToken 지원 |
| 스타일링 | Tailwind CSS v4 | 빠른 UI 구성 |
| 패키지 매니저 | yarn | -

## 라우트 구조

```
src/routes/
├── +page.svelte          # 로그인 페이지 (OAuth 시작 버튼)
├── +layout.svelte        # 공통 레이아웃
├── auth/
│   └── callback/
│       └── +page.server.ts   # OAuth code → Session 교환 (서버 사이드)
└── dashboard/
    └── +page.svelte      # AccessToken 표시 + 디코딩 + 갱신 상태
```

---

## 핵심 구현 단계

### 1단계: 프로젝트 초기화

```bash
yarn create svelte supabase-token-getter
# TypeScript, ESLint, Prettier 선택
cd supabase-token-getter
yarn add @supabase/supabase-js @supabase/ssr
yarn add -D tailwindcss @tailwindcss/vite
```

환경 변수 (`.env`):
```
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

### 2단계: Supabase 클라이언트 초기화

**`src/lib/supabaseClient.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,      // 자동 토큰 갱신 활성화
    persistSession: true,
    detectSessionInUrl: false,   // PKCE: 서버에서 code를 처리하므로 false
    flowType: 'pkce'             // PKCE 흐름 사용 (보안 강화)
  }
})
```

---

### 3단계: 로그인 페이지 - OAuth 2 시작

**`src/routes/+page.svelte`**

- GitHub / Google 로그인 버튼 표시
- 클릭 시 `supabase.auth.signInWithOAuth()` 호출
- `redirectTo`는 `/auth/callback`으로 설정

```typescript
// context7 참조: supabase-js - signInWithOAuth
await supabase.auth.signInWithOAuth({
  provider: 'github',   // 또는 'google'
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

---

### 4단계: OAuth 콜백 - Code → Session 교환

**`src/routes/auth/callback/+page.server.ts`**

OAuth provider에서 돌아올 때 URL에 `?code=xxx` 포함됨.
서버 load 함수에서 `exchangeCodeForSession(code)` 호출.

```typescript
// context7 참조: supabase-js - PKCE exchangeCodeForSession
import { redirect } from '@sveltejs/kit'
import { createServerClient } from '@supabase/ssr'  // SSR용 클라이언트

export const load = async ({ url, cookies }) => {
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createServerClient(/* ... */)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(303, '/dashboard')
    }
  }

  redirect(303, '/?error=callback_failed')
}
```

> **참고:** `@supabase/ssr` 패키지로 쿠키 기반 세션 관리를 서버-클라이언트 간 동기화.

---

### 5단계: 대시보드 - AccessToken 표시 및 디코딩

**`src/routes/dashboard/+page.svelte`**

#### 5-1. 세션에서 AccessToken 추출

```typescript
// context7 참조: supabase-js - getSession
const { data: { session } } = await supabase.auth.getSession()
const accessToken = session?.access_token       // JWT 문자열
const refreshToken = session?.refresh_token     // Refresh token
const expiresAt = session?.expires_at           // 만료 시각 (unix timestamp)
```

#### 5-2. AccessToken(JWT) 디코딩

JWT는 `header.payload.signature` 구조. payload를 Base64url 디코딩.
외부 라이브러리 없이 순수 JS로 디코딩:

```typescript
function decodeJwt(token: string): Record<string, unknown> {
  const [, payloadB64] = token.split('.')
  const payload = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(payload)
}

const decoded = decodeJwt(accessToken)
// { sub, email, role, exp, iat, aud, ... }
```

#### 5-3. 화면 구성

```
┌─────────────────────────────────────────┐
│  Supabase Token Viewer                  │
├─────────────────────────────────────────┤
│  [Access Token]                         │
│  eyJhbGciOiJSUzI1NiIsInR5cCI6Ikp...   │
│  [복사] 버튼                             │
├─────────────────────────────────────────┤
│  [Decoded Payload]                      │
│  {                                      │
│    "sub": "user-uuid",                  │
│    "email": "user@example.com",         │
│    "role": "authenticated",             │
│    "exp": 1234567890,                   │
│    "iat": 1234567890                    │
│  }                                      │
├─────────────────────────────────────────┤
│  토큰 만료: 2026-03-03 12:30:00         │
│  남은 시간: 45분 23초 (실시간 카운트다운)  │
│  자동 갱신: ✅ 활성화                     │
│  최근 갱신: TOKEN_REFRESHED 이벤트 시각  │
└─────────────────────────────────────────┘
```

---

### 6단계: 자동 갱신 모니터링

**`autoRefreshToken: true`** 설정 시 Supabase SDK가 만료 60초 전 자동 갱신.
`onAuthStateChange`로 갱신 이벤트를 수신해 UI 업데이트:

```typescript
// context7 참조: supabase-js - onAuthStateChange
import { onMount, onDestroy } from 'svelte'

let lastRefreshed: Date | null = null

onMount(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        lastRefreshed = new Date()
        accessToken = session?.access_token ?? ''
        // 디코딩된 payload도 재계산
        decoded = decodeJwt(accessToken)
      }
      if (event === 'SIGNED_OUT') {
        goto('/')
      }
    }
  )

  return () => subscription.unsubscribe()  // onDestroy 대신 onMount 반환값
})
```

---

## 파일 목록 (최종)

```
src/
├── lib/
│   └── supabaseClient.ts       # createClient (PKCE, autoRefreshToken)
├── routes/
│   ├── +layout.svelte          # 공통 레이아웃 (Tailwind 적용)
│   ├── +page.svelte            # 로그인 (signInWithOAuth 버튼)
│   ├── auth/callback/
│   │   └── +page.server.ts     # exchangeCodeForSession + redirect
│   └── dashboard/
│       └── +page.svelte        # 토큰 표시, 디코딩, 갱신 모니터링
├── app.css                     # Tailwind 진입점
└── app.html
.env                            # PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY
README.md                       # 프로젝트 설명 및 실행 가이드
```

---

## 의존성 요약

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x"
  },
  "devDependencies": {
    "@sveltejs/kit": "^2.x",
    "svelte": "^5.x",
    "tailwindcss": "^4.x",
    "@tailwindcss/vite": "^4.x",
    "typescript": "^5.x",
    "vite": "^6.x"
  }
}
```

---

## Supabase 대시보드 설정 사항

1. **Authentication > Providers**: GitHub 또는 Google OAuth 앱 등록 (Client ID, Secret 입력)
2. **Authentication > URL Configuration**:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/auth/callback`

---

## README.md 구성 계획

### 섹션 구조

```
# Supabase Token Viewer
  └─ 한 줄 소개 문장

## Overview
  └─ 이 도구가 무엇인지, 왜 만들었는지 (2~3문장)
  └─ 개발/학습용 도구임을 명시 (운영 환경 토큰 노출 주의)

## Features
  └─ 기능 목록 (bullet)
     · OAuth 2 (PKCE) 로그인 — GitHub / Google
     · OAuth code → Supabase 세션 교환
     · AccessToken 원문 표시 + 클립보드 복사
     · JWT Payload 디코딩 (Base64url → JSON)
     · 토큰 만료 카운트다운 (실시간)
     · 자동 갱신 모니터링 (TOKEN_REFRESHED 이벤트)

## Tech Stack
  └─ 표 형식
     | 역할 | 기술 |
     | 프레임워크 | SvelteKit + TypeScript |
     | Auth | @supabase/supabase-js v2 (PKCE) |
     | 스타일 | Tailwind CSS v4 |

## Getting Started

### Prerequisites
  └─ Node.js 버전 요구사항
  └─ Supabase 프로젝트 생성 방법 링크
  └─ OAuth Provider 앱 등록 안내
     · GitHub: Settings > Developer settings > OAuth Apps
     · Callback URL: http://localhost:5173/auth/callback

### Installation
  └─ git clone → yarn install 순서로 명령어 블록

### Environment Variables
  └─ .env.example 복사 안내
  └─ 각 변수 설명:
     · PUBLIC_SUPABASE_URL   — 프로젝트 URL
     · PUBLIC_SUPABASE_ANON_KEY — anon/public 키

### Supabase Dashboard Setup
  └─ Authentication > Providers에서 OAuth 앱 활성화
  └─ Authentication > URL Configuration
     · Site URL: http://localhost:5173
     · Redirect URLs: http://localhost:5173/auth/callback

### Run
  └─ yarn dev 명령어 + 접속 URL

## How It Works
  └─ OAuth 흐름을 단계별 텍스트로 설명 (다이어그램 대신 번호 목록)
     1. 로그인 버튼 클릭 → signInWithOAuth (PKCE code_challenge 생성)
     2. Provider 인증 완료 → /auth/callback?code=xxx 로 리디렉트
     3. 서버에서 exchangeCodeForSession(code) 호출 → 세션 저장
     4. 대시보드에서 getSession() → access_token 추출
     5. atob()으로 JWT payload 디코딩 → 화면 표시
     6. SDK가 만료 60초 전 자동 갱신 → onAuthStateChange로 감지

## Security Notice
  └─ 주의 문구: 이 앱은 학습/디버깅 용도이며, AccessToken을 화면에 노출함
  └─ 운영 환경에서는 절대 사용하지 말 것
```

### 작성 지침
- 코드 블록은 bash / typescript / env 언어 지정
- 링크: Supabase 공식 문서, OAuth Provider 등록 페이지
- 영어로 작성 (국제 공개 저장소 대응)

---

---

## Svelte 5 상태 관리 최적화 (Runes)

최근 Svelte 5에서 발생한 `state_referenced_locally` 경고를 해결하고, 상태 관리를 더 선언적으로 개선합니다.

### 주요 개선 사항

1.  **`$derived` 활용**: 다른 상태에 의존하는 값(`decodedPayload`, `isExpired`, `remainingTime`)을 `$state` 대신 `$derived`로 변경하여 자동 동기화를 보장합니다.
2.  **반응형 시간(`now`) 도입**: `$state(Date.now())`를 1초마다 업데이트하고, 이를 기반으로 `remainingTime`을 계산하여 타이머 로직을 단순화합니다.
3.  **Prop 동기화**: `data` prop이 변경될 때(예: 서버 사이드 갱신) 로컬 `$state`들이 함께 업데이트되도록 `$effect`를 사용하거나 구조를 재검토합니다.

### 수정 계획

**`src/routes/dashboard/+page.svelte`**

```typescript
// 기존: 
// let decodedPayload = $state(decodeJwt(accessToken));
// let remainingTime = $state(formatRemainingTime(expiresAt));

// 개선:
let now = $state(Date.now());
let decodedPayload = $derived(decodeJwt(accessToken));
let isExpired = $derived(expiresAt.getTime() <= now);
let remainingTime = $derived(formatRemainingTime(expiresAt, new Date(now)));

onMount(() => {
    const timer = setInterval(() => {
        now = Date.now();
    }, 1000);
    // ...
});
```

이 변경을 통해 `accessToken`이 변경되면 `decodedPayload`가 자동으로 재계산되고, `now`가 변경되면 `remainingTime`이 자동으로 업데이트됩니다.
