import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error';
  message: string;
}

export default function Toast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);

  useEffect(() => {
    const handleShowToast = (event: CustomEvent<ToastProps>) => {
      const id = Date.now();
      setToasts(prev => [...prev, { ...event.detail, id }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    window.addEventListener('showToast' as any, handleShowToast);
    return () => window.removeEventListener('showToast' as any, handleShowToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
