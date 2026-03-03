# Supabase Token Viewer

Supabase OAuth 2 (PKCE flow)를 통해 획득한 Supabase JWT 액세스 토큰을 검사하기 위한 개발자 도구입니다.

## 개요

이 앱은 전체 Supabase OAuth 2 인증 사이클을 거치며 결과 세션의 모든 부분을 시각적으로 검사할 수 있게 해줍니다:

- GitHub 또는 Google을 통한 OAuth 2 PKCE 플로우 시작
- 서버에서 인증 코드를 Supabase 세션으로 교환
- 원클릭 복사 버튼이 포함된 원본 액세스 토큰(JWT) 표시
- JWT 페이로드(Base64url) 디코딩 및 구문 강조된 JSON으로 렌더링
- 토큰 만료까지의 실시간 카운트다운 표시
- `onAuthStateChange`를 통한 자동 토큰 갱신 이벤트 모니터링

> **개발 및 학습 목적으로만 사용하세요.** 프로덕션 UI에서 액세스 토큰을 노출하지 마십시오.

## 주요 기능

- OAuth 2 (PKCE) 로그인 — GitHub / Google
- 서버 측 `exchangeCodeForSession` (보안 코드 교환)
- 액세스 토큰 원본 표시 + 클립보드 복사
- JWT 페이로드 디코딩 (외부 라이브러리 없이 순수 `atob` 사용)
- 실시간 만료 카운트다운 (1초마다 업데이트)
- 자동 갱신 모니터링 (`TOKEN_REFRESHED` 이벤트)
- 리프레시 토큰 표시 + 클립보드 복사

## 기술 스택

| 역할 | 기술 |
|------|-----------|
| 프레임워크 | SvelteKit + TypeScript |
| 인증 | @supabase/supabase-js v2 (PKCE 플로우) |
| SSR 인증 | @supabase/ssr (쿠키 기반 세션 동기화) |
| 스타일링 | Tailwind CSS v4 |
| 패키지 관리자 | yarn |

## 라이브러리 설정 (Library Setup)

이 프로젝트는 Supabase의 최신 인증 방식인 **PKCE Flow**를 사용합니다.

### 1. 클라이언트 측 설정 (`src/lib/supabaseClient.ts`)
클라이언트 브라우저에서 사용할 Supabase 인스턴스를 설정합니다.
- `flowType: 'pkce'`: 보안이 강화된 PKCE 인증 방식을 사용합니다.
- `autoRefreshToken: true`: 토큰 만료 전 자동으로 갱신하도록 설정합니다.
- `detectSessionInUrl: false`: PKCE 방식에서는 서버의 콜백 라우트에서 코드를 처리하므로 클라이언트의 자동 감지는 끕니다.

### 2. 서버 측 설정 (`src/lib/server/supabase.ts`)
SvelteKit 서버(SSR)에서 세션을 관리하기 위해 `@supabase/ssr`을 사용합니다.
- `cookies`: 쿠키를 통해 브라우저와 서버 간의 세션 정보를 동기화합니다.

## 시작하기 (Getting Started)

### 사전 요구 사항

- Node.js 20+
- [Supabase](https://supabase.com) 프로젝트
- Supabase 프로젝트에 설정된 GitHub OAuth 앱 **또는** Google OAuth 클라이언트

#### Supabase 대시보드 설정

1. **Authentication → Providers**로 이동하여 GitHub 또는 Google을 활성화합니다.
2. OAuth 앱의 **Client ID**와 **Client Secret**을 입력합니다.
3. **Authentication → URL Configuration**으로 이동하여 다음을 추가합니다:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: `http://localhost:5173/auth/callback`

### 설치 및 실행 방법

```bash
# 1. 저장소 복제
git clone <repo-url>
cd supabase-token-getter

# 2. 의존성 라이브러리 설치
yarn install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 자신의 Supabase URL과 Anon Key를 입력하세요.

# 4. 개발 서버 실행
yarn dev
```

### 환경 변수 (.env)

```env
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

| 변수 | 확인 위치 |
|----------|-----------------|
| `PUBLIC_SUPABASE_URL` | Supabase 대시보드 → Project Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase 대시보드 → Project Settings → API → anon/public key |

## 작동 원리

```
1. 사용자가 "GitHub/Google로 로그인" 클릭
        │
        ▼
2. supabase.auth.signInWithOAuth()가 PKCE code_challenge를 생성하고
   브라우저를 OAuth 제공업체로 리디렉션합니다.
        │
        ▼
3. 사용자가 OAuth 동의 화면을 승인합니다.
   제공업체는 /auth/callback?code=xxx로 리디렉션합니다.
        │
        ▼
4. 서버 load 함수가 exchangeCodeForSession(code)를 호출합니다.
   Supabase는 code + code_verifier를 확인하고 세션을 발행합니다.
   세션은 HTTP-only 쿠키에 저장됩니다.
        │
        ▼
5. 브라우저가 /dashboard로 리디렉션됩니다.
   서버는 쿠키에서 세션을 읽고 access_token / refresh_token을
   페이지로 전달합니다.
        │
        ▼
6. 라이브러리 없이 atob()로 JWT 페이로드를 디코딩합니다.
   { sub, email, role, exp, iat, ... }가 JSON으로 렌더링됩니다.
        │
        ▼
7. SDK의 autoRefreshToken이 만료 약 60초 전에 토큰을 갱신합니다.
   onAuthStateChange가 TOKEN_REFRESHED를 발생시키고 UI가 실시간으로 업데이트됩니다.
```

## 보안 공지

> ⚠️ 이 애플리케이션은 JWT 액세스 토큰을 브라우저에 평문으로 표시합니다.
> 액세스 토큰은 인증된 API 액세스 권한을 부여하며 비밀로 취급되어야 합니다.
> **이 도구를 프로덕션 환경이나 민감한 계정에서 사용하지 마십시오.**
