import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/dashboard';

	if (!code) {
		redirect(303, '/?error=missing_code');
	}

	const supabase = createSupabaseServerClient(cookies);
	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		const params = new URLSearchParams({ error: error.message });
		redirect(303, `/?${params}`);
	}

	redirect(303, next);
};
