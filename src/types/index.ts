export interface User {
  id: string;
  username: string;
  password: string;
  role: 'viewer' | 'editor' | 'inventory_manager' | 'administrator';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  unitId: string;
  purchasePrice: number;
  sellingPrice: number;
  openingQuantity: number;
  currentQuantity: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  notes: string;
  openingDebt: number;
  debtDate: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}
export type Shift = 'morning' | 'evening';

export interface Movement {
  id: string;
  type: 'incoming' | 'outgoing' | 'manual_edit' | 'purchase' | 'invoice';
  productId: string;
  categoryId: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  price?: number;
  supplierId?: string;
  purchaseId?: string;
  invoiceId?: string;
  date: string;
  notes: string;
 shift?: Shift;     // ← أضف هذا السطر
  userId: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  invoiceDate: string;
  paymentDate?: string;
  items: PurchaseItem[];
  total: number;
  amountPaid: number;
  remainingDebt: number;
  notes: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceDate: string;
  items: InvoiceItem[];
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  notes: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  quantity: number;
  sellingPrice: number;
  total: number;
}

export interface Transfer {
  id: string;
  type: 'receive' | 'send';
  sender: string;
  receiver: string;
  phone: string;
  amount: number;
  date: string;
  details: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  notes: string;
  date: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}
export interface DailyReport {
  id: string;
  date: string;
  invoicesCount: number;
  totalSales: number;
  expenses: number;
  netProfit: number;
  notes: string;
  createdAt: string;
  shift: string;
}