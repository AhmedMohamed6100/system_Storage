import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
  success: 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20',
  error: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20',
  warning: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  info: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 no-print" style={{ maxWidth: '360px' }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${styles[toast.type]} dark:text-white`}
        >
          {icons[toast.type]}
          <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
