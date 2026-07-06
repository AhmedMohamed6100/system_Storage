import { Invoice } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId } from '../utils/formatters';
import { productsService } from './productsService';
import { movementsService } from './movementsService';

export const invoicesService = {
  getAll(): Invoice[] {
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  },

  getById(id: string): Invoice | undefined {
    return this.getAll().find(inv => inv.id === id);
  },

  add(data: Omit<Invoice, 'id' | 'createdAt'>, userId: string): Invoice {
    const invoices = this.getAll();
    const invoice: Invoice = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setItem(STORAGE_KEYS.INVOICES, [...invoices, invoice]);

    data.items.forEach(item => {
      const products = productsService.getAll();
      const idx = products.findIndex(p => p.id === item.productId);
      if (idx !== -1) {
        const prev = products[idx].currentQuantity;
        products[idx].currentQuantity -= item.quantity;
        if (products[idx].currentQuantity < 0) products[idx].currentQuantity = 0;
        setItem(STORAGE_KEYS.PRODUCTS, products);
        movementsService.record({
          type: 'invoice',
          productId: item.productId,
          categoryId: products[idx].categoryId,
          quantity: item.quantity,
          previousQuantity: prev,
          newQuantity: products[idx].currentQuantity,
          price: item.sellingPrice,
          invoiceId: invoice.id,
          date: data.invoiceDate,
          notes: data.notes,
          userId,
        });
      }
    });

    return invoice;
  },

  getTotalSales(): number {
    return this.getAll().reduce((sum, inv) => sum + inv.totalSales, 0);
  },

  getTotalExpenses(): number {
    return this.getAll().reduce((sum, inv) => sum + inv.totalExpenses, 0);
  },

  getTotalProfit(): number {
    return this.getAll().reduce((sum, inv) => sum + inv.netProfit, 0);
  },
};
