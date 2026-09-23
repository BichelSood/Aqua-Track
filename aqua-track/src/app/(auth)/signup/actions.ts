"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
});

export async function signup(formData: FormData): Promise<void> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    throw new Error("Please provide valid signup details.");
  }

  const { email, password, fullName, phone } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone ?? null,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}