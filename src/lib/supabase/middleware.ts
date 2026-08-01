import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next( { request } );

  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname.startsWith("/admin/login");

  if (!isSupabaseConfigured) {
    // not configured, so don't try to update the session
    // let /admin render its "set up Supabase" notice; never
    // touch other routes.
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => 
          request.cookies.set(name, value));
        response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => 
          response.cookies.set(name, value, options));
        }   
      },
  });

  // IMPORTANT: do not run code between createServerClient and getUser().
  const { 
    data: { user }
  } = await supabase.auth.getUser();

  if (isAdmin && !user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}