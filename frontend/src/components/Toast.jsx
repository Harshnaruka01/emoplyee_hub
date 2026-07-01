import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: 'bg-slate-900/95 border-emerald-500/50 text-emerald-100 shadow-emerald-950/20',
    error: 'bg-slate-900/95 border-rose-500/50 text-rose-100 shadow-rose-950/20',
    warning: 'bg-slate-900/95 border-amber-500/50 text-amber-100 shadow-amber-950/20',
    info: 'bg-slate-900/95 border-sky-500/50 text-sky-100 shadow-sky-950/20'
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-400 shrink-0" />
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 scale-100 ${typeStyles[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors ml-2 shrink-0">
        <X className="h-4 w-4 text-slate-400 hover:text-slate-200" />
      </button>
    </div>
  );
};
export default Toast;
