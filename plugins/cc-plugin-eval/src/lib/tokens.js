// Ported from openai/plugins plugin-eval (MIT). See ../../THIRD_PARTY_NOTICES.md.

export function estimateTokenCount(text) {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

export function sumTokenCounts(items) {
  return items.reduce((total, item) => {
    const value = Number(item?.tokens);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}
