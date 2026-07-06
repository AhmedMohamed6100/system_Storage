import { useState, useMemo } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { transfersService } from '../services/transfersService';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate, today } from '../utils/formatters';

export default function TransfersPage() {
  const { transfers, refreshTransfers } = useApp();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [type, setType] = useState<'receive' | 'send'>('receive');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [details, setDetails] = useState('');

  const filtered = useMemo(() => {
    return transfers.filter(t => {
      const matchSearch = !search.trim() || t.sender.includes(search) || t.receiver.includes(search) || t.details.includes(search);
      const matchDate = !filterDate || t.date === filterDate;
      return matchSearch && matchDate;
    });
  }, [transfers, search, filterDate]);

  const totalReceived = useMemo(() => transfers.filter(t => t.type === 'receive').reduce((s, t) => s + t.amount, 0), [transfers]);
  const totalSent = useMemo(() => transfers.filter(t => t.type === 'send').reduce((s, t) => s + t.amount, 0), [transfers]);
  const netCash = totalReceived - totalSent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showToast('يرجى إدخال المبلغ', 'error');
      return;
    }
    transfersService.add({ type, sender, receiver, phone, amount: parseFloat(amount), date, details });
    refreshTransfers();
    showToast('تم تسجيل الحوالة بنجاح', 'success');
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setType('receive'); setSender(''); setReceiver(''); setPhone('');
    setAmount(''); setDate(today()); setDetails('');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <button
          onClick={() => { setShowModal(true); resetForm(); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة حوالة
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الحوالات والكاش</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة المبالغ المستلمة والمرسلة</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">إجمالي المستلم</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">إجمالي المرسل</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalSent)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">صافي الكاش</p>
          <p className={`text-xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netCash)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
        <div className="relative flex-1 min-w-48">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو التفاصيل..." dir="rtl" className="w-full px-4 py-2 pr-9 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">النوع</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">المرسل</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">المستلم</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">الهاتف</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">المبلغ</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">التاريخ</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">التفاصيل</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">خيارات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">لا توجد حوالات</td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'receive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.type === 'receive' ? 'مستلم' : 'مرسل'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.sender || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.receiver || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.phone || '-'}</td>
                  <td className={`px-4 py-3 font-bold ${t.type === 'receive' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(t.date)}</td>
                  <td className="px-4 py-3 text-gray-500">{t.details || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleteId(t.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة حوالة جديدة" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">نوع العملية</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setType('send')} className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${type === 'send' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>تحويل (مرسل)</button>
              <button type="button" onClick={() => setType('receive')} className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${type === 'receive' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>استلام (مستلم)</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المستلم</label>
              <input type="text" value={receiver} onChange={e => setReceiver(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المرسل</label>
              <input type="text" value={sender} onChange={e => setSender(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">التاريخ</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">الهاتف (اختياري)</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المبلغ</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">التفاصيل</label>
            <input type="text" value={details} onChange={e => setDetails(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <button type="submit" className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all">
            حفظ الحوالة
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) { transfersService.delete(deleteId); refreshTransfers(); showToast('تم الحذف', 'success'); setDeleteId(null); }
        }}
        title="حذف الحوالة"
        message="هل أنت متأكد من حذف هذه الحوالة؟"
      />
    </div>
  );
}
