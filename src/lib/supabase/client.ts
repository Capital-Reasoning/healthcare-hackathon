import { createBrowserClient } from '@supabase/ssr';

// TODO: Rename to NEXT_PUBLIC_SUPABASE_URL in .env for client-side access
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
