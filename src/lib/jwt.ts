import type { JwtPayload } from './types';

/**
 * JWT의 payload 부분을 Base64url 디코딩하여 반환합니다.
 * 서명(signature) 검증은 수행하지 않습니다 — 표시 목적 전용.
 */
export function decodeJwt(token: string): JwtPayload {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid JWT format: expected 3 parts separated by "."');
	}

	const payloadB64 = parts[1];
	// Base64url → Base64 변환 후 디코딩
	const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
	const jsonStr = decodeURIComponent(
		atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
	);

	return JSON.parse(jsonStr) as JwtPayload;
}

/** unix timestamp(초)를 Date로 변환 */
export function unixToDate(unix: number): Date {
	return new Date(unix * 1000);
}

/** 남은 시간을 "mm분 ss초" 형식의 문자열로 반환 */
export function formatRemainingTime(expiresAt: Date): string {
	const diffMs = expiresAt.getTime() - Date.now();
	if (diffMs <= 0) return '만료됨';

	const totalSeconds = Math.floor(diffMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}분 ${String(seconds).padStart(2, '0')}초`;
}
