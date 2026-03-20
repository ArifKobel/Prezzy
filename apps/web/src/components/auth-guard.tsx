import { useConvexAuth } from "convex/react";
import { useRef } from "react";

export function AuthGuard({
  authenticated,
  unauthenticated,
  loading,
}: {
  authenticated: React.ReactNode;
  unauthenticated: React.ReactNode;
  loading: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const hasResolved = useRef(false);

  if (!isLoading) {
    hasResolved.current = true;
  }

  if (isLoading && !hasResolved.current) {
    return <>{loading}</>;
  }

  return isAuthenticated ? <>{authenticated}</> : <>{unauthenticated}</>;
}
