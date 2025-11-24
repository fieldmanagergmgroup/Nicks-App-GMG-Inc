
import React from 'react';
import Modal from './common/Modal';
import { ShieldExclamationIcon } from './icons';

interface EarlyVisitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  siteName: string;
}

const EarlyVisitConfirmationModal: React.FC<EarlyVisitConfirmationModalProps> = ({ isOpen, onClose, onConfirm, siteName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Early Visit" zIndexClass="z-[60]">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 sm:mx-0 sm:h-10 sm:w-10">
          <ShieldExclamationIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-300" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            The last visit to <strong className="font-semibold text-gray-800 dark:text-gray-100">{siteName}</strong> was on Friday.
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to schedule another visit for this Monday? This is sooner than the typical weekly cadence.
          </p>
        </div>
      </div>
      <div className="flex justify-end pt-5 mt-5 space-x-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
        >
          Confirm Visit
        </button>
      </div>
    </Modal>
  );
};

export default EarlyVisitConfirmationModal;
