import type { Session } from '@supabase/supabase-js';

/** JWT의 표준 + Supabase 전용 클레임 */
export interface JwtPayload {
	/** Subject (user UUID) */
	sub: string;
	/** Email */
	email?: string;
	/** Phone */
	phone?: string;
	/** Issued At (unix timestamp) */
	iat: number;
	/** Expiration (unix timestamp) */
	exp: number;
	/** Audience */
	aud: string;
	/** Supabase role */
	role: string;
	/** AMR (Authentication Methods References) */
	amr?: Array<{ method: string; timestamp: number }>;
	/** App metadata */
	app_metadata?: Record<string, string | boolean | string[]>;
	/** User metadata */
	user_metadata?: Record<string, string | boolean | number>;
	/** Session ID */
	session_id?: string;
	/** Is Anonymous */
	is_anonymous?: boolean;
}

/** 대시보드에서 사용하는 토큰 뷰 상태 */
export interface TokenViewState {
	session: Session;
	accessToken: string;
	refreshToken: string;
	decodedPayload: JwtPayload;
	expiresAt: Date;
	lastRefreshed: Date | null;
}
