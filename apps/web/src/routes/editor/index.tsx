import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/editor/")({
  component: EditorRedirect,
});

function EditorRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to: "/dashboard" }); }, [navigate]);
  return null;
}
