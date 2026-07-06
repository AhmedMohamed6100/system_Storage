import { Unit } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId, today } from '../utils/formatters';

export const unitsService = {
  getAll(): Unit[] {
    return getItem<Unit[]>(STORAGE_KEYS.UNITS, []);
  },

  add(name: string): Unit {
    const units = this.getAll();
    const unit: Unit = { id: generateId(), name, createdAt: today() };
    setItem(STORAGE_KEYS.UNITS, [...units, unit]);
    return unit;
  },

  delete(id: string): boolean {
    const units = this.getAll();
    setItem(STORAGE_KEYS.UNITS, units.filter(u => u.id !== id));
    return true;
  },

  getById(id: string): Unit | undefined {
    return this.getAll().find(u => u.id === id);
  },
};
