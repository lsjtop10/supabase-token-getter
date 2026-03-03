<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { decodeJwt, unixToDate, formatRemainingTime } from '$lib/jwt';
	import type { JwtPayload } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// 토큰 상태
	let accessToken = $state(data.accessToken);
	let refreshToken = $state(data.refreshToken);
	let expiresAt = $state<Date>(
		data.expiresAt ? unixToDate(data.expiresAt) : new Date(Date.now() + 3600 * 1000)
	);
	let decodedPayload = $state<JwtPayload>(decodeJwt(accessToken));

	// UI 상태
	let lastRefreshed = $state<Date | null>(null);
	let remainingTime = $state(formatRemainingTime(expiresAt));
	let copyStatus = $state<'idle' | 'copied'>('idle');
	let copyRefreshStatus = $state<'idle' | 'copied'>('idle');
	let showRawToken = $state(false);
	let signOutLoading = $state(false);

	async function copyToClipboard(text: string, type: 'access' | 'refresh') {
		await navigator.clipboard.writeText(text);
		if (type === 'access') {
			copyStatus = 'copied';
			setTimeout(() => (copyStatus = 'idle'), 2000);
		} else {
			copyRefreshStatus = 'copied';
			setTimeout(() => (copyRefreshStatus = 'idle'), 2000);
		}
	}

	async function signOut() {
		signOutLoading = true;
		await supabase.auth.signOut();
		goto('/');
	}

	onMount(() => {
		// 남은 시간 실시간 업데이트
		const timer = setInterval(() => {
			remainingTime = formatRemainingTime(expiresAt);
		}, 1000);

		// 토큰 갱신 이벤트 감지
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'TOKEN_REFRESHED' && session) {
				accessToken = session.access_token;
				refreshToken = session.refresh_token ?? refreshToken;
				expiresAt = session.expires_at
					? unixToDate(session.expires_at)
					: new Date(Date.now() + 3600 * 1000);
				decodedPayload = decodeJwt(accessToken);
				lastRefreshed = new Date();
			}
			if (event === 'SIGNED_OUT') {
				goto('/');
			}
		});

		return () => {
			clearInterval(timer);
			subscription.unsubscribe();
		};
	});

	/** JSON을 syntax highlighting을 위한 HTML로 변환 */
	function formatJson(obj: JwtPayload): string {
		return JSON.stringify(obj, null, 2)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(
				/("(\\u[\dA-Fa-f]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[Ee][+-]?\d+)?)/g,
				(match) => {
					let cls = 'text-cyan-300'; // number
					if (/^"/.test(match)) {
						cls = /:$/.test(match) ? 'text-purple-300' : 'text-emerald-300'; // key vs string
					} else if (/true|false/.test(match)) {
						cls = 'text-yellow-300';
					} else if (/null/.test(match)) {
						cls = 'text-red-400';
					}
					return `<span class="${cls}">${match}</span>`;
				}
			);
	}

	/** AccessToken 앞 30자 + ... 로 축약 */
	function truncateToken(token: string): string {
		return token.length > 60 ? `${token.slice(0, 60)}...` : token;
	}

	/** unix timestamp를 읽기 쉬운 날짜 문자열로 변환 */
	function formatDate(unix: number): string {
		return new Date(unix * 1000).toLocaleString('ko-KR');
	}

	let isExpired = $derived(expiresAt.getTime() <= Date.now());
</script>

<svelte:head>
	<title>Token Viewer — Dashboard</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<!-- 헤더 -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-white">Token Dashboard</h1>
			<p class="mt-0.5 text-sm text-gray-500">
				{decodedPayload.email ?? decodedPayload.sub}
			</p>
		</div>
		<button
			onclick={signOut}
			disabled={signOutLoading}
			class="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 ring-1 ring-gray-700 transition hover:bg-gray-800 hover:text-white disabled:opacity-50"
		>
			로그아웃
		</button>
	</div>

	<!-- 만료 상태 배너 -->
	<div
		class="mb-6 flex items-center justify-between rounded-xl px-5 py-4 {isExpired
			? 'bg-red-500/10 ring-1 ring-red-500/30'
			: 'bg-emerald-500/10 ring-1 ring-emerald-500/30'}"
	>
		<div class="flex items-center gap-3">
			<div
				class="h-2.5 w-2.5 rounded-full {isExpired
					? 'bg-red-400'
					: 'animate-pulse bg-emerald-400'}"
			></div>
			<span class="text-sm font-medium {isExpired ? 'text-red-300' : 'text-emerald-300'}">
				{isExpired ? '토큰 만료됨' : '유효한 토큰'}
			</span>
		</div>
		<div class="text-right">
			<div class="font-mono text-sm {isExpired ? 'text-red-400' : 'text-white'}">
				{remainingTime}
			</div>
			<div class="mt-0.5 text-xs text-gray-500">
				만료: {formatDate(decodedPayload.exp)}
			</div>
		</div>
	</div>

	<!-- 자동 갱신 상태 -->
	<div class="mb-6 rounded-xl bg-gray-900 px-5 py-4 ring-1 ring-gray-800">
		<div class="flex items-center justify-between">
			<span class="text-sm text-gray-400">자동 갱신 (autoRefreshToken)</span>
			<span class="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
				활성화
			</span>
		</div>
		<div class="mt-2 text-xs text-gray-600">
			{#if lastRefreshed}
				최근 갱신: {lastRefreshed.toLocaleTimeString('ko-KR')}
			{:else}
				만료 60초 전 SDK가 자동으로 갱신합니다
			{/if}
		</div>
	</div>

	<!-- Access Token 카드 -->
	<section class="mb-4 rounded-xl bg-gray-900 ring-1 ring-gray-800">
		<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
			<h2 class="text-sm font-semibold text-gray-200">Access Token (JWT)</h2>
			<div class="flex gap-2">
				<button
					onclick={() => (showRawToken = !showRawToken)}
					class="rounded-md px-3 py-1.5 text-xs text-gray-400 ring-1 ring-gray-700 transition hover:bg-gray-800"
				>
					{showRawToken ? '접기' : '전체 보기'}
				</button>
				<button
					onclick={() => copyToClipboard(accessToken, 'access')}
					class="rounded-md px-3 py-1.5 text-xs transition {copyStatus === 'copied'
						? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
						: 'text-gray-400 ring-1 ring-gray-700 hover:bg-gray-800'}"
				>
					{copyStatus === 'copied' ? '복사됨!' : '복사'}
				</button>
			</div>
		</div>
		<div class="px-5 py-4">
			<pre class="overflow-x-auto break-all font-mono text-xs leading-relaxed text-amber-300 whitespace-pre-wrap">{showRawToken
					? accessToken
					: truncateToken(accessToken)}</pre>
		</div>
	</section>

	<!-- Decoded Payload 카드 -->
	<section class="mb-4 rounded-xl bg-gray-900 ring-1 ring-gray-800">
		<div class="border-b border-gray-800 px-5 py-4">
			<h2 class="text-sm font-semibold text-gray-200">Decoded Payload</h2>
			<p class="mt-0.5 text-xs text-gray-500">JWT payload를 Base64url 디코딩한 결과 (서명 미검증)</p>
		</div>
		<div class="px-5 py-4">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<pre class="overflow-x-auto font-mono text-xs leading-relaxed">{@html formatJson(decodedPayload)}</pre>
		</div>
	</section>

	<!-- Refresh Token 카드 -->
	<section class="rounded-xl bg-gray-900 ring-1 ring-gray-800">
		<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
			<div>
				<h2 class="text-sm font-semibold text-gray-200">Refresh Token</h2>
				<p class="mt-0.5 text-xs text-gray-500">세션 갱신에 사용되는 불투명(opaque) 토큰</p>
			</div>
			<button
				onclick={() => copyToClipboard(refreshToken, 'refresh')}
				class="rounded-md px-3 py-1.5 text-xs transition {copyRefreshStatus === 'copied'
					? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
					: 'text-gray-400 ring-1 ring-gray-700 hover:bg-gray-800'}"
			>
				{copyRefreshStatus === 'copied' ? '복사됨!' : '복사'}
			</button>
		</div>
		<div class="px-5 py-4">
			<pre class="overflow-x-auto break-all font-mono text-xs leading-relaxed text-sky-300 whitespace-pre-wrap">{refreshToken}</pre>
		</div>
	</section>
</div>
