import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next( { request } );

  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  // /admin/login is a permanent-redirect stub to /login. Excluded from the
  // auth gate below so that redirect can actually run instead of the gate
  // bouncing the request first.
  const isLegacyLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

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

  // Unauthenticated into the CMS - send them to sign in, remembering where
  // they were headed, query string included.
  if (isAdmin && !user && !isLegacyLogin) {
    const target = `${pathname}${request.nextUrl.search}`;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", target);
    return NextResponse.redirect(url);
  }

  // Already signed in - nothing to do on the auth pages.
  if ((isAuthRoute || isLegacyLogin) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}