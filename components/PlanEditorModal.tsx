
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Site, WeeklyPlanState, WeeklyPlan } from '../types';
import Modal from './common/Modal';
import { isSiteDue } from '../utils/scheduling';
import { TrashIcon, StarIcon } from './icons';

const PlanEditorModal: React.FC = () => {
    const { users, sites, draftWeeklyPlans, confirmDraftPlans, clearDraftPlans } = useAppContext();
    const [editedPlans, setEditedPlans] = useState<WeeklyPlanState>({});

    useEffect(() => {
        // Deep copy the draft plans into local state for editing
        if (draftWeeklyPlans) {
            setEditedPlans(JSON.parse(JSON.stringify(draftWeeklyPlans)));
        }
    }, [draftWeeklyPlans]);

    const consultants = useMemo(() => users.filter(u => u.role === 'consultant'), [users]);

    const unassignedDueSites = useMemo(() => {
        if (!editedPlans || Object.keys(editedPlans).length === 0) return [];
        const allAssignedSiteIds = new Set(Object.values(editedPlans).flatMap((plan: WeeklyPlan) => plan.todo.map(site => site.id)));
        return sites.filter(site => isSiteDue(site) && !allAssignedSiteIds.has(site.id));
    }, [sites, editedPlans]);

    const moveSite = (site: Site, fromConsultantId: number | 'unassigned', toConsultantId: number | 'unassigned') => {
        if (fromConsultantId === toConsultantId) return;

        setEditedPlans(currentPlans => {
            const newPlans = JSON.parse(JSON.stringify(currentPlans));
            
            // Remove from source
            if (fromConsultantId !== 'unassigned') {
                const sourcePlan = newPlans[fromConsultantId];
                if (sourcePlan) {
                    sourcePlan.todo = sourcePlan.todo.filter((s: Site) => s.id !== site.id);
                }
            }
            
            // Add to destination
            if (toConsultantId !== 'unassigned') {
                 const destPlan = newPlans[toConsultantId];
                if (destPlan) {
                    destPlan.todo.unshift(site);
                }
            }
            return newPlans;
        });
    };
    
    const handleConfirm = () => {
        confirmDraftPlans(editedPlans);
    };
    
    const formatDisplayAddress = (site: Site) => {
        const address = site.address || '';
        const city = site.city || '';
        // If city is empty or address already contains city (ignoring case), just return address
        if (!city || address.toLowerCase().includes(city.toLowerCase())) {
            return address;
        }
        return `${address}, ${city}`;
    };

    if (!draftWeeklyPlans) return null;

    return (
        <Modal isOpen={true} onClose={clearDraftPlans} title="Review & Edit Weekly Plan Draft">
            <div className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    The AI has generated the following distribution for next week. Review the lists and make any manual adjustments by moving sites before confirming.
                </p>

                <div className="space-y-6">
                    {/* Consultants Columns */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Consultant Lists</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {consultants.map(consultant => (
                                <div key={consultant.id} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{consultant.name} ({editedPlans[consultant.id]?.todo.length || 0} sites)</h3>
                                    <ul className="mt-2 space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                                        {editedPlans[consultant.id]?.todo.map(site => (
                                            <li key={site.id} className="p-2 bg-white rounded-md dark:bg-gray-700">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start flex-1 min-w-0">
                                                        {site.isPriority && <StarIcon className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />}
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{site.clientName}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate" title={formatDisplayAddress(site)}>
                                                                {formatDisplayAddress(site)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => moveSite(site, consultant.id, 'unassigned')} className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0" title="Remove from list">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {site.isPriority && site.priorityNote && (
                                                    <p className="mt-1 text-xs italic text-red-600 dark:text-red-400">{site.priorityNote}</p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Unassigned Sites Column */}
                    <div className="p-3 bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
                         <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Unassigned Due Sites ({unassignedDueSites.length})</h3>
                         <ul className="mt-2 space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                             {unassignedDueSites.map(site => (
                                <li key={site.id} className="p-2 bg-white rounded-md dark:bg-gray-700">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start flex-1 min-w-0">
                                            {site.isPriority && <StarIcon className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />}
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{site.clientName}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate" title={formatDisplayAddress(site)}>
                                                    {formatDisplayAddress(site)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-shrink-0 mt-2 space-x-2 sm:mt-0 sm:ml-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Add to:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {consultants.map(c => (
                                                    <button key={c.id} onClick={() => moveSite(site, 'unassigned', c.id)} className="px-2 py-1 text-xs font-medium text-white rounded bg-brand-primary hover:bg-brand-secondary" title={`Assign to ${c.name}`}>
                                                        {c.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {site.isPriority && site.priorityNote && (
                                        <p className="mt-1 text-xs italic text-red-600 dark:text-red-400">{site.priorityNote}</p>
                                    )}
                                </li>
                             ))}
                             {unassignedDueSites.length === 0 && <p className="italic text-center text-gray-500 dark:text-gray-400">All due sites have been assigned.</p>}
                         </ul>
                    </div>
                </div>

                <div className="flex justify-end pt-4 space-x-4">
                    <button type="button" onClick={clearDraftPlans} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        Discard Draft
                    </button>
                    <button type="button" onClick={handleConfirm} className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary">
                        Confirm & Distribute
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PlanEditorModal;
