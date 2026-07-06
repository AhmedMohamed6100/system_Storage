import { useState, useMemo } from 'react';
import { Plus, Trash2, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { suppliersService } from '../services/suppliersService';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate, today } from '../utils/formatters';

export default function SuppliersPage() {
  const { suppliers, supplierPayments, purchases, refreshSuppliers } = useApp();
  const { showToast } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [openingDebt, setOpeningDebt] = useState('0');
  const [debtDate, setDebtDate] = useState(today());

  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const getSupplierDebt = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return 0;
    const paid = supplierPayments.filter(p => p.supplierId === supplierId).reduce((s, p) => s + p.amount, 0);
    const purchaseDebt = purchases.filter(p => p.supplierId === supplierId).reduce((s, p) => s + p.remainingDebt, 0);
    return supplier.openingDebt + purchaseDebt - paid;
  };

  const totalDebts = useMemo(() => suppliers.reduce((s, sup) => s + Math.max(0, getSupplierDebt(sup.id)), 0), [suppliers, supplierPayments, purchases]);

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast('يرجى إدخال اسم المورد', 'error'); return; }
    suppliersService.add({ name: name.trim(), address, notes, openingDebt: parseFloat(openingDebt) || 0, debtDate });
    refreshSuppliers();
    showToast('تم إضافة المورد بنجاح', 'success');
    setShowAddModal(false);
    resetAddForm();
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !payAmount || parseFloat(payAmount) <= 0) {
      showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }
    suppliersService.addPayment(selectedSupplierId, parseFloat(payAmount), payNotes);
    refreshSuppliers();
    showToast('تم تسجيل الدفعة بنجاح', 'success');
    setShowPayModal(false);
    setPayAmount('');
    setPayNotes('');
  };

  const resetAddForm = () => { setName(''); setAddress(''); setNotes(''); setOpeningDebt('0'); setDebtDate(today()); };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <button onClick={() => { setShowAddModal(true); resetAddForm(); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          إضافة مورد
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الموردين والديون</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة الموردين وتتبع الديون والمدفوعات</p>
        </div>
      </div>

      {/* Total debts */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center justify-between">
        <span className="text-xl font-bold text-red-600">{formatCurrency(totalDebts)}</span>
        <div className="text-right">
          <p className="text-sm font-bold text-red-700">إجمالي الديون الحالية</p>
          <p className="text-xs text-red-500">{suppliers.length} مورد</p>
        </div>
      </div>

      {/* Suppliers list */}
      <div className="space-y-3">
        {suppliers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 shadow-sm">لا يوجد موردون بعد</div>
        ) : (
          suppliers.map(supplier => {
            const debt = getSupplierDebt(supplier.id);
            const isExpanded = expandedId === supplier.id;
            const payments = supplierPayments.filter(p => p.supplierId === supplier.id);

            return (
              <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDeleteId(supplier.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedSupplierId(supplier.id); setPayAmount(''); setPayNotes(''); setShowPayModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-all"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      تسجيل دفعة
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : supplier.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 dark:text-white">{supplier.name}</p>
                    <p className="text-sm text-gray-500">{supplier.address || 'بدون عنوان'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">الدين الحالي</p>
                    <p className={`font-bold text-lg ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(Math.max(0, debt))}</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-right">
                        <p className="text-xs text-gray-400">الدين الافتتاحي</p>
                        <p className="font-bold text-gray-700 dark:text-gray-200">{formatCurrency(supplier.openingDebt)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-right">
                        <p className="text-xs text-gray-400">إجمالي المدفوع</p>
                        <p className="font-bold text-green-600">{formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-right">
                        <p className="text-xs text-gray-400">الدين من المشتريات</p>
                        <p className="font-bold text-red-500">{formatCurrency(purchases.filter(p => p.supplierId === supplier.id).reduce((s, p) => s + p.remainingDebt, 0))}</p>
                      </div>
                    </div>

                    {payments.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">سجل الدفعات:</p>
                        <div className="space-y-1">
                          {payments.map(payment => (
                            <div key={payment.id} className="flex items-center justify-between text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700/20 rounded-lg">
                              <span className="text-gray-500">{payment.notes || '-'}</span>
                              <span className="text-gray-500">{formatDate(payment.date)}</span>
                              <span className="font-bold text-green-600">{formatCurrency(payment.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Supplier Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة مورد جديد" size="md">
        <form onSubmit={handleAddSupplier} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">اسم المورد *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">العنوان</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">تاريخ الدين الافتتاحي</label>
              <input type="date" value={debtDate} onChange={e => setDebtDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">الدين الافتتاحي (اختياري)</label>
              <input type="number" value={openingDebt} onChange={e => setOpeningDebt(e.target.value)} min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">ملاحظات</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} dir="rtl" rows={3} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm resize-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all">
            إضافة المورد
          </button>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="تسجيل دفعة" size="sm">
        <form onSubmit={handlePayment} className="space-y-4">
          <p className="text-right text-sm text-gray-600 dark:text-gray-300">
            المورد: <strong>{suppliers.find(s => s.id === selectedSupplierId)?.name}</strong>
            <br />
            الدين الحالي: <strong className="text-red-600">{formatCurrency(Math.max(0, getSupplierDebt(selectedSupplierId || '')))}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المبلغ المدفوع</label>
            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">ملاحظات</label>
            <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all">
            تأكيد الدفع
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { suppliersService.delete(deleteId); refreshSuppliers(); showToast('تم الحذف', 'success'); setDeleteId(null); } }}
        title="حذف المورد"
        message="هل أنت متأكد من حذف هذا المورد وجميع بياناته؟"
      />
    </div>
  );
}
