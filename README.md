# Supabase Token Viewer

A developer tool to inspect Supabase JWT access tokens obtained via OAuth 2 (PKCE flow).

## Overview

This app walks through the full Supabase OAuth 2 authentication cycle and lets you visually inspect every part of the resulting session:

- Initiates an OAuth 2 PKCE flow with GitHub or Google
- Exchanges the authorization code for a Supabase session on the server
- Displays the raw Access Token (JWT) with a one-click copy button
- Decodes the JWT payload (Base64url) and renders it as syntax-highlighted JSON
- Shows a live countdown to token expiry
- Monitors automatic token refresh events via `onAuthStateChange`

> **For development and learning purposes only.** Never expose Access Tokens in a production UI.

## Features

- OAuth 2 (PKCE) login — GitHub / Google
- Server-side `exchangeCodeForSession` (secure code exchange)
- Access Token raw display + clipboard copy
- JWT Payload decoding (no external library — pure `atob`)
- Live expiry countdown (updated every second)
- Auto-refresh monitoring (`TOKEN_REFRESHED` event)
- Refresh Token display + clipboard copy

## Tech Stack

| Role | Technology |
|------|-----------|
| Framework | SvelteKit + TypeScript |
| Auth | @supabase/supabase-js v2 (PKCE flow) |
| SSR Auth | @supabase/ssr (cookie-based session sync) |
| Styling | Tailwind CSS v4 |
| Package Manager | yarn |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A GitHub OAuth App **or** a Google OAuth Client configured in your Supabase project

#### Supabase Dashboard Setup

1. Go to **Authentication → Providers** and enable GitHub or Google.
2. Enter your OAuth app's **Client ID** and **Client Secret**.
3. Go to **Authentication → URL Configuration** and add:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: `http://localhost:5173/auth/callback`

### Installation

```bash
git clone <repo-url>
cd supabase-token-getter
yarn install
```

### Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your project values:

```env
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

| Variable | Where to find it |
|----------|-----------------|
| `PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon/public key |

### Run

```bash
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How It Works

```
1. User clicks "Sign in with GitHub/Google"
        │
        ▼
2. supabase.auth.signInWithOAuth() generates a PKCE code_challenge
   and redirects the browser to the OAuth provider.
        │
        ▼
3. User approves the OAuth consent screen.
   Provider redirects back to /auth/callback?code=xxx
        │
        ▼
4. Server load function calls exchangeCodeForSession(code).
   Supabase verifies the code + code_verifier and issues a session.
   Session is stored in an HTTP-only cookie.
        │
        ▼
5. Browser is redirected to /dashboard.
   Server reads the session from the cookie and passes
   access_token / refresh_token to the page.
        │
        ▼
6. JWT payload is decoded with atob() — no library needed.
   { sub, email, role, exp, iat, ... } is rendered as JSON.
        │
        ▼
7. SDK's autoRefreshToken renews the token ~60s before expiry.
   onAuthStateChange fires TOKEN_REFRESHED → UI updates live.
```

## Security Notice

> ⚠️ This application displays JWT Access Tokens in plaintext in the browser.
> Access Tokens grant authenticated API access and must be treated as secrets.
> **Do not use this tool in a production environment or with sensitive accounts.**
