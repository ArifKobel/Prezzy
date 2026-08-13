import { Input } from "@Prezzy/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import GoogleSignInButton from "@/components/google-sign-in-button";
import { useLogin } from "@/lib/api/auth";

export default function SignInForm({
  onSwitchToSignUp,
  onSuccess,
  hideGoogle = false,
}: {
  onSwitchToSignUp: () => void;
  onSuccess?: () => void;
  hideGoogle?: boolean;
}) {
  const navigate = useNavigate({ from: "/login" });
  const login = useLogin();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      try {
        await login({ email: value.email, password: value.password });
        if (onSuccess) onSuccess();
        else navigate({ to: "/dashboard" });
        toast.success("Welcome back");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sign in failed");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">Welcome back<span className="text-primary">.</span></h1>
      <p className="mt-1.5 font-sans text-sm text-muted-foreground">Sign in to your workspace</p>

      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
        className="mt-8 space-y-5"
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor={field.name} className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">Email</label>
              <Input
                id={field.name} name={field.name} type="email"
                value={field.state.value} onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="border-0 border-b border-outline-variant/20 bg-surface-container-lowest rounded-none px-1 font-sans text-sm focus:border-primary focus:ring-0"
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="font-sans text-xs text-error">{error?.message}</p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor={field.name} className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">Password</label>
              <Input
                id={field.name} name={field.name} type="password"
                value={field.state.value} onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="border-0 border-b border-outline-variant/20 bg-surface-container-lowest rounded-none px-1 font-sans text-sm focus:border-primary focus:ring-0"
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="font-sans text-xs text-error">{error?.message}</p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <button
              type="submit" disabled={!canSubmit || isSubmitting}
              className="w-full bg-primary px-4 py-2.5 font-sans text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-dim disabled:opacity-40"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          )}
        </form.Subscribe>
      </form>

      {hideGoogle ? null : <GoogleSignInButton />}

      <p className="mt-6 text-center font-sans text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button onClick={onSwitchToSignUp} className="font-semibold text-primary hover:underline">Sign up</button>
      </p>
    </div>
  );
}
