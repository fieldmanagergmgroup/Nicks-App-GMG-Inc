import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './common/Modal';

interface LogComplaintModalProps {
  onClose: () => void;
}

const LogComplaintModal: React.FC<LogComplaintModalProps> = ({ onClose }) => {
  const { users, sites, addComplaint } = useAppContext();
  const [userId, setUserId] = useState<string>('');
  const [siteId, setSiteId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const consultants = users.filter(u => u.role === 'consultant');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !notes.trim()) {
      setError('Consultant and complaint details are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    await addComplaint(
        parseInt(userId), 
        notes.trim(), 
        siteId ? parseInt(siteId) : undefined
    );
    setIsSubmitting(false);
    onClose();
  };

  const inputClasses = "mt-1 block w-full rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-brand-primary focus:border-brand-primary";

  return (
    <Modal isOpen={true} onClose={onClose} title="Log New Complaint">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="consultantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Consultant
          </label>
          <select
            id="consultantId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={`${inputClasses} ${error && !userId ? 'border-red-500' : ''}`}
            required
          >
            <option value="" disabled>-- Select a Consultant --</option>
            {consultants.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="siteId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Related Site (Optional)
          </label>
          <select
            id="siteId"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className={inputClasses}
          >
            <option value="">-- No specific site --</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.clientName} - {s.address}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Complaint Details
          </label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputClasses} ${error && !notes.trim() ? 'border-red-500' : ''}`}
            placeholder="Describe the incident, including date, time, and client feedback..."
            required
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end pt-2 space-x-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Complaint'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LogComplaintModal;