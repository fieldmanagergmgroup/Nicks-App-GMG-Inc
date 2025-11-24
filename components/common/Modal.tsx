
import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  zIndexClass?: string;
  maxWidthClass?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, zIndexClass = 'z-50', maxWidthClass = 'max-w-2xl' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 bg-black bg-opacity-60`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidthClass} mx-auto bg-white rounded-lg shadow-xl dark:bg-gray-800 max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between p-4 border-b sm:p-5 dark:border-gray-700">
           <h2 id="modal-title" className="text-xl font-bold text-brand-secondary dark:text-gray-100">{title}</h2>
            <button
                onClick={onClose}
                className="p-1 -m-1 text-gray-400 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                aria-label="Close modal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">
             {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
