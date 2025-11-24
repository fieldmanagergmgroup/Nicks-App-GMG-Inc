
import React, { useState } from 'react';
import { Procedure, Site, ProcedureType } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './common/Modal';

interface ProcedureEditModalProps {
  procedure?: Procedure;
  onClose: () => void;
}

const ProcedureEditModal: React.FC<ProcedureEditModalProps> = ({ procedure, onClose }) => {
  const { sites, addProcedure, updateProcedure } = useAppContext();
  const [description, setDescription] = useState(procedure?.description || '');
  const [status, setStatus] = useState<'Ongoing' | 'Completed'>(procedure?.status || 'Ongoing');
  const [siteId, setSiteId] = useState<number | undefined>(procedure?.siteId);
  const [type, setType] = useState<ProcedureType>(procedure?.type || 'SWP');

  const isEditing = !!procedure;
  const formElementClasses = "mt-1 block w-full rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-brand-primary focus:border-brand-primary";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !siteId) {
        alert("Please provide a description and select a site.");
        return;
    }
    
    const procedureData = { description, status, siteId, type };

    if (isEditing) {
      updateProcedure(procedure.id, procedureData);
    } else {
      addProcedure(procedureData);
    }
    onClose();
  };
  
  const title = isEditing ? 'Edit Procedure' : 'Add New Procedure';

  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manually create or update an SWP/JHA entry.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
                <label htmlFor="siteId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Site</label>
                <select 
                    id="siteId" 
                    value={siteId || ''}
                    onChange={(e) => setSiteId(parseInt(e.target.value, 10))}
                    className={formElementClasses}
                    required
                >
                    <option value="" disabled>-- Select a site --</option>
                    {sites.map(s => (
                        <option key={s.id} value={s.id}>{s.clientName} - {s.address}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Procedure Type</label>
                <select id="type" value={type} onChange={e => setType(e.target.value as ProcedureType)} className={formElementClasses}>
                    <option value="SWP">Safework Procedure (SWP)</option>
                    <option value="JHA">Job Hazard Analysis (JHA)</option>
                </select>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className={formElementClasses}
                    placeholder="e.g., New Job Hazard Analysis for crane operation."
                    required
                ></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <div className="flex flex-wrap mt-2 gap-x-4 gap-y-2">
                    <label className="flex items-center">
                        <input type="radio" name="proc-status" value="Ongoing" checked={status === 'Ongoing'} onChange={() => setStatus('Ongoing')} className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500" />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Ongoing</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="proc-status" value="Completed" checked={status === 'Completed'} onChange={() => setStatus('Completed')} className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500" />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Completed</span>
                    </label>
                </div>
            </div>
            <div className="flex justify-end pt-4 space-x-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                Cancel
                </button>
                <button 
                    type="submit" 
                    className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
                >
                {isEditing ? 'Save Changes' : 'Add Procedure'}
                </button>
            </div>
        </form>
    </Modal>
  );
};

export default ProcedureEditModal;
