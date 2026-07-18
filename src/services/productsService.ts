import { Product } from "../types";
import { getItem, setItem, STORAGE_KEYS } from "../utils/storage";
import { generateId, today } from "../utils/formatters";
import { movementsService } from "./movementsService";
// import { ProductBatch } from "../types";

export const productsService = {
  getAll(): Product[] {
    return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  },

  getById(id: string): Product | undefined {
    return this.getAll().find((p) => p.id === id);
  },

  getByCategory(categoryId: string): Product[] {
    return this.getAll().filter((p) => p.categoryId === categoryId);
  },

  add(data: Omit<Product, "id" | "createdAt">): Product {
    const products = this.getAll();
    const product: Product = {
      ...data,
      id: generateId(),
      createdAt: today(),
      batches: [
        {
          id: generateId(),
          productId: /* link batch to this product */ undefined as unknown as string,
          quantity: data.openingQuantity,
          remainingQuantity: data.openingQuantity,
          purchasePrice: data.purchasePrice,
          date: today(),
        },
      ],
    };
    setItem(STORAGE_KEYS.PRODUCTS, [...products, product]);
    return product;
  },

  update(id: string, data: Partial<Product>): Product | null {
    const products = this.getAll();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data };
    setItem(STORAGE_KEYS.PRODUCTS, products);
    return products[idx];
  },

  delete(id: string): boolean {
    const products = this.getAll();
    setItem(
      STORAGE_KEYS.PRODUCTS,
      products.filter((p) => p.id !== id),
    );
    return true;
  },

  addIncoming(
    productId: string,
    quantity: number,
    price: number | undefined,
    supplierId: string | undefined,
    date: string,
    notes: string,
    shift: "morning" | "evening", // ← أضفنا الوردية
    userId: string,
  ): boolean {
    const products = this.getAll();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return false;

    const prev = products[idx].currentQuantity;

    // إضافة الدفعة الجديدة
    products[idx].batches.push({
      id: generateId(),
      productId: productId,
      quantity,
      remainingQuantity: quantity,
      purchasePrice: price ?? products[idx].purchasePrice,
      supplierId,
      date,
    });

    // تحديث آخر سعر شراء للمنتج (ليظهر في الجدول الرئيسي)
    if (price !== undefined) {
      products[idx].purchasePrice = price;
    }

    // تحديث إجمالي الكمية
    products[idx].currentQuantity += quantity;

    setItem(STORAGE_KEYS.PRODUCTS, products);

    movementsService.record({
      type: "incoming",
      productId,
      categoryId: products[idx].categoryId,
      quantity,
      previousQuantity: prev,
      newQuantity: products[idx].currentQuantity,
      price,
      supplierId,
      date,
      notes,
      shift, // ← أضفنا الوردية هنا
      userId,
    });

    return true;
  },
  addOutgoing(
    productId: string,
    quantity: number,
    date: string,
    notes: string,
    shift: "morning" | "evening",
    userId: string,
  ): boolean {
    const products = this.getAll();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return false;

    if (products[idx].currentQuantity < quantity) return false;

    const prev = products[idx].currentQuantity;
    let remaining = quantity;

    for (const batch of products[idx].batches) {
      if (remaining <= 0) break;

      if (batch.remainingQuantity >= remaining) {
        batch.remainingQuantity -= remaining;

        remaining = 0;
      } else {
        remaining -= batch.remainingQuantity;

        batch.remainingQuantity = 0;
      }
    }

    products[idx].currentQuantity -= quantity;

    setItem(STORAGE_KEYS.PRODUCTS, products);

    movementsService.record({
      type: "outgoing",
      productId,
      categoryId: products[idx].categoryId,
      quantity,
      previousQuantity: prev,
      newQuantity: products[idx].currentQuantity,
      date,
      notes,
      shift,
      userId,
    });

    return true;
  },

  manualEdit(
    productId: string,
    newQuantity: number,
    notes: string,
    shift: "morning" | "evening",
    userId: string,
  ): boolean {
    const products = this.getAll();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return false;
    const prev = products[idx].currentQuantity;
    const diff = Math.abs(newQuantity - prev);
    products[idx].currentQuantity = newQuantity;
    setItem(STORAGE_KEYS.PRODUCTS, products);

    movementsService.record({
      type: "manual_edit",
      productId,
      categoryId: products[idx].categoryId,
      quantity: diff,
      previousQuantity: prev,
      newQuantity,
      date: today(),
      notes: notes || "تعديل يدوي للكمية",
      shift,
      userId,
    });

    return true;
  },

  getTotalInventoryValue(): number {
    return this.getAll().reduce(
      (sum, p) => sum + p.currentQuantity * p.purchasePrice,
      0,
    );
  },

  countByCategory(categoryId: string): number {
    return this.getByCategory(categoryId).length;
  },
};
