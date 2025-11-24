
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Site, DeliveredItems } from '../types';
import useDebounce from '../hooks/useDebounce';
import EmptyState from './common/EmptyState';
import { ShieldCheckIcon } from './icons';

const itemKeyToLabel = (key: string): string => {
    const labels: Record<string, string> = {
        greenBooks: 'Green Books',
        safetyBoard: 'Safety Board',
        fireExtinguisher: 'Fire Extinguisher',
        eyeWashStation: 'Eye Wash Station',
        firstAidKitSmall: 'First Aid Kit (Small)',
        firstAidKitLarge: 'First Aid Kit (Large)',
        inspectionTags: 'Inspection Tags',
        specificProcedure: 'Specific Procedure',
    };
    return labels[key] || key;
};

const allItemKeys: (keyof DeliveredItems)[] = [
    'greenBooks', 'safetyBoard', 'fireExtinguisher', 'eyeWashStation', 
    'firstAidKitSmall', 'firstAidKitLarge', 'inspectionTags', 'specificProcedure'
];

const SafetyEquipmentView: React.FC = () => {
    const { sites, reports, users } = useAppContext();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterItem, setFilterItem] = useState<string>('all');
    const [filterConsultant, setFilterConsultant] = useState<string>('all');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const consultants = useMemo(() => users.filter(u => u.role === 'consultant'), [users]);

    const sitesWithEquipment = useMemo(() => {
        const siteEquipmentMap: Map<number, { site: Site, totalItems: DeliveredItems }> = new Map();

        reports.forEach(report => {
            if (report.deliveredItems && Object.keys(report.deliveredItems).length > 0) {
                const existingEntry = siteEquipmentMap.get(report.siteId);
                const site = sites.find(s => s.id === report.siteId);
                if (!site) return;

                if (existingEntry) {
                    // Aggregate items
                    for (const [key, value] of Object.entries(report.deliveredItems) as [keyof DeliveredItems, number][]) {
                        existingEntry.totalItems[key] = (existingEntry.totalItems[key] || 0) + value;
                    }
                } else {
                    // Create new entry
                    siteEquipmentMap.set(site.id, { site, totalItems: { ...report.deliveredItems } });
                }
            }
        });

        return Array.from(siteEquipmentMap.values());
    }, [sites, reports]);

    const filteredSites = useMemo(() => {
        return sitesWithEquipment
            .filter(({ site, totalItems }) => {
                const searchMatch = debouncedSearchQuery
                    ? site.clientName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                      site.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
                    : true;
                
                const itemMatch = filterItem === 'all' ? true : totalItems[filterItem as keyof DeliveredItems];

                const consultantMatch = filterConsultant === 'all' ? true : site.assignedConsultantId === parseInt(filterConsultant);

                return searchMatch && itemMatch && consultantMatch;
            })
            .sort((a, b) => a.site.clientName.localeCompare(b.site.clientName));
    }, [sitesWithEquipment, debouncedSearchQuery, filterItem, filterConsultant]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Safety Equipment Tracking</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    View an aggregated list of all safety items delivered to sites. Sites with a safety board are highlighted for billing purposes.
                </p>
            </div>

            <div className="p-4 space-y-4 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filters</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <input
                        type="text"
                        placeholder="Search client or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm sm:col-span-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <select value={filterItem} onChange={e => setFilterItem(e.target.value)} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                        <option value="all">Any Delivered Item</option>
                        {allItemKeys.map(key => <option key={key} value={key}>{itemKeyToLabel(key)}</option>)}
                    </select>
                    <select value={filterConsultant} onChange={e => setFilterConsultant(e.target.value)} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                        <option value="all">All Consultants</option>
                        {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {filteredSites.length > 0 ? (
                <div className="space-y-4">
                    {filteredSites.map(({ site, totalItems }) => (
                        <div
                            key={site.id}
                            className={`p-4 rounded-lg shadow dark:border ${totalItems.safetyBoard ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-500/30' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="flex items-center text-lg font-bold text-gray-800 dark:text-gray-100">
                                        {totalItems.safetyBoard && <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-600" />}
                                        {site.clientName}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{site.address}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Consultant: {users.find(u => u.id === site.assignedConsultantId)?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t dark:border-gray-600">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Items Delivered:</h4>
                                <ul className="grid grid-cols-2 mt-2 text-sm list-disc list-inside sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 text-gray-600 dark:text-gray-400">
                                    {(Object.entries(totalItems) as [keyof DeliveredItems, number][]).map(([key, value]) => (
                                        <li key={key}>
                                            {itemKeyToLabel(key)}: <span className="font-bold text-gray-800 dark:text-gray-200">{value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    Icon={ShieldCheckIcon}
                    title="No Equipment Data Found"
                    message="No sites match the current filters, or no equipment has been delivered yet."
                />
            )}
        </div>
    );
};

export default SafetyEquipmentView;
