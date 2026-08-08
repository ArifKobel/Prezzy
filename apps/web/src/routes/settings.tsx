import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { LogOut, Shield, User } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { SettingsSection } from "@/components/settings/settings-section";
import { useLogout, useMe } from "@/lib/api/auth";

export const Route = createFileRoute("/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <AuthGuard
      authenticated={<SettingsPage />}
      unauthenticated={<RedirectToHome />}
      loading={
        <div className="flex h-full items-center justify-center bg-surface">
          <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      }
    />
  );
}

function RedirectToHome() {
  const navigate = useNavigate();
  navigate({ to: "/" });
  return null;
}

function SettingsPage() {
  const { data: user } = useMe();
  const logout = useLogout();

  if (user === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <DashboardShell activePage="settings">
      <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">Management</p>
      <h1 className="mt-1 font-display text-[2rem] font-bold tracking-tight text-foreground">
        <span className="italic text-primary">Settings</span>
      </h1>

      <div className="mt-10 max-w-2xl space-y-8">
        <SettingsSection icon={<User className="size-4" />} title="Profile">
          <ProfileForm name={user?.name ?? ""} email={user?.email ?? ""} />
        </SettingsSection>

        <SettingsSection icon={<Shield className="size-4" />} title="Security">
          <PasswordForm />
        </SettingsSection>

        <SettingsSection icon={<LogOut className="size-4" />} title="Account">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm font-medium text-foreground">Sign out</p>
              <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">Sign out of your account on this device</p>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-lg px-4 py-2 font-sans text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              Sign Out
            </button>
          </div>
        </SettingsSection>
      </div>
    </DashboardShell>
  );
}
