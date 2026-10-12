"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { fromZodError } from "@/lib/errors";
import {
  AUTH_CALLBACK_PATH,
  AUTH_LOGIN_PATH,
  AUTH_UPDATE_PASSWORD_PATH,
  getRoleHomePath,
} from "@/lib/auth/routes";
import {
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
  updatePasswordSchema,
} from "@/lib/validation/schemas";
import type { UserRole } from "@/types";

export type AuthFormState = {
  success: boolean;
  message: string;
};

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unable to sign in." };
  }

  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    const { data: repairedProfile } = await supabase.rpc(
      "ensure_current_user_profile",
    );

    if (repairedProfile) {
      profile = repairedProfile;
      profileError = null;
    }
  }

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      success: false,
      message: "Unable to load your profile. Try signing in again.",
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      message: "This account is not active. Contact an administrator.",
    };
  }

  redirect(getRoleHomePath(profile.role as UserRole));
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const origin = getPublicAppUrl(await headers());

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: origin
        ? `${origin}${AUTH_CALLBACK_PATH}?next=/`
        : undefined,
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
      },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  if (data.session) {
    redirect("/");
  }

  const usingLocalAuth = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").includes(
    "127.0.0.1",
  );

  return {
    success: true,
    message: usingLocalAuth
      ? "Open http://127.0.0.1:54324 (Mailpit) to confirm your account, then log in. Local Auth does not send real email."
      : "Check your email to confirm your account, then log in.",
  };
}

export async function forgotPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const origin = getPublicAppUrl(await headers());

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}${AUTH_CALLBACK_PATH}?next=${AUTH_UPDATE_PASSWORD_PATH}`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").includes("127.0.0.1")
      ? "If that email is registered, open http://127.0.0.1:54324 (Mailpit) for the reset link."
      : "If that email is registered, a reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  redirect(AUTH_LOGIN_PATH);
}
