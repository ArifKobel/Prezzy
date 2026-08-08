import { Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FieldGroup } from "@/components/settings/field-group";
import { useUpdateProfile } from "@/lib/api/auth";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const updateProfile = useUpdateProfile();
  const [draftName, setDraftName] = useState(name);
  const [saving, setSaving] = useState(false);
  const changed = draftName.trim() !== name;

  async function handleSave() {
    if (!changed) return;
    setSaving(true);
    try {
      await updateProfile({ name: draftName.trim() });
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <FieldGroup label="Name" icon={<User className="size-3.5" />}>
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className="w-full border-0 border-b border-outline-variant/20 bg-transparent px-0 py-1.5 font-sans text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
      </FieldGroup>

      <FieldGroup label="Email" icon={<Mail className="size-3.5" />}>
        <p className="py-1.5 font-sans text-sm text-muted-foreground">{email}</p>
      </FieldGroup>

      {changed && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dim))] px-5 py-2 font-sans text-xs font-medium text-primary-foreground shadow-[0_4px_12px_rgb(34_87_74_/_0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            onClick={() => setDraftName(name)}
            className="rounded-md px-4 py-2 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
