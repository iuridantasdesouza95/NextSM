// Supabase client configuration for NextSM.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Vite exposes VITE_* variables to the client. The NEXT_PUBLIC_* aliases
// keep this project compatible with the environment variables already
// configured in Vercel.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

function createAuthenticatedFetch(apiKey: string): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // With the new sb_publishable_* keys, supabase-js may initially use the
    // public key as the Authorization header. For PostgREST requests, prefer
    // the authenticated user's JWT from the persisted Supabase session.
    const url = typeof input === 'string' ? input : input.url;
    if (typeof window !== 'undefined' && url.includes('/rest/v1/')) {
      try {
        const raw = window.localStorage.getItem(`sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`);
        if (raw) {
          const session = JSON.parse(raw);
          const accessToken = session?.access_token;
          if (typeof accessToken === 'string' && accessToken.split('.').length === 3) {
            headers.set('Authorization', `Bearer ${accessToken}`);
          }
        }
      } catch {
        // Keep the request usable if localStorage contains invalid/stale data.
      }
    }

    headers.set('apikey', apiKey);
    return fetch(input, { ...init, headers });
  };
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: createAuthenticatedFetch(SUPABASE_PUBLISHABLE_KEY),
  },
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
