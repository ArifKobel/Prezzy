import { Input } from "@Prezzy/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { useSignup } from "@/lib/api/auth";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate({ from: "/" });
  const signup = useSignup();

  const form = useForm({
    defaultValues: { email: "", password: "", name: "" },
    onSubmit: async ({ value }) => {
      try {
        await signup({ email: value.email, password: value.password, name: value.name });
        navigate({ to: "/dashboard" });
        toast.success("Account created");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sign up failed");
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Create account</h1>
      <p className="mt-1.5 font-sans text-sm text-muted-foreground">Start building beautiful presentations</p>

      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
        className="mt-8 space-y-5"
      >
        <form.Field name="name">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor={field.name} className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Name</label>
              <Input
                id={field.name} name={field.name}
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

        <form.Field name="email">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor={field.name} className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Email</label>
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
              <label htmlFor={field.name} className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Password</label>
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
              className="w-full rounded-md bg-primary hover:bg-primary-dim px-4 py-2.5 font-sans text-sm font-medium text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
            >
              {isSubmitting ? "Creating account…" : "Sign Up"}
            </button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center font-sans text-sm text-muted-foreground">
        Already have an account?{" "}
        <button onClick={onSwitchToSignIn} className="font-medium text-primary hover:underline">Sign in</button>
      </p>
    </div>
  );
}
