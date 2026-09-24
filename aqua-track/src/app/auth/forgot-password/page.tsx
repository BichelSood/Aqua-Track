import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">Aqua Track</p>
        <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we will send a reset link if an account exists.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
