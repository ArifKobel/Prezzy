import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FieldGroup } from "@/components/settings/field-group";
import { useChangePassword } from "@/lib/api/auth";

export function PasswordForm() {
  const changePassword = useChangePassword();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success("Password updated");
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setOpen(false);
    } catch {
      toast.error("Failed to update password. Check your current password.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-sm font-medium text-foreground">Password</p>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">Change your account password</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg px-4 py-2 font-sans text-xs font-medium text-primary transition-colors hover:bg-primary/8"
        >
          Change Password
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup label="Current Password" icon={<KeyRound className="size-3.5" />}>
        <input
          type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
          className="w-full border-0 border-b border-outline-variant/20 bg-transparent px-0 py-1.5 font-sans text-sm text-foreground outline-none transition-colors focus:border-primary"
          autoFocus
        />
      </FieldGroup>
      <FieldGroup label="New Password" icon={<KeyRound className="size-3.5" />}>
        <input
          type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
          className="w-full border-0 border-b border-outline-variant/20 bg-transparent px-0 py-1.5 font-sans text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
      </FieldGroup>
      <FieldGroup label="Confirm New Password" icon={<KeyRound className="size-3.5" />}>
        <input
          type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
          className="w-full border-0 border-b border-outline-variant/20 bg-transparent px-0 py-1.5 font-sans text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
      </FieldGroup>
      <div className="flex items-center gap-2">
        <button
          type="submit" disabled={saving || !currentPw || !newPw || !confirmPw}
          className="rounded-md bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dim))] px-5 py-2 font-sans text-xs font-medium text-primary-foreground shadow-[0_4px_12px_rgba(78,96,115,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {saving ? "Updating…" : "Update Password"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
          className="rounded-md px-4 py-2 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
