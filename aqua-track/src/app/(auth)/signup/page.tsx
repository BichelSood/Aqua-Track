import { redirect } from "next/navigation";
import { AUTH_SIGNUP_PATH } from "@/lib/auth/routes";

export default function LegacySignupPage() {
  redirect(AUTH_SIGNUP_PATH);
}
