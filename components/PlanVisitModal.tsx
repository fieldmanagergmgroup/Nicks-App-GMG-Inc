
import React from 'react';
import Modal from './common/Modal';
import { Weekday } from '../types';
import { ArrowUturnLeftIcon } from './icons';

type PlanLocation = Weekday | 'todo';
const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface PlanVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlan: (day: PlanLocation) => void;
  siteName: string;
  currentLocation: PlanLocation;
}

const PlanVisitModal: React.FC<PlanVisitModalProps> = ({ isOpen, onClose, onPlan, siteName, currentLocation }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Plan Visit for: ${siteName}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a day to schedule this visit.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {WEEKDAYS.map(day => (
            <button
              key={day}
              onClick={() => onPlan(day)}
              disabled={currentLocation === day}
              className="w-full px-4 py-3 text-lg font-semibold text-center text-white transition-colors duration-200 rounded-md bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {day}
            </button>
          ))}
        </div>
        {currentLocation !== 'todo' && (
          <>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="flex-shrink px-2 text-sm text-gray-500 bg-white dark:bg-gray-800">Or</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <button
              onClick={() => onPlan('todo')}
              className="flex items-center justify-center w-full px-4 py-3 text-lg font-semibold text-center text-red-700 transition-colors duration-200 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
            >
              <ArrowUturnLeftIcon className="w-6 h-6 mr-2" />
              Unplan Visit
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PlanVisitModal;
