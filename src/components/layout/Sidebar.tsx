import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Layers, Scale, Package, FileText, ShoppingCart,
  History, ArrowLeftRight, Users, Receipt, BarChart3, Settings, LogOut, Box
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'الأقسام', path: '/categories', icon: <Layers className="w-5 h-5" /> },
  { label: 'وحدات القياس', path: '/units', icon: <Scale className="w-5 h-5" /> },
  { label: 'المستودع (المخزن)', path: '/warehouse', icon: <Package className="w-5 h-5" /> },
  { label: 'إجمالي الفواتير', path: '/invoices', icon: <FileText className="w-5 h-5" /> },
  { label: 'المشتريات (فواتير)', path: '/purchases', icon: <ShoppingCart className="w-5 h-5" /> },
  { label: 'سجل الحركات', path: '/movements', icon: <History className="w-5 h-5" /> },
  { label: 'الحوالات والكاش', path: '/transfers', icon: <ArrowLeftRight className="w-5 h-5" /> },
  { label: 'الموردين والديون', path: '/suppliers', icon: <Users className="w-5 h-5" /> },
  { label: 'المصاريف العامة', path: '/expenses', icon: <Receipt className="w-5 h-5" /> },
  { label: 'التقارير المالية', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'إعدادات المستخدمين', path: '/users', icon: <Settings className="w-5 h-5" /> },
];

export default function Sidebar() {
  const { logout, currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('تم تسجيل الخروج بنجاح', 'info');
    navigate('/login');
  };

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-[#1e3a5f] dark:bg-gray-900 flex flex-col z-40 shadow-2xl">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div className="text-left">
          <p className="text-xs text-gray-400">النظام المحاسبي</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">A-E STORAGE</span>
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-white/15 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="text-right flex-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-right mb-3">
          <p className="text-xs text-gray-400">المستخدم:</p>
          <p className="text-sm font-bold text-white">{currentUser?.username || 'Admin'}</p>
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
            {currentUser?.role === 'administrator' ? 'Admin' :
             currentUser?.role === 'editor' ? 'محرر' :
             currentUser?.role === 'viewer' ? 'مشاهد' : 'مدير مخزون'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
