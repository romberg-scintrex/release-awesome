import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/** 
  * Cookie-aware server client. Use inside server components, server actions, 
  * or routes handlers. This is a thin wrapper around the Supabase client
  * where the logged-in admin's session must be read/refreshed. 
  * It is automatically read from the request cookies 
  * and written back to the response cookies.
  * RLS sees this request as `authenticated` once the admin is signed in.
  */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `setAll` was called from a Server Component — safe to ignore when
          // middleware is refreshing the session on every request.
        }
      },
    },
  });
}