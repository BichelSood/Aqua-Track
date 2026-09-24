import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-highlight uppercase">
          Aqua Track
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to track your laundry.
        </p>
      </div>
      <LoginForm errorCode={error} />
    </>
  );
}
