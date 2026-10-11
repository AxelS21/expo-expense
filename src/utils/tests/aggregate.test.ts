import { rankCategoryTotals, sumAmounts } from '@/utils/aggregate';

describe('rankCategoryTotals', () => {
  it('ordena desc, descarta ceros y limita', () => {
    const result = rankCategoryTotals(
      [
        { categoryId: 'a', total: 100 },
        { categoryId: 'b', total: 400 },
        { categoryId: 'c', total: 0 },
        { categoryId: 'd', total: 200 },
      ],
      2
    );
    expect(result.map((r) => r.categoryId)).toEqual(['b', 'd']);
    expect(result[0]?.ratio).toBe(1);
    expect(result[1]?.ratio).toBe(0.5);
  });

  it('devuelve vacio sin gastos', () => {
    expect(rankCategoryTotals([], 4)).toEqual([]);
  });
});

describe('sumAmounts', () => {
  it('suma montos', () => {
    expect(sumAmounts([{ amount: 10 }, { amount: 5.5 }])).toBe(15.5);
  });
});
