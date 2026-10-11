export interface CategoryTotal {
  categoryId: string;
  total: number;
}

export interface RankedCategoryTotal extends CategoryTotal {
  /** Share of the largest total in the list, from 0 to 1. Drives the proportion bar width. */
  ratio: number;
}

/** Sorts category totals descending, drops non-positive ones and keeps the first `limit`. */
export function rankCategoryTotals(totals: CategoryTotal[], limit: number): RankedCategoryTotal[] {
  const ranked = totals
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  const max = ranked[0]?.total ?? 0;
  return ranked.map((entry) => ({ ...entry, ratio: max > 0 ? entry.total / max : 0 }));
}

export function sumAmounts<T extends { amount: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}
