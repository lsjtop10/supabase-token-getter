<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state<'github' | 'google' | null>(null);
</script>

<svelte:head>
	<title>Supabase Token Viewer</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm">
		<!-- Header -->
		<div class="mb-10 text-center">
			<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
				<svg class="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-white">Supabase Token Viewer</h1>
			<p class="mt-2 text-sm text-gray-400">OAuth 2 로그인 후 AccessToken을 확인합니다</p>
		</div>

		<!-- Login Buttons -->
		<div class="space-y-3">
			<form method="POST" action="?/signIn" use:enhance={() => {
				loading = 'github';
				return async ({ update }) => { await update(); loading = null; };
			}}>
				<input type="hidden" name="provider" value="github" />
				<button
					type="submit"
					disabled={loading !== null}
					class="flex w-full items-center justify-center gap-3 rounded-lg bg-gray-800 px-4 py-3 text-sm font-medium text-white ring-1 ring-gray-700 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading === 'github'}
						<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						<span>연결 중...</span>
					{:else}
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
						</svg>
						<span>GitHub으로 계속</span>
					{/if}
				</button>
			</form>

			<form method="POST" action="?/signIn" use:enhance={() => {
				loading = 'google';
				return async ({ update }) => { await update(); loading = null; };
			}}>
				<input type="hidden" name="provider" value="google" />
				<button
					type="submit"
					disabled={loading !== null}
					class="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-900 ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading === 'google'}
						<svg class="h-4 w-4 animate-spin text-gray-600" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						<span>연결 중...</span>
					{:else}
						<svg class="h-5 w-5" viewBox="0 0 24 24">
							<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
							<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
							<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
							<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
						</svg>
						<span>Google로 계속</span>
					{/if}
				</button>
			</form>
		</div>

		<!-- Error -->
		{#if form?.error}
			<div class="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/30">
				{form.error}
			</div>
		{/if}

		<!-- Notice -->
		<p class="mt-8 text-center text-xs text-gray-600">
			개발/학습용 도구입니다. 운영 환경에서 사용하지 마세요.
		</p>
	</div>
</main>
