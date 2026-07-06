import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, FileText } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, isToday, isThisWeek, isThisMonth, isInDateRange } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'custom';

const COLORS = ['#2d5a8e', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function ReportsPage() {
  const { products, categories, invoices, purchases, suppliers, supplierPayments, transfers, expenses } = useApp();
  const [period, setPeriod] = useState<FilterPeriod>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const matchPeriod = (dateStr: string) => {
    if (period === 'today') return isToday(dateStr);
    if (period === 'week') return isThisWeek(dateStr);
    if (period === 'month') return isThisMonth(dateStr);
    if (period === 'custom' && (customFrom || customTo)) return isInDateRange(dateStr, customFrom, customTo);
    return true;
  };

  const filteredInvoices = useMemo(() => invoices.filter(i => matchPeriod(i.invoiceDate)), [invoices, period, customFrom, customTo]);
  const filteredPurchases = useMemo(() => purchases.filter(p => matchPeriod(p.invoiceDate)), [purchases, period, customFrom, customTo]);
  const filteredExpenses = useMemo(() => expenses.filter(e => matchPeriod(e.date)), [expenses, period, customFrom, customTo]);
  const filteredTransfers = useMemo(() => transfers.filter(t => matchPeriod(t.date)), [transfers, period, customFrom, customTo]);

  const totalInventoryValue = products.reduce((s, p) => s + p.currentQuantity * p.purchasePrice, 0);
  const totalInventoryAssets = products.reduce((s, p) => s + p.currentQuantity * p.sellingPrice, 0);

  const totalSupplierDebts = suppliers.reduce((sum, s) => {
    const paid = supplierPayments.filter(p => p.supplierId === s.id).reduce((a, p) => a + p.amount, 0);
    const purchaseDebt = purchases.filter(p => p.supplierId === s.id).reduce((a, p) => a + p.remainingDebt, 0);
    return sum + s.openingDebt + purchaseDebt - paid;
  }, 0);

  const totalSales = filteredInvoices.reduce((s, i) => s + i.totalSales, 0);
  const totalProfit = filteredInvoices.reduce((s, i) => s + i.netProfit, 0);
  const totalPurchases = filteredPurchases.reduce((s, p) => s + p.total, 0);
  const totalPaid = filteredPurchases.reduce((s, p) => s + p.amountPaid, 0);
  const totalRemaining = filteredPurchases.reduce((s, p) => s + p.remainingDebt, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netCashReceived = filteredTransfers.filter(t => t.type === 'receive').reduce((s, t) => s + t.amount, 0);
  const netCashSent = filteredTransfers.filter(t => t.type === 'send').reduce((s, t) => s + t.amount, 0);
  const netCash = netCashReceived - netCashSent;

  const categoryData = categories.map(cat => ({
    name: cat.name.length > 8 ? cat.name.substring(0, 8) + '...' : cat.name,
    قيمة: products.filter(p => p.categoryId === cat.id).reduce((s, p) => s + p.currentQuantity * p.purchasePrice, 0),
  }));

  const summaryCards = [
    { title: 'قيمة المخزون (الأصول)', value: formatCurrency(totalInventoryValue), icon: <Package className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'قيمة الأصول بسعر البيع', value: formatCurrency(totalInventoryAssets), icon: <Package className="w-5 h-5 text-cyan-600" />, bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { title: 'ديون الموردين', value: formatCurrency(Math.max(0, totalSupplierDebts)), icon: <TrendingDown className="w-5 h-5 text-red-600" />, bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'إجمالي المشتريات', value: formatCurrency(totalPurchases), icon: <ShoppingCart className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { title: 'المبالغ المدفوعة', value: formatCurrency(totalPaid), icon: <DollarSign className="w-5 h-5 text-green-600" />, bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'الديون المتبقية', value: formatCurrency(totalRemaining), icon: <TrendingDown className="w-5 h-5 text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'إجمالي المبيعات', value: formatCurrency(totalSales), icon: <FileText className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'صافي الربح', value: formatCurrency(totalProfit), icon: <TrendingUp className="w-5 h-5 text-green-600" />, bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'إجمالي المصاريف', value: formatCurrency(totalExpenses), icon: <TrendingDown className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { title: 'صافي الكاش', value: formatCurrency(netCash), icon: <DollarSign className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="text-right mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">التقارير المالية</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">تقارير شاملة عن المخزون والمالية</p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap justify-end">
        {(['all', 'today', 'week', 'month', 'custom'] as FilterPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${period === p ? 'bg-[#2d5a8e] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'}`}
          >
            {p === 'all' ? 'الكل' : p === 'today' ? 'اليوم' : p === 'week' ? 'الأسبوع' : p === 'month' ? 'الشهر' : 'مخصص'}
          </button>
        ))}
        {period === 'custom' && (
          <>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e]" />
            <span className="text-gray-400 text-sm">إلى</span>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e]" />
            <span className="text-gray-400 text-sm">من</span>
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card, idx) => (
          <div key={idx} className={`${card.bg} rounded-xl p-4 border border-gray-100 dark:border-gray-700`}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-white/50 dark:bg-gray-800/50 rounded-lg">{card.icon}</div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 text-right">{card.title}</p>
            <p className="text-base font-bold text-gray-800 dark:text-white text-right">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category values */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4 text-right">قيمة المخزون بالأقسام</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Bar dataKey="قيمة" fill="#2d5a8e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-10 text-gray-400">لا توجد بيانات</p>}
        </div>

        {/* P&L summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4 text-right">ملخص الأرباح والخسائر</h3>
          {(totalSales > 0 || totalExpenses > 0 || totalPurchases > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'مبيعات', value: totalSales },
                    { name: 'مشتريات', value: totalPurchases },
                    { name: 'مصاريف', value: totalExpenses },
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {[0, 1, 2].map(index => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-10 text-gray-400">لا توجد بيانات</p>}
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mt-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4 text-right">تفاصيل قيمة المخزون بالأقسام</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-semibold">القسم</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-semibold">عدد المنتجات</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-semibold">الكمية الإجمالية</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-semibold">قيمة بسعر الشراء</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-semibold">قيمة بسعر البيع</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const catProducts = products.filter(p => p.categoryId === cat.id);
              const qty = catProducts.reduce((s, p) => s + p.currentQuantity, 0);
              const purchaseValue = catProducts.reduce((s, p) => s + p.currentQuantity * p.purchasePrice, 0);
              const sellingValue = catProducts.reduce((s, p) => s + p.currentQuantity * p.sellingPrice, 0);
              return (
                <tr key={cat.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-600">{catProducts.length}</td>
                  <td className="px-4 py-3 text-gray-600">{qty}</td>
                  <td className="px-4 py-3 font-medium text-blue-600">{formatCurrency(purchaseValue)}</td>
                  <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(sellingValue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
