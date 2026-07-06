import { useState } from 'react';
import { Scale, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { unitsService } from '../services/unitsService';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function UnitsPage() {
  const { units, refreshUnits, products } = useApp();
  const { showToast } = useToast();
  const [newName, setNewName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    unitsService.add(newName.trim());
    refreshUnits();
    showToast(`تم إضافة الوحدة "${newName}" بنجاح`, 'success');
    setNewName('');
  };

  const handleDelete = (id: string) => {
    const inUse = products.some(p => p.unitId === id);
    if (inUse) {
      showToast('لا يمكن حذف وحدة مرتبطة بمواد', 'error');
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    unitsService.delete(deleteId);
    refreshUnits();
    showToast('تم حذف الوحدة بنجاح', 'success');
    setDeleteId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="text-right mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">وحدات القياس</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة وحدات تعبئة وقياس المواد في المستودع</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">اسم الوحدة</th>
                  <th className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">عدد المواد المرتبطة</th>
                  <th className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">خيارات</th>
                </tr>
              </thead>
              <tbody>
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-400">لا توجد وحدات بعد</td>
                  </tr>
                ) : (
                  units.map(unit => (
                    <tr key={unit.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-gray-200">{unit.name}</td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                        {products.filter(p => p.unitId === unit.id).length}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4 text-right flex items-center justify-end gap-2">
            <Scale className="w-5 h-5 text-amber-500" />
            إضافة وحدة جديدة
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">اسم الوحدة</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="مثال: كرتونة، كجم"
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-right bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] focus:ring-2 focus:ring-[#2d5a8e]/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              إضافة الوحدة
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="حذف الوحدة"
        message="هل أنت متأكد من حذف هذه الوحدة؟"
      />
    </div>
  );
}
