import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  AUTH_LOGIN_PATH,
  getRoleHomePath,
  isAuthEntryPath,
  isPublicPath,
  roleForPath,
} from "@/lib/auth/routes";
import type { UserRole } from "@/types";

function redirectWithCookies(url: URL, source: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const publicPath = isPublicPath(pathname);
  const isApiPath = pathname.startsWith("/api/");

  if (!user && !publicPath && !isApiPath) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_LOGIN_PATH;
    url.search = "";
    return redirectWithCookies(url, response);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();

    if (isApiPath) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = AUTH_LOGIN_PATH;
    url.search = "error=inactive";
    return redirectWithCookies(url, response);
  }

  if (isApiPath) {
    return response;
  }

  const role = profile.role as UserRole;
  const homePath = getRoleHomePath(role);

  if (isAuthEntryPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = homePath;
    url.search = "";
    return redirectWithCookies(url, response);
  }

  const requiredRole = roleForPath(pathname);

  if (requiredRole && requiredRole !== role) {
    const url = request.nextUrl.clone();
    url.pathname = homePath;
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}
