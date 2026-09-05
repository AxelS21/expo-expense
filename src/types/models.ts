import type { Amount } from '@/utils/money';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: Amount;
  categoryId: string;
  note: string | null;
  expenseDate: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
