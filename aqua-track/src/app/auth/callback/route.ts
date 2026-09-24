import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AUTH_LOGIN_PATH, AUTH_UPDATE_PASSWORD_PATH } from "@/lib/auth/routes";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? AUTH_UPDATE_PASSWORD_PATH;

  if (!code) {
    return NextResponse.redirect(`${origin}${AUTH_LOGIN_PATH}?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${AUTH_LOGIN_PATH}?error=auth`);
  }

  const safeNext =
    next.startsWith("/") && !next.startsWith("//")
      ? next
      : AUTH_UPDATE_PASSWORD_PATH;

  return NextResponse.redirect(`${origin}${safeNext}`);
}
