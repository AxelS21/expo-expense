/**
 * Approximate user-visible character count. Uses Intl.Segmenter when the runtime has it;
 * otherwise counts code points while folding ZWJ sequences, variation selectors and skin tones.
 */
export function countGraphemes(value: string): number {
  const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Segmenter) {
    return Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length;
  }
  let count = 0;
  let joinNext = false;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isModifier =
      code === 0xfe0f || code === 0xfe0e || (code >= 0x1f3fb && code <= 0x1f3ff) || code === 0x20e3;
    if (code === 0x200d) {
      joinNext = true;
      continue;
    }
    if (!isModifier && !joinNext) count += 1;
    joinNext = false;
  }
  return count;
}

/** Category icon rule: one emoji, allowing at most 2 visible characters for flags or combos. */
export function isValidCategoryIcon(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && countGraphemes(trimmed) <= 2;
}
