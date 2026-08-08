export type Patch<T> = { [K in keyof T]?: T[K] | null };

export const mergePatch = <T extends object>(base: T | null, patch: Patch<T> | undefined): T => {
  const merged: Record<string, unknown> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value === undefined) continue;
    if (value === null) delete merged[key];
    else merged[key] = value;
  }
  return merged as T;
};
