// Helper for cc-plugin-eval (no MIT header — new file).

export function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}
