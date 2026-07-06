import { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatDate } from '../utils/formatters';

type MovementType = '' | 'incoming' | 'outgoing' | 'purchase' | 'invoice' | 'manual_edit';

const typeLabels: Record<string, { label: string; color: string }> = {
  incoming: { label: 'وارد', color: 'bg-green-100 text-green-700' },
  outgoing: { label: 'صادر', color: 'bg-red-100 text-red-700' },
  purchase: { label: 'مشتريات', color: 'bg-blue-100 text-blue-700' },
  invoice: { label: 'فاتورة', color: 'bg-purple-100 text-purple-700' },
  manual_edit: { label: 'تعديل يدوي', color: 'bg-yellow-100 text-yellow-700' },
};

export default function MovementHistoryPage() {
  const { movements, products, categories } = useApp();
  const [filterType, setFilterType] = useState<MovementType>('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const filtered = useMemo(() => {
    return movements.filter(m => {
      if (filterType && m.type !== filterType) return false;
      if (filterProduct && m.productId !== filterProduct) return false;
      if (filterFrom && m.date < filterFrom) return false;
      if (filterTo && m.date > filterTo) return false;
      return true;
    });
  }, [movements, filterType, filterProduct, filterFrom, filterTo]);

  const clearFilters = () => {
    setFilterType('');
    setFilterProduct('');
    setFilterFrom('');
    setFilterTo('');
  };

  return (
    <div className="animate-fade-in">
      <div className="text-right mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">سجل الحركات</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">جميع عمليات الوارد والصادر والتعديلات</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={clearFilters} className="text-sm text-red-500 hover:underline">مسح الفلاتر</button>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4" />
            تصفية النتائج
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-right">إلى تاريخ</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-right">من تاريخ</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-right">المنتج</label>
            <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} dir="rtl" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm">
              <option value="">جميع المنتجات</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-right">نوع الحركة</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value as MovementType)} dir="rtl" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm">
              <option value="">جميع الأنواع</option>
              <option value="incoming">وارد</option>
              <option value="outgoing">صادر</option>
              <option value="purchase">مشتريات</option>
              <option value="invoice">فاتورة</option>
              <option value="manual_edit">تعديل يدوي</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">إجمالي النتائج: {filtered.length} حركة</p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">#</th>
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">النوع</th>
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">المنتج</th>
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">القسم</th>
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">الكمية</th>
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">قبل</th>
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">بعد</th>
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">التاريخ</th>
                <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">لا توجد حركات مسجلة</td></tr>
              ) : (
                filtered.map((m, idx) => {
                  const product = products.find(p => p.id === m.productId);
                  const category = categories.find(c => c.id === m.categoryId);
                  const typeInfo = typeLabels[m.type] || { label: m.type, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{product?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{category?.name || '-'}</td>
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{m.quantity}</td>
                      <td className="px-4 py-3 text-gray-500">{m.previousQuantity}</td>
                      <td className="px-4 py-3 font-medium text-[#2d5a8e]">{m.newQuantity}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.date || formatDate(m.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-500">{m.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
