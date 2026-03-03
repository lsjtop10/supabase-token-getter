import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = createSupabaseServerClient(cookies);
	const {
		data: { session },
		error
	} = await supabase.auth.getSession();

	if (error || !session) {
		redirect(303, '/');
	}

	// 세션 데이터는 직렬화 가능한 형태로 클라이언트에 전달
	return {
		accessToken: session.access_token,
		refreshToken: session.refresh_token,
		expiresAt: session.expires_at ?? null
	};
};
