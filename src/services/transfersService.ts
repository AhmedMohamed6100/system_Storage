import { Transfer } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId } from '../utils/formatters';

export const transfersService = {
  getAll(): Transfer[] {
    return getItem<Transfer[]>(STORAGE_KEYS.TRANSFERS, []);
  },

  add(data: Omit<Transfer, 'id' | 'createdAt'>): Transfer {
    const transfers = this.getAll();
    const transfer: Transfer = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setItem(STORAGE_KEYS.TRANSFERS, [...transfers, transfer]);
    return transfer;
  },

  delete(id: string): boolean {
    const transfers = this.getAll();
    setItem(STORAGE_KEYS.TRANSFERS, transfers.filter(t => t.id !== id));
    return true;
  },

  getTotalReceived(): number {
    return this.getAll().filter(t => t.type === 'receive').reduce((sum, t) => sum + t.amount, 0);
  },

  getTotalSent(): number {
    return this.getAll().filter(t => t.type === 'send').reduce((sum, t) => sum + t.amount, 0);
  },

  getNetCash(): number {
    return this.getTotalReceived() - this.getTotalSent();
  },
};
