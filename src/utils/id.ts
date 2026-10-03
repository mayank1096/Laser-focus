let counter = 0;

/** Client-side unique id. Good enough until the backend issues real ids. */
export function createId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}
