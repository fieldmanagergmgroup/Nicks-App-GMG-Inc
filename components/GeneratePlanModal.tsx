
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { User, PlanGenerationOptions, VisitFrequency } from '../types';
import { SparklesIcon, UserGroupIcon, FunnelIcon } from './icons';
import { useAppContext } from '../hooks/useAppContext';

interface GeneratePlanModalProps {
  onClose: () => void;
  onGenerate: (options: PlanGenerationOptions) => void;
  users: User[];
}

const GeneratePlanModal: React.FC<GeneratePlanModalProps> = ({ onClose, onGenerate, users }) => {
  const { sites } = useAppContext();
  
  const consultants = useMemo(() => 
    users.filter(u => u.role === 'consultant'), 
  [users]);

  const cities = useMemo(() => Array.from(new Set(sites.map(s => s.city).filter(Boolean))).sort(), [sites]);

  // State for Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(consultants.map(u => u.id)));
  
  // State for Configuration
  const [includeUnassigned, setIncludeUnassigned] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<VisitFrequency | 'all'>('all');
  const [maxSitesPerUser, setMaxSitesPerUser] = useState<number>(20);

  const toggleSelectAll = () => {
    if (selectedIds.size === consultants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(consultants.map(u => u.id)));
    }
  };

  const toggleUser = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleGenerate = () => {
    onGenerate({
        targetUserIds: Array.from(selectedIds),
        includeUnassigned,
        cityFilter,
        frequencyFilter,
        maxSitesPerUser
    });
    onClose();
  };

  const selectClasses = "block w-full py-2 pl-3 pr-10 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm";

  return (
    <Modal isOpen={true} onClose={onClose} title="Advanced Automated Planning" maxWidthClass="max-w-4xl">
      <div className="flex flex-col h-full max-h-[80vh]">
        
        {/* Header / Toolbar - Filters */}
        <div className="flex flex-col gap-4 p-4 bg-gray-50 border-b dark:bg-gray-800 dark:border-gray-700 sm:flex-row sm:items-end">
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Filter by City</label>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className={selectClasses}>
                    <option value="all">All Cities / Regions</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Filter by Frequency</label>
                <select value={frequencyFilter} onChange={e => setFrequencyFilter(e.target.value as VisitFrequency | 'all')} className={selectClasses}>
                    <option value="all">All Frequencies</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Shop Audit">Shop Audit</option>
                </select>
            </div>
        </div>

        {/* Main Content - Split View */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            {/* LEFT: Configuration / Source */}
            <div className="w-full md:w-1/3 bg-white dark:bg-gray-900 p-4 border-r dark:border-gray-700 overflow-y-auto">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <FunnelIcon className="w-5 h-5 mr-2 text-brand-primary" />
                    Source & Limits
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                            <input 
                                type="checkbox" 
                                className="mt-1 w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                checked={includeUnassigned}
                                onChange={e => setIncludeUnassigned(e.target.checked)}
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Include Unassigned Pool</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Automatically distribute unassigned sites matching the filters to the selected team members.
                                </span>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Visits per Consultant</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="100" 
                            value={maxSitesPerUser} 
                            onChange={e => setMaxSitesPerUser(parseInt(e.target.value))}
                            className="block w-full p-2 border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Prevents overloading any single individual during auto-distribution.</p>
                    </div>
                </div>
            </div>

            {/* RIGHT: Team Selection */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center">
                        <UserGroupIcon className="w-5 h-5 mr-2 text-brand-primary" />
                        Target Team ({selectedIds.size})
                    </h3>
                    <button onClick={toggleSelectAll} className="text-xs font-medium text-brand-primary hover:text-brand-secondary">
                        {selectedIds.size === consultants.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {consultants.map(user => (
                        <label key={user.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedIds.has(user.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-brand-primary shadow-sm ring-1 ring-brand-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-primary/50'}`}>
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary mr-3"
                                checked={selectedIds.has(user.id)}
                                onChange={() => toggleUser(user.id)}
                            />
                            <div>
                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-white border-t dark:bg-gray-900 dark:border-gray-700">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                Cancel
            </button>
            <button 
                onClick={handleGenerate} 
                disabled={selectedIds.size === 0}
                className="flex items-center px-6 py-2 text-sm font-bold text-white rounded-md shadow-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Draft Plan
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default GeneratePlanModal;
