export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(key);
}

export const STORAGE_KEYS = {
  USERS: 'ae_users',
  AUTH: 'ae_auth',
  CATEGORIES: 'ae_categories',
  UNITS: 'ae_units',
  PRODUCTS: 'ae_products',
  SUPPLIERS: 'ae_suppliers',
  SUPPLIER_PAYMENTS: 'ae_supplier_payments',
  MOVEMENTS: 'ae_movements',
  PURCHASES: 'ae_purchases',
  INVOICES: 'ae_invoices',
  TRANSFERS: 'ae_transfers',
  EXPENSES: 'ae_expenses',
  THEME: 'ae_theme',
} as const;
