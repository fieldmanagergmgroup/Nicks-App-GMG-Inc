
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Site } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { getWeekRange } from '../utils/dateUtils';

interface HoldRequestModalProps {
  site: Site;
  onClose: () => void;
}

const HoldRequestModal: React.FC<HoldRequestModalProps> = ({ site, onClose }) => {
  const { requestSiteHold, user } = useAppContext();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<'1week' | '2weeks' | 'custom'>('1week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Set default dates based on duration
    if (duration !== 'custom') {
      const today = new Date();
      let start: Date;
      
      // Logic: If today is Friday/Weekend, assume "Next Week". Else start "Today" or "Next Monday" based on pref.
      // Prompt said: "1 week starting next week".
      // Let's default "Start" to next Monday to be safe for planning.
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7) || 7);
      start = nextMonday;

      const end = new Date(start);
      if (duration === '1week') {
        end.setDate(start.getDate() + 6); // End of that week (Sunday)
      } else {
        end.setDate(start.getDate() + 13); // End of 2 weeks
      }

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }
    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    await requestSiteHold(site.id, reason.trim(), startDate, endDate);
    setIsSubmitting(false);
    onClose();
  };

  const inputClasses = "mt-1 block w-full rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary sm:text-sm";
  const radioClasses = "focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300";

  return (
    <Modal isOpen={true} onClose={onClose} title={`Put Site On Hold: ${site.clientName}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hold Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputClasses}
            placeholder="e.g. Client requested pause due to renovation."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center">
              <input
                id="1week"
                name="duration"
                type="radio"
                checked={duration === '1week'}
                onChange={() => setDuration('1week')}
                className={radioClasses}
              />
              <label htmlFor="1week" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                1 Week (Starting Next Monday)
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="2weeks"
                name="duration"
                type="radio"
                checked={duration === '2weeks'}
                onChange={() => setDuration('2weeks')}
                className={radioClasses}
              />
              <label htmlFor="2weeks" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                2 Weeks (Starting Next Monday)
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="custom"
                name="duration"
                type="radio"
                checked={duration === 'custom'}
                onChange={() => setDuration('custom')}
                className={radioClasses}
              />
              <label htmlFor="custom" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Date Range
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDuration('custom'); }}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDuration('custom'); }}
              className={inputClasses}
              required
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Site will be removed from active distribution lists during this period. 
                {user?.role !== 'management' && " This request requires management approval."}
            </p>
        </div>

        <div className="flex justify-end pt-2 space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Hold'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default HoldRequestModal;
