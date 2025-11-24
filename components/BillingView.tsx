
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Site, Report, BillingStatus } from '../types';
import { ChevronDownIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, OfficeBuildingIcon, LocationMarkerIcon, CreditCardIcon } from './icons';
import EmptyState from './common/EmptyState';
import { formatDateString } from '../utils/formatDate';
import ReportPrintModal from './ReportPrintModal';

// --- Sub-Components ---

const BillingToggle: React.FC<{ site: Site }> = ({ site }) => {
    const { updateSiteBillingStatus, user } = useAppContext();
    const isProcessed = site.billingStatus === 'processed';

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus: BillingStatus = isProcessed ? 'not_processed' : 'processed';
        await updateSiteBillingStatus(site.id, newStatus);
    };

    return (
        <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isProcessed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                {isProcessed ? 'Processed' : 'Not Processed'}
            </span>
            <button 
                onClick={handleToggle}
                className={`px-3 py-1 text-xs font-semibold rounded border shadow-sm transition-colors ${isProcessed ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600' : 'bg-green-600 text-white border-transparent hover:bg-green-700'}`}
            >
                {isProcessed ? 'Mark Unprocessed' : 'Mark Processed'}
            </button>
        </div>
    );
};

const SiteBillingRow: React.FC<{ site: Site }> = ({ site }) => {
    const { reports, users } = useAppContext();
    const [isExpanded, setIsExpanded] = useState(false);
    const [printReport, setPrintReport] = useState<Report | null>(null);

    const siteReports = useMemo(() => {
        return reports.filter(r => r.siteId === site.id).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
    }, [reports, site.id]);

    const lastUpdateUser = useMemo(() => {
        if (site.billingStatusUpdatedBy) {
            return users.find(u => u.id === site.billingStatusUpdatedBy)?.name;
        }
        return null;
    }, [site.billingStatusUpdatedBy, users]);

    return (
        <div className="border-b last:border-b-0 border-gray-100 dark:border-gray-700">
            {printReport && (
                <ReportPrintModal 
                    report={printReport} 
                    site={site} 
                    consultant={users.find(u => u.id === printReport.consultantId)}
                    onClose={() => setPrintReport(null)} 
                />
            )}
            
            {/* Site Header Row */}
            <div 
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-gray-800'}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start sm:items-center space-x-3 flex-1">
                    <div className="mt-1 sm:mt-0 p-1.5 bg-gray-100 rounded dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        <LocationMarkerIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-white">{site.address}</h4>
                        {site.city && <p className="text-xs text-gray-500 dark:text-gray-400">{site.city}</p>}
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end mt-3 sm:mt-0 w-full sm:w-auto space-x-4">
                    <BillingToggle site={site} />
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
                    {/* Status Metadata */}
                    <div className="py-2 text-xs text-gray-500 dark:text-gray-400 italic text-right">
                        {site.billingStatus === 'processed' && lastUpdateUser && (
                            <span>Processed by {lastUpdateUser} on {new Date(site.billingStatusUpdatedAt!).toLocaleDateString()}</span>
                        )}
                    </div>

                    {/* Reports List */}
                    <h5 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Submitted Reports</h5>
                    {siteReports.length > 0 ? (
                        <div className="space-y-2">
                            {siteReports.map(report => {
                                const consultant = users.find(u => u.id === report.consultantId);
                                return (
                                    <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border rounded-md dark:bg-gray-800 dark:border-gray-600">
                                        <div className="flex items-start space-x-3 mb-2 sm:mb-0">
                                            <DocumentTextIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                    {report.status} <span className="text-xs font-normal text-gray-500">({formatDateString(report.visitDate)})</span>
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    By: {consultant?.name || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setPrintReport(report); }}
                                            className="text-xs font-medium text-brand-primary hover:text-brand-secondary bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded transition-colors"
                                        >
                                            View / Print
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic p-2">No reports submitted for this site location.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const ClientGroup: React.FC<{ clientName: string; sites: Site[] }> = ({ clientName, sites }) => {
    const [isExpanded, setIsExpanded] = useState(true); // Default expanded for visibility

    // Derived billing stats for this client
    const processedCount = sites.filter(s => s.billingStatus === 'processed').length;
    const allProcessed = processedCount === sites.length && sites.length > 0;

    return (
        <div className="mb-4 border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
            <div 
                className="flex items-center justify-between p-4 bg-gray-100 border-b cursor-pointer dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    <OfficeBuildingIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{clientName}</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full dark:bg-gray-700 dark:text-gray-300">
                        {sites.length} Site{sites.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    {allProcessed ? (
                        <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="w-4 h-4 mr-1" /> All Processed
                        </span>
                    ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline-block">
                            {processedCount} / {sites.length} Processed
                        </span>
                    )}
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>
            
            {isExpanded && (
                <div>
                    {sites.sort((a,b) => a.address.localeCompare(b.address)).map(site => (
                        <SiteBillingRow key={site.id} site={site} />
                    ))}
                </div>
            )}
        </div>
    );
};

const BillingView: React.FC = () => {
    const { sites } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [showProcessed, setShowProcessed] = useState(true);
    const [showUnprocessed, setShowUnprocessed] = useState(true);

    // 1. Group Sites by Client automatically
    const groupedClients = useMemo(() => {
        const groups: Record<string, Site[]> = {};
        const q = searchQuery.toLowerCase();
        
        // Filter first
        const filteredSites = sites.filter(s => {
            if (s.status === 'Completed') return false;

            // Status Check
            const isProcessed = s.billingStatus === 'processed';
            if (isProcessed && !showProcessed) return false;
            if (!isProcessed && !showUnprocessed) return false;

            // Text Search
            if (q === '') return true;
            return (
                s.clientName.toLowerCase().includes(q) || 
                s.address.toLowerCase().includes(q)
            );
        });

        filteredSites.forEach(site => {
            if (!groups[site.clientName]) groups[site.clientName] = [];
            groups[site.clientName].push(site);
        });

        // Sort Clients A-Z
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [sites, searchQuery, showProcessed, showUnprocessed]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Billing Management</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Process sites for billing and view report history. List auto-syncs with Site Management.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-2 rounded-md border dark:border-gray-700">
                        <label className="inline-flex items-center">
                            <input type="checkbox" className="form-checkbox text-brand-primary h-4 w-4" checked={showUnprocessed} onChange={e => setShowUnprocessed(e.target.checked)} />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Unprocessed</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input type="checkbox" className="form-checkbox text-green-600 h-4 w-4" checked={showProcessed} onChange={e => setShowProcessed(e.target.checked)} />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Processed</span>
                        </label>
                    </div>
                    <div className="w-full sm:w-64">
                        <input 
                            type="text" 
                            placeholder="Search Client or Address..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                </div>
            </div>

            {groupedClients.length > 0 ? (
                <div className="space-y-4">
                    {groupedClients.map(([clientName, clientSites]) => (
                        <ClientGroup key={clientName} clientName={clientName} sites={clientSites} />
                    ))}
                </div>
            ) : (
                <EmptyState 
                    Icon={CreditCardIcon} 
                    title="No Billing Records Found" 
                    message={sites.length === 0 ? "No sites available in the system." : "No clients match your search or filters."} 
                />
            )}
        </div>
    );
};

export default BillingView;
