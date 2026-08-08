import { useMe } from "@/lib/api/auth";

export function AuthGuard({
  authenticated,
  unauthenticated,
  loading,
}: {
  authenticated: React.ReactNode;
  unauthenticated: React.ReactNode;
  loading: React.ReactNode;
}) {
  const { data: user } = useMe();

  if (user === undefined) {
    return <>{loading}</>;
  }

  return user === null ? <>{unauthenticated}</> : <>{authenticated}</>;
}
