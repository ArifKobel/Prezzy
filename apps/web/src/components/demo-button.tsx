import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useStartDemo } from "@/lib/api/auth";

export default function DemoButton({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const demo = useStartDemo();

  const start = async () => {
    try {
      const { presentationId } = await demo.mutateAsync();
      navigate({ to: "/editor/$presentationId", params: { presentationId } });
    } catch {
      toast.error("Could not start the demo");
    }
  };

  return (
    <button type="button" onClick={start} disabled={demo.isPending} className={className}>
      {demo.isPending ? "Setting things up…" : children}
    </button>
  );
}
