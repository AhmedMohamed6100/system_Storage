import { useState } from 'react';
import { Plus, Trash2, Edit3, Key } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { User } from '../types';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const roleLabels: Record<User['role'], string> = {
  viewer: 'مشاهد',
  editor: 'محرر',
  inventory_manager: 'مدير مخزون',
  administrator: 'مدير النظام',
};

const roleColors: Record<User['role'], string> = {
  viewer: 'bg-gray-100 text-gray-700',
  editor: 'bg-blue-100 text-blue-700',
  inventory_manager: 'bg-green-100 text-green-700',
  administrator: 'bg-amber-100 text-amber-700',
};

export default function UsersPage() {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [users, setUsers] = useState(() => authService.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('viewer');
  const [newPassword, setNewPassword] = useState('');

  const refresh = () => setUsers(authService.getUsers());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { showToast('يرجى ملء جميع الحقول', 'error'); return; }
    const exists = users.find(u => u.username === username.trim());
    if (exists) { showToast('اسم المستخدم موجود بالفعل', 'error'); return; }
    authService.addUser({ username: username.trim(), password, role });
    refresh();
    showToast('تم إضافة المستخدم بنجاح', 'success');
    setShowAddModal(false);
    setUsername(''); setPassword(''); setRole('viewer');
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    authService.updateUser(editingUser.id, { role });
    refresh();
    showToast('تم تحديث المستخدم', 'success');
    setShowEditModal(false);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newPassword.trim()) { showToast('يرجى إدخال كلمة المرور الجديدة', 'error'); return; }
    authService.updateUser(editingUser.id, { password: newPassword });
    refresh();
    showToast('تم تغيير كلمة المرور', 'success');
    setShowResetModal(false);
    setNewPassword('');
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setRole(user.role);
    setShowEditModal(true);
  };

  const openReset = (user: User) => {
    setEditingUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <button onClick={() => { setShowAddModal(true); setUsername(''); setPassword(''); setRole('viewer'); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          إضافة مستخدم
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إعدادات المستخدمين</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">#</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">اسم المستخدم</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">الصلاحية</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">تاريخ الإنشاء</th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">خيارات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors ${user.id === currentUser?.id ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                <td className="px-4 py-3.5 text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2 justify-end">
                    {user.id === currentUser?.id && <span className="text-xs bg-[#2d5a8e] text-white px-2 py-0.5 rounded-full">أنت</span>}
                    <span className="font-medium text-gray-800 dark:text-gray-200">{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500">{user.createdAt}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2 justify-end">
                    {user.id !== 'admin-root' && (
                      <button onClick={() => setDeleteId(user.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => openReset(user)} className="p-1.5 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors" title="إعادة تعيين كلمة المرور">
                      <Key className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(user)} className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="تعديل">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة مستخدم جديد" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">اسم المستخدم</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">كلمة المرور</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">الصلاحية</label>
            <select value={role} onChange={e => setRole(e.target.value as User['role'])} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm">
              <option value="viewer">مشاهد</option>
              <option value="editor">محرر</option>
              <option value="inventory_manager">مدير مخزون</option>
              <option value="administrator">مدير النظام</option>
            </select>
          </div>
          <button type="submit" className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all">إضافة المستخدم</button>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="تعديل المستخدم" size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <p className="text-sm text-right text-gray-600 dark:text-gray-300">المستخدم: <strong>{editingUser?.username}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">الصلاحية</label>
            <select value={role} onChange={e => setRole(e.target.value as User['role'])} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm">
              <option value="viewer">مشاهد</option>
              <option value="editor">محرر</option>
              <option value="inventory_manager">مدير مخزون</option>
              <option value="administrator">مدير النظام</option>
            </select>
          </div>
          <button type="submit" className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all">حفظ التغييرات</button>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="إعادة تعيين كلمة المرور" size="sm">
        <form onSubmit={handleReset} className="space-y-4">
          <p className="text-sm text-right text-gray-600 dark:text-gray-300">المستخدم: <strong>{editingUser?.username}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">كلمة المرور الجديدة</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm" />
          </div>
          <button type="submit" className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-all">تغيير كلمة المرور</button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { authService.deleteUser(deleteId); refresh(); showToast('تم حذف المستخدم', 'success'); setDeleteId(null); } }}
        title="حذف المستخدم"
        message="هل أنت متأكد من حذف هذا المستخدم؟"
      />
    </div>
  );
}
