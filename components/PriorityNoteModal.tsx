import React, { useState } from 'react';
import { Site } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './common/Modal';

interface PriorityNoteModalProps {
  site: Site;
  onClose: () => void;
}

const PriorityNoteModal: React.FC<PriorityNoteModalProps> = ({ site, onClose }) => {
  const { updateSite } = useAppContext();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (note.trim()) {
      setIsSubmitting(true);
      await updateSite(site.id, { isPriority: true, priorityNote: note.trim() });
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Set Priority for ${site.clientName}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please provide a reason for marking this site as a priority. This note will be visible to the assigned consultant.
        </p>
        <div>
          <label htmlFor="priorityNote" className="sr-only">
            Priority Reason
          </label>
          <textarea
            id="priorityNote"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="block w-full sm:text-sm rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-brand-primary focus:border-brand-primary"
            placeholder="e.g., Urgent meeting Monday at 7 AM, Critical safety issue requires immediate follow-up, etc."
            autoFocus
          />
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
            type="button"
            onClick={handleSave}
            disabled={!note.trim() || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Priority'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PriorityNoteModal;