const ARTICLES = new Set(['a', 'an', 'the', 'one', 'my']);

/**
 * Turns an action into the thing being counted, for "How many …?".
 *   "Attempt a full-length mock test" → "full-length mock tests"
 *   "Publish 1 video"                  → "videos"
 * Falls back to "times" when there is nothing sensible to count.
 */
export function countableNoun(action: string): string {
  const words = action
    .trim()
    .replace(/[.!?]+$/, '')
    .split(/\s+/)
    .filter(Boolean);

  // Drop the leading verb, then any articles or numbers.
  const rest = words.slice(1);
  while (
    rest.length &&
    (ARTICLES.has(rest[0].toLowerCase()) || /^\d+$/.test(rest[0]))
  ) {
    rest.shift();
  }
  if (rest.length === 0) {
    return 'times';
  }

  const last = rest[rest.length - 1];
  rest[rest.length - 1] = pluralize(last);
  return rest.join(' ').toLowerCase();
}

function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }
  if (/(s|x|z|ch|sh)$/i.test(word)) {
    return `${word}es`;
  }
  return `${word}s`;
}
