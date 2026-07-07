import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Category,
  Unit,
  Product,
  Supplier,
  SupplierPayment,
  Movement,
  Purchase,
  Invoice,
  Transfer,
  Expense,
  DailyReport,
} from '../types';

import { categoriesService } from '../services/categoriesService';
import { unitsService } from '../services/unitsService';
import { productsService } from '../services/productsService';
import { suppliersService } from '../services/suppliersService';
import { movementsService } from '../services/movementsService';
import { purchasesService } from '../services/purchasesService';
import { invoicesService } from '../services/invoicesService';
import { transfersService } from '../services/transfersService';
import { expensesService } from '../services/expensesService';
import { dailyReportsService } from '../services/dailyReportsService';

interface AppContextType {
  categories: Category[];
  units: Unit[];
  products: Product[];
  suppliers: Supplier[];
  supplierPayments: SupplierPayment[];
  movements: Movement[];
  purchases: Purchase[];
  invoices: Invoice[];
  transfers: Transfer[];
  expenses: Expense[];
  dailyReports: DailyReport[];

  refreshAll: () => void;
  refreshCategories: () => void;
  refreshUnits: () => void;
  refreshProducts: () => void;
  refreshSuppliers: () => void;
  refreshMovements: () => void;
  refreshPurchases: () => void;
  refreshInvoices: () => void;
  refreshTransfers: () => void;
  refreshExpenses: () => void;
  refreshDailyReports: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => categoriesService.getAll());
  const [units, setUnits] = useState<Unit[]>(() => unitsService.getAll());
  const [products, setProducts] = useState<Product[]>(() => productsService.getAll());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => suppliersService.getAll());
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => suppliersService.getPayments());
  const [movements, setMovements] = useState<Movement[]>(() => movementsService.getAll());
  const [purchases, setPurchases] = useState<Purchase[]>(() => purchasesService.getAll());
  const [invoices, setInvoices] = useState<Invoice[]>(() => invoicesService.getAll());
  const [transfers, setTransfers] = useState<Transfer[]>(() => transfersService.getAll());
  const [expenses, setExpenses] = useState<Expense[]>(() => expensesService.getAll());

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() =>
    dailyReportsService.getAll()
  );

  const refreshCategories = useCallback(() => setCategories(categoriesService.getAll()), []);

  const refreshUnits = useCallback(() => setUnits(unitsService.getAll()), []);

  const refreshProducts = useCallback(() => setProducts(productsService.getAll()), []);

  const refreshSuppliers = useCallback(() => {
    setSuppliers(suppliersService.getAll());
    setSupplierPayments(suppliersService.getPayments());
  }, []);

  const refreshMovements = useCallback(() => setMovements(movementsService.getAll()), []);

  const refreshPurchases = useCallback(() => setPurchases(purchasesService.getAll()), []);

  const refreshInvoices = useCallback(() => setInvoices(invoicesService.getAll()), []);

  const refreshTransfers = useCallback(() => setTransfers(transfersService.getAll()), []);

  const refreshExpenses = useCallback(() => setExpenses(expensesService.getAll()), []);

  const refreshDailyReports = useCallback(() => {
    setDailyReports(dailyReportsService.getAll());
  }, []);

  const refreshAll = useCallback(() => {
    refreshCategories();
    refreshUnits();
    refreshProducts();
    refreshSuppliers();
    refreshMovements();
    refreshPurchases();
    refreshInvoices();
    refreshTransfers();
    refreshExpenses();
    refreshDailyReports();
  }, [
    refreshCategories,
    refreshUnits,
    refreshProducts,
    refreshSuppliers,
    refreshMovements,
    refreshPurchases,
    refreshInvoices,
    refreshTransfers,
    refreshExpenses,
    refreshDailyReports,
  ]);

  return (
    <AppContext.Provider
      value={{
        categories,
        units,
        products,
        suppliers,
        supplierPayments,
        movements,
        purchases,
        invoices,
        transfers,
        expenses,
        dailyReports,

        refreshAll,
        refreshCategories,
        refreshUnits,
        refreshProducts,
        refreshSuppliers,
        refreshMovements,
        refreshPurchases,
        refreshInvoices,
        refreshTransfers,
        refreshExpenses,
        refreshDailyReports,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }

  return ctx;
}