import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <>
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-highlight uppercase">
          Aqua Track
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to track laundry from pickup to delivery. New accounts start
          as students.
        </p>
      </div>
      <SignupForm />
    </>
  );
}
