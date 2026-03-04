import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const {
		data: { session },
		error
	} = await supabase.auth.getSession();

	if (error || !session) {
		redirect(303, '/');
	}

	return {
		accessToken: session.access_token,
		refreshToken: session.refresh_token,
		expiresAt: session.expires_at ?? null
	};
};
