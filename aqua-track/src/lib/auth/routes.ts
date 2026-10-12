import type { UserRole } from "@/types";

export const AUTH_LOGIN_PATH = "/auth/login";
export const AUTH_SIGNUP_PATH = "/auth/signup";
export const AUTH_FORGOT_PASSWORD_PATH = "/auth/forgot-password";
export const AUTH_UPDATE_PASSWORD_PATH = "/auth/update-password";
export const AUTH_CALLBACK_PATH = "/auth/callback";

export const PUBLIC_PATHS = [
  
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  AUTH_FORGOT_PASSWORD_PATH,
  AUTH_CALLBACK_PATH,
  "/",
  "/login",
  "/signup",
  "/api/health/supabase",
] as const;

export const AUTH_ENTRY_PATHS = [
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  AUTH_FORGOT_PASSWORD_PATH,
  "/login",
  "/signup",
] as const;

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case "STUDENT":
      return "/dashboard";
    case "DELIVERY_BOY":
      return "/delivery/dashboard";
    case "WASHING_STAFF":
      return "/washing/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return AUTH_LOGIN_PATH;
  }
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAuthEntryPath(pathname: string): boolean {
  return AUTH_ENTRY_PATHS.some((path) => pathname === path);
}

export function roleForPath(pathname: string): UserRole | null {
  if (
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/laundry" ||
    pathname.startsWith("/laundry/") ||
    pathname === "/history" ||
    pathname.startsWith("/history/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/") ||
    pathname === "/complaints" ||
    pathname.startsWith("/complaints/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/")
  ) {
    return "STUDENT";
  }

  if (pathname === "/delivery" || pathname.startsWith("/delivery/")) {
    return "DELIVERY_BOY";
  }

  if (pathname === "/washing" || pathname.startsWith("/washing/")) {
    return "WASHING_STAFF";
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "ADMIN";
  }

  return null;
}
