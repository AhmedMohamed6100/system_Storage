import { Expense } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId } from '../utils/formatters';

export const expensesService = {
  getAll(): Expense[] {
    return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  },

  add(data: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const expenses = this.getAll();
    const expense: Expense = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setItem(STORAGE_KEYS.EXPENSES, [...expenses, expense]);
    return expense;
  },

  delete(id: string): boolean {
    const expenses = this.getAll();
    setItem(STORAGE_KEYS.EXPENSES, expenses.filter(e => e.id !== id));
    return true;
  },

  getTotal(): number {
    return this.getAll().reduce((sum, e) => sum + e.amount, 0);
  },

  getByDateRange(from: string, to: string): Expense[] {
    return this.getAll().filter(e => e.date >= from && e.date <= to);
  },
};
