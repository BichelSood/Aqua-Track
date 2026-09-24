import { redirect } from "next/navigation";
import { AUTH_LOGIN_PATH } from "@/lib/auth/routes";

export default function LegacyLoginPage() {
  redirect(AUTH_LOGIN_PATH);
}
