const pending = new Map<string, Promise<unknown>>();

export function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  const cached = pending.get(key);
  if (cached) {
    return cached as Promise<T>;
  }

  const promise = load().then(
    (value) => value,
    (error: unknown) => {
      pending.delete(key);
      throw error;
    },
  );
  pending.set(key, promise);
  return promise;
}
