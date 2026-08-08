export const mergeDefined = <T extends object>(base: T | null, patch: Partial<T> | undefined): T => {
  const merged: Record<string, unknown> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value !== undefined) merged[key] = value;
  }
  return merged as T;
};
