import { countGraphemes, isValidCategoryIcon } from '@/utils/emoji';

describe('countGraphemes', () => {
  it('counts a ZWJ family emoji as one', () => {
    expect(countGraphemes('👨‍👩‍👧')).toBe(1);
  });

  it('counts plain characters', () => {
    expect(countGraphemes('abc')).toBe(3);
  });
});

describe('isValidCategoryIcon', () => {
  it('accepts a single emoji', () => {
    expect(isValidCategoryIcon('🍔')).toBe(true);
    expect(isValidCategoryIcon(' 👍🏽 ')).toBe(true);
  });

  it('rejects empty or long values', () => {
    expect(isValidCategoryIcon('   ')).toBe(false);
    expect(isValidCategoryIcon('🍔🍕🍟')).toBe(false);
  });
});
