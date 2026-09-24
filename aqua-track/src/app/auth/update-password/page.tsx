import { UpdatePasswordForm } from "./update-password-form";

export default function UpdatePasswordPage() {
  return (
    <>
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">Aqua Track</p>
        <h1 className="text-3xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>
      <UpdatePasswordForm />
    </>
  );
}
