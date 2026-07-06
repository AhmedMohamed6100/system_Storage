import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { expensesService } from '../services/expensesService';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate, today, isToday, isThisWeek, isThisMonth, isInDateRange } from '../utils/formatters';

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function ExpensesPage() {
  const { expenses, refreshExpenses } = useApp();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [period, setPeriod] = useState<FilterPeriod>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today());

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (period === 'today') return isToday(e.date);
      if (period === 'week') return isThisWeek(e.date);
      if (period === 'month') return isThisMonth(e.date);
      if (period === 'custom' && (customFrom || customTo)) return isInDateRange(e.date, customFrom, customTo);
      return true;
    });
  }, [expenses, period, customFrom, customTo]);

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    expensesService.add({ name: name.trim(), amount: parseFloat(amount), notes, date });
    refreshExpenses();
    showToast('تم إضافة المصروف بنجاح', 'success');
    setShowModal(false);
    setName(''); setAmount(''); setNotes(''); setDate(today());
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          إضافة مصروف
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">المصاريف العامة</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">تتبع وإدارة المصروفات العامة</p>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap justify-end">
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

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 flex items-center justify-between">
        <span className="text-xl font-bold text-red-600">{formatCurrency(total)}</span>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">إجمالي المصاريف</p>
          <p className="text-xs text-gray-400">{filtered.length} مصروف</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">#</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">اسم المصروف</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">المبلغ</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">التاريخ</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">ملاحظات</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">خيارات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">لا توجد مصاريف</td></tr>
            ) : (
              filtered.map((exp, idx) => (
                <tr key={exp.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{exp.name}</td>
                  <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(exp.date)}</td>
                  <td className="px-4 py-3 text-gray-500">{exp.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleteId(exp.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة مصروف جديد" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">اسم المصروف *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">التاريخ</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المبلغ *</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">ملاحظات</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <button type="submit" className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all">
            إضافة المصروف
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { expensesService.delete(deleteId); refreshExpenses(); showToast('تم الحذف', 'success'); setDeleteId(null); } }}
        title="حذف المصروف"
        message="هل أنت متأكد من حذف هذا المصروف؟"
      />
    </div>
  );
}
