import { Sun, Moon, Save, RefreshCw } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useApp } from "../../contexts/AppContext";
import { useToast } from "../../contexts/ToastContext";

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { refreshAll } = useApp();
  const { showToast } = useToast();

  const handleSave = () => {
    showToast("تم حفظ البيانات بنجاح", "success");
  };

  const handleRefresh = () => {
    refreshAll();
    showToast("تم تحديث البيانات", "info");
  };

  return (
    <header className="fixed top-0 left-0 right-64 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-30 shadow-sm">
      <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
        <span className="font-bold text-gray-800 dark:text-white">
          نظام إدارة المستودعات
        </span>

        <span className="mx-2 text-gray-300">|</span>

        <span className="text-xs text-gray-500">
          المطور:
          <span className="text-primary-600 font-bold ml-1">
            {" "}
            Ahmed Mohamed
          </span>
          <span className="mx-1">-</span>
          <span>01070495013</span>
          <span className="mx-3 text-gray-300">|</span>
          <span className="text-primary-600 font-bold">Abdallah Elshemy</span>
          <span className="mx-1">-</span>
          <span>01102346158</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="تحديث البيانات"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="تبديل الثيم"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-yellow-500" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#163050] transition-colors"
        >
          <Save className="w-4 h-4" />
          حفظ البيانات
        </button>
      </div>
    </header>
  );
}
