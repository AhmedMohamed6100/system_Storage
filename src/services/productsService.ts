import { Product } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId, today } from '../utils/formatters';
import { movementsService } from './movementsService';

export const productsService = {
  getAll(): Product[] {
    return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  },

  getById(id: string): Product | undefined {
    return this.getAll().find(p => p.id === id);
  },

  getByCategory(categoryId: string): Product[] {
    return this.getAll().filter(p => p.categoryId === categoryId);
  },

  add(data: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getAll();
    const product: Product = { ...data, id: generateId(), createdAt: today() };
    setItem(STORAGE_KEYS.PRODUCTS, [...products, product]);
    return product;
  },

  update(id: string, data: Partial<Product>): Product | null {
    const products = this.getAll();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data };
    setItem(STORAGE_KEYS.PRODUCTS, products);
    return products[idx];
  },

  delete(id: string): boolean {
    const products = this.getAll();
    setItem(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id));
    return true;
  },

  addIncoming(productId: string, quantity: number, price: number | undefined, supplierId: string | undefined, date: string, notes: string, userId: string): boolean {
    const products = this.getAll();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return false;
    const prev = products[idx].currentQuantity;
    products[idx].currentQuantity += quantity;
    setItem(STORAGE_KEYS.PRODUCTS, products);
    movementsService.record({
      type: 'incoming',
      productId,
      categoryId: products[idx].categoryId,
      quantity,
      previousQuantity: prev,
      newQuantity: products[idx].currentQuantity,
      price,
      supplierId,
      date,
      notes,
      userId,
    });
    return true;
  },

  addOutgoing(productId: string, quantity: number, date: string, notes: string, userId: string): boolean {
    const products = this.getAll();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return false;
    if (products[idx].currentQuantity < quantity) return false;
    const prev = products[idx].currentQuantity;
    products[idx].currentQuantity -= quantity;
    setItem(STORAGE_KEYS.PRODUCTS, products);
    movementsService.record({
      type: 'outgoing',
      productId,
      categoryId: products[idx].categoryId,
      quantity,
      previousQuantity: prev,
      newQuantity: products[idx].currentQuantity,
      date,
      notes,
      userId,
    });
    return true;
  },

  manualEdit(productId: string, newQuantity: number, notes: string, userId: string): boolean {
    const products = this.getAll();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return false;
    const prev = products[idx].currentQuantity;
    const diff = Math.abs(newQuantity - prev);
    products[idx].currentQuantity = newQuantity;
    setItem(STORAGE_KEYS.PRODUCTS, products);
    movementsService.record({
      type: 'manual_edit',
      productId,
      categoryId: products[idx].categoryId,
      quantity: diff,
      previousQuantity: prev,
      newQuantity,
      date: today(),
      notes: notes || 'تعديل يدوي للكمية',
      userId,
    });
    return true;
  },

  getTotalInventoryValue(): number {
    return this.getAll().reduce((sum, p) => sum + p.currentQuantity * p.purchasePrice, 0);
  },

  countByCategory(categoryId: string): number {
    return this.getByCategory(categoryId).length;
  },
};
