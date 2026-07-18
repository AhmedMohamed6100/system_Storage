import { Purchase } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "../utils/storage";
import { generateId } from "../utils/formatters";
import { productsService } from "./productsService";
import { movementsService } from "./movementsService";

export const purchasesService = {
  getAll(): Purchase[] {
    return getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  },

  getById(id: string): Purchase | undefined {
    return this.getAll().find((p) => p.id === id);
  },

  add(data: Omit<Purchase, "id" | "createdAt">, userId: string): Purchase {
    const purchases = this.getAll();
    const purchase: Purchase = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.PURCHASES, [...purchases, purchase]);

    // Update product quantities
    data.items.forEach((item) => {
      const products = productsService.getAll();
      const idx = products.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        const prev = products[idx].currentQuantity;

        products[idx].currentQuantity += item.quantity;

        // Add new batch
        products[idx].batches.push({
          id: generateId(),
          productId: item.productId,
          quantity: item.quantity,
          remainingQuantity: item.quantity,
          purchasePrice: item.unitPrice,
          date: data.invoiceDate,
        });

        setItem(STORAGE_KEYS.PRODUCTS, products);   

        movementsService.record({
          type: "purchase",
          productId: item.productId,
          categoryId: products[idx].categoryId,
          quantity: item.quantity,
          previousQuantity: prev,
          newQuantity: products[idx].currentQuantity,
          price: item.unitPrice,
          supplierId: data.supplierId,
          purchaseId: purchase.id,
          date: data.invoiceDate,
          notes: data.notes,
          userId,
        });
      }
    });

    return purchase;
  },

  getTotalPaid(): number {
    return this.getAll().reduce((sum, p) => sum + p.amountPaid, 0);
  },

  getTotalRemaining(): number {
    return this.getAll().reduce((sum, p) => sum + p.remainingDebt, 0);
  },
};
