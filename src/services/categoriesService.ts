import { Category } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId, today } from '../utils/formatters';

export const categoriesService = {
  getAll(): Category[] {
    return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  },

  add(name: string): Category {
    const categories = this.getAll();
    const category: Category = { id: generateId(), name, createdAt: today() };
    setItem(STORAGE_KEYS.CATEGORIES, [...categories, category]);
    return category;
  },

  delete(id: string): boolean {
    const categories = this.getAll();
    setItem(STORAGE_KEYS.CATEGORIES, categories.filter(c => c.id !== id));
    return true;
  },

  getById(id: string): Category | undefined {
    return this.getAll().find(c => c.id === id);
  },
};
