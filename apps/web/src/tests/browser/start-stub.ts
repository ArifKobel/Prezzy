type AnyFn = (...args: unknown[]) => unknown;

export function createIsomorphicFn() {
  let clientImpl: AnyFn = () => undefined;
  const fn = ((...args: unknown[]) => clientImpl(...args)) as AnyFn & {
    client: (impl: AnyFn) => typeof fn;
    server: (impl: AnyFn) => typeof fn;
  };
  fn.client = (impl) => { clientImpl = impl; return fn; };
  fn.server = () => fn;
  return fn;
}
