import { Movement } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId } from '../utils/formatters';

export const movementsService = {
  getAll(): Movement[] {
    return getItem<Movement[]>(STORAGE_KEYS.MOVEMENTS, []);
  },

  record(data: Omit<Movement, 'id' | 'createdAt'>): Movement {
    const movements = this.getAll();
    const movement: Movement = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.MOVEMENTS, [movement, ...movements]);
    return movement;
  },

  getByProduct(productId: string): Movement[] {
    return this.getAll().filter(m => m.productId === productId);
  },

  getByType(type: Movement['type']): Movement[] {
    return this.getAll().filter(m => m.type === type);
  },

  getByDateRange(from: string, to: string): Movement[] {
    return this.getAll().filter(m => {
      const d = m.date || m.createdAt.split('T')[0];
      return d >= from && d <= to;
    });
  },
};
