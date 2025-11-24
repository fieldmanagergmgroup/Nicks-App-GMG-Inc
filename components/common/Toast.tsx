
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { CheckCircleIcon, XCircleIcon, ArrowUturnLeftIcon } from '../icons';

export const ToastContainer: React.FC = () => {
  const { toasts, setPendingNavigation } = useAppContext();

  const handleToastClick = (navTarget?: any) => {
      if (navTarget) {
          setPendingNavigation(navTarget);
      }
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-3 w-80">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => handleToastClick(toast.navTarget)}
          className={`flex items-start p-4 rounded-lg shadow-lg text-white transition-transform transform hover:scale-102 ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-red-600'
          } ${toast.navTarget ? 'cursor-pointer hover:brightness-110' : ''}`}
          role="alert"
        >
          <div className="flex-shrink-0">
            {toast.type === 'success' ? (
              <CheckCircleIcon className="w-6 h-6" />
            ) : (
              <XCircleIcon className="w-6 h-6" />
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
            {toast.navTarget && (
                <div className="mt-2 flex items-center text-xs font-semibold uppercase tracking-wide opacity-80">
                    <ArrowUturnLeftIcon className="w-3 h-3 mr-1" /> Click to view
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
