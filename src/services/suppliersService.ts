import { Supplier, SupplierPayment } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId, today } from '../utils/formatters';

export const suppliersService = {
  getAll(): Supplier[] {
    return getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
  },

  getById(id: string): Supplier | undefined {
    return this.getAll().find(s => s.id === id);
  },

  add(data: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const suppliers = this.getAll();
    const supplier: Supplier = { ...data, id: generateId(), createdAt: today() };
    setItem(STORAGE_KEYS.SUPPLIERS, [...suppliers, supplier]);
    return supplier;
  },

  update(id: string, data: Partial<Supplier>): Supplier | null {
    const suppliers = this.getAll();
    const idx = suppliers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    suppliers[idx] = { ...suppliers[idx], ...data };
    setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    return suppliers[idx];
  },

  delete(id: string): boolean {
    const suppliers = this.getAll();
    setItem(STORAGE_KEYS.SUPPLIERS, suppliers.filter(s => s.id !== id));
    return true;
  },

  getPayments(): SupplierPayment[] {
    return getItem<SupplierPayment[]>(STORAGE_KEYS.SUPPLIER_PAYMENTS, []);
  },

  getPaymentsBySupplierId(supplierId: string): SupplierPayment[] {
    return this.getPayments().filter(p => p.supplierId === supplierId);
  },

  addPayment(supplierId: string, amount: number, notes: string): SupplierPayment {
    const payments = this.getPayments();
    const payment: SupplierPayment = {
      id: generateId(),
      supplierId,
      amount,
      notes,
      date: today(),
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, [...payments, payment]);
    return payment;
  },

  getTotalDebtForSupplier(supplierId: string): number {
    const supplier = this.getById(supplierId);
    if (!supplier) return 0;
    const paid = this.getPaymentsBySupplierId(supplierId).reduce((s, p) => s + p.amount, 0);
    const purchases = getItem<any[]>(STORAGE_KEYS.PURCHASES, [])
      .filter((p: any) => p.supplierId === supplierId)
      .reduce((s: number, p: any) => s + (p.remainingDebt || 0), 0);
    return supplier.openingDebt + purchases - paid;
  },

  getTotalDebts(): number {
    return this.getAll().reduce((sum, s) => {
      const paid = this.getPaymentsBySupplierId(s.id).reduce((a, p) => a + p.amount, 0);
      const purchases = getItem<any[]>(STORAGE_KEYS.PURCHASES, [])
        .filter((p: any) => p.supplierId === s.id)
        .reduce((a: number, p: any) => a + (p.remainingDebt || 0), 0);
      return sum + s.openingDebt + purchases - paid;
    }, 0);
  },
};
