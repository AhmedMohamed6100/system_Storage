import { useState, useMemo } from 'react';
import {
  Package, FileText, ShoppingCart, DollarSign, TrendingUp,
  AlertTriangle, Users, ArrowLeftRight, Wifi
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../utils/formatters';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';

const LOW_STOCK_THRESHOLD = 5;

type ChartTab = 'daily' | 'weekly' | 'monthly';

export default function DashboardPage() {
  const { products, categories, invoices, purchases, suppliers, supplierPayments, movements, transfers } = useApp();
  const [chartTab, setChartTab] = useState<ChartTab>('daily');
  const [activeProductTab, setActiveProductTab] = useState<'incoming' | 'outgoing'>('incoming');

  const totalInventoryValue = useMemo(() =>
    products.reduce((sum, p) => sum + p.currentQuantity * p.purchasePrice, 0), [products]);

  const totalInventoryAssets = useMemo(() =>
    products.reduce((sum, p) => sum + p.currentQuantity * p.sellingPrice, 0), [products]);

  const totalSupplierDebts = useMemo(() => {
    return suppliers.reduce((sum, s) => {
      const paid = supplierPayments.filter(p => p.supplierId === s.id).reduce((a, p) => a + p.amount, 0);
      const purchaseDebt = purchases.filter(p => p.supplierId === s.id).reduce((a, p) => a + p.remainingDebt, 0);
      return sum + s.openingDebt + purchaseDebt - paid;
    }, 0);
  }, [suppliers, supplierPayments, purchases]);

  const netAssets = totalInventoryAssets - totalSupplierDebts;

  const totalPaidPurchases = useMemo(() =>
    purchases.reduce((sum, p) => sum + p.amountPaid, 0), [purchases]);

  const totalInvoices = invoices.length;

  const totalReceived = useMemo(() => transfers.filter(t => t.type === 'receive').reduce((s, t) => s + t.amount, 0), [transfers]);
  const totalSent = useMemo(() => transfers.filter(t => t.type === 'send').reduce((s, t) => s + t.amount, 0), [transfers]);
  const netCash = totalReceived - totalSent;

  const lowStockProducts = useMemo(() =>
    products.filter(p => p.currentQuantity <= LOW_STOCK_THRESHOLD && p.currentQuantity >= 0), [products]);

  // Chart data by category for stock levels
  const stockChartData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name.length > 10 ? cat.name.substring(0, 10) + '...' : cat.name,
      quantity: products.filter(p => p.categoryId === cat.id).reduce((s, p) => s + p.currentQuantity, 0),
    }));
  }, [categories, products]);

  // Most active products
  const incomingMovements = useMemo(() => {
    const map: Record<string, number> = {};
    movements.filter(m => m.type === 'incoming' || m.type === 'purchase').forEach(m => {
      map[m.productId] = (map[m.productId] || 0) + m.quantity;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, qty]) => ({
        product: products.find(p => p.id === productId),
        qty,
      }))
      .filter(e => e.product);
  }, [movements, products]);

  const outgoingMovements = useMemo(() => {
    const map: Record<string, number> = {};
    movements.filter(m => m.type === 'outgoing' || m.type === 'invoice').forEach(m => {
      map[m.productId] = (map[m.productId] || 0) + m.quantity;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, qty]) => ({
        product: products.find(p => p.id === productId),
        qty,
      }))
      .filter(e => e.product);
  }, [movements, products]);

  // Build chart data for weekly/monthly/daily trends
  const trendData = useMemo(() => {
    const now = new Date();
    if (chartTab === 'daily') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const ds = d.toISOString().split('T')[0];
        const incoming = movements.filter(m => (m.type === 'incoming' || m.type === 'purchase') && m.date === ds).reduce((s, m) => s + m.quantity, 0);
        const outgoing = movements.filter(m => (m.type === 'outgoing' || m.type === 'invoice') && m.date === ds).reduce((s, m) => s + m.quantity, 0);
        return { name: d.toLocaleDateString('ar-EG', { weekday: 'short' }), وارد: incoming, صادر: outgoing };
      });
    }
    if (chartTab === 'weekly') {
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (3 - i) * 7 - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const ws = weekStart.toISOString().split('T')[0];
        const we = weekEnd.toISOString().split('T')[0];
        const incoming = movements.filter(m => (m.type === 'incoming' || m.type === 'purchase') && m.date >= ws && m.date <= we).reduce((s, m) => s + m.quantity, 0);
        const outgoing = movements.filter(m => (m.type === 'outgoing' || m.type === 'invoice') && m.date >= ws && m.date <= we).reduce((s, m) => s + m.quantity, 0);
        return { name: `أسبوع ${i + 1}`, وارد: incoming, صادر: outgoing };
      });
    }
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const ms = d.toISOString().split('T')[0].substring(0, 7);
      const incoming = movements.filter(m => (m.type === 'incoming' || m.type === 'purchase') && m.date?.startsWith(ms)).reduce((s, m) => s + m.quantity, 0);
      const outgoing = movements.filter(m => (m.type === 'outgoing' || m.type === 'invoice') && m.date?.startsWith(ms)).reduce((s, m) => s + m.quantity, 0);
      return { name: d.toLocaleDateString('ar-EG', { month: 'short' }), وارد: incoming, صادر: outgoing };
    });
  }, [movements, chartTab]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">نظرة عامة على النظام</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">الوضع المالي وحركة المخزون اللحظية</p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            النظام يعمل سحابياً ومحدث دائماً
          </span>
        </div>
      </div>

      {/* Summary cards row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي قيمة المخزن (الأصول)"
          value={formatCurrency(totalInventoryValue)}
          icon={<Package className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="ديون الموردين"
          value={formatCurrency(totalSupplierDebts)}
          icon={<TrendingUp className="w-6 h-6 text-red-500" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
        />
        <StatCard
          title="صافي قيمة الأصول (المدفوع)"
          value={formatCurrency(netAssets)}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="إجمالي الفواتير"
          value={String(totalInvoices)}
          icon={<FileText className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المشتريات المدفوعة"
          value={formatCurrency(totalPaidPurchases)}
          icon={<ShoppingCart className="w-6 h-6 text-orange-600" />}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
        />
        <StatCard
          title="صافي الكاش"
          value={formatCurrency(netCash)}
          icon={<DollarSign className="w-6 h-6 text-teal-600" />}
          iconBg="bg-teal-100 dark:bg-teal-900/30"
        />
        <StatCard
          title="إجمالي الوارد (تحويلات)"
          value={formatCurrency(totalReceived)}
          icon={<ArrowLeftRight className="w-6 h-6 text-cyan-600" />}
          iconBg="bg-cyan-100 dark:bg-cyan-900/30"
        />
        <StatCard
          title="عدد الموردين"
          value={String(suppliers.length)}
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4 text-right">تنبيهات هامة</h2>

          {totalSupplierDebts > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-3 flex items-center justify-between">
              <span className="text-red-600 font-bold text-sm">{formatCurrency(totalSupplierDebts)}</span>
              <span className="text-sm text-red-700 dark:text-red-400 font-medium">إجمالي المديونية الحالية</span>
            </div>
          )}

          {lowStockProducts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-orange-600 text-right flex items-center justify-end gap-1">
                <AlertTriangle className="w-4 h-4" />
                منتجات منخفضة المخزون ({lowStockProducts.length})
              </p>
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2">
                  <span className="text-orange-600 font-bold text-sm">{p.currentQuantity}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{p.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-600 text-right">لا توجد منتجات منخفضة المخزون</p>
          )}
        </div>

        {/* Stock by category chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4 text-right">مستويات التوفر</h2>
          {stockChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stockChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#2d5a8e" radius={[4, 4, 0, 0]} name="الكمية" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="لا توجد بيانات مخزون" />
          )}
        </div>

        {/* Movement trend chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              {(['daily', 'weekly', 'monthly'] as ChartTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartTab === tab ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {tab === 'daily' ? 'يومي' : tab === 'weekly' ? 'أسبوعي' : 'شهري'}
                </button>
              ))}
            </div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">حركة المخزون</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="وارد" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="صادر" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most active products */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveProductTab('incoming')}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${activeProductTab === 'incoming' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              الأكثر وروداً (شراء)
            </button>
            <button
              onClick={() => setActiveProductTab('outgoing')}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${activeProductTab === 'outgoing' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              الأكثر استهلاكاً (صرف)
            </button>
          </div>
          <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            تحليل المنتجات الأكثر حركة
          </h2>
        </div>

        {(activeProductTab === 'incoming' ? incomingMovements : outgoingMovements).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-300 font-semibold">#</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-300 font-semibold">المنتج</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-300 font-semibold">إجمالي الكمية</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-300 font-semibold">المخزون الحالي</th>
                </tr>
              </thead>
              <tbody>
                {(activeProductTab === 'incoming' ? incomingMovements : outgoingMovements).map((entry, i) => (
                  <tr key={entry.product!.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{entry.product!.name}</td>
                    <td className={`px-4 py-2.5 font-bold ${activeProductTab === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>{entry.qty}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{entry.product!.currentQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message={activeProductTab === 'incoming' ? 'لا توجد عمليات توريد' : 'لا توجد عمليات صرف'} />
        )}
      </div>
    </div>
  );
}
