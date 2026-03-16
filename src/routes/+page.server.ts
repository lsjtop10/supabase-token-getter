import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	signIn: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const provider = formData.get('provider') as 'github' | 'google';

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return { error: error.message };
		}

		if (data.url) {
			redirect(303, data.url);
		}
	}
};
