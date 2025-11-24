
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Site, SiteStatus, VisitFrequency, Report } from '../types';
import SiteCard from './SiteCard';
import { FunnelIcon, PlusCircleIcon, UploadIcon, DocumentDownloadIcon, DocumentWordIcon, RefreshIcon, SparklesIcon, UserGroupIcon, ListIcon, ViewBoardsIcon } from './icons';
import ImportSitesModal from './ImportSitesModal';
import GeneratePlanModal from './GeneratePlanModal';
import PlanEditorModal from './PlanEditorModal';
import SiteDistributionModal from './SiteDistributionModal';
import { exportSitesToCSV } from '../utils/csvExport';
import { exportSitesToWord } from '../utils/wordExport';
import EmptyState from './common/EmptyState';
import { formatDateString } from '../utils/formatDate';
import ReportPrintModal from './ReportPrintModal';

interface AllSitesViewProps {
    onEditSite: (site: Site | 'new') => void;
    onSetPriority: (site: Site) => void;
}

const AllSitesView: React.FC<AllSitesViewProps> = ({ onEditSite, onSetPriority }) => {
    const { sites, users, updateSite, generateNextWeeksPlans, reports } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterConsultant, setFilterConsultant] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<SiteStatus | 'all'>('Active');
    const [filterFrequency, setFilterFrequency] = useState<VisitFrequency | 'all'>('all');
    
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [viewingReport, setViewingReport] = useState<Report | null>(null);
    
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);

    const consultants = useMemo(() => users.filter(u => u.role === 'consultant'), [users]);

    const siteStats = useMemo(() => ({
        weekly: sites.filter(s => s.status === 'Active' && s.frequency === 'Weekly').length,
        biWeekly: sites.filter(s => s.status === 'Active' && s.frequency === 'Bi-Weekly').length,
        monthly: sites.filter(s => s.status === 'Active' && s.frequency === 'Monthly').length,
        // Audits removed as per request
        onHold: sites.filter(s => s.status === 'On Hold').length,
        completed: sites.filter(s => s.status === 'Completed').length
    }), [sites]);

    // Reactive Distribution Stats for the Legend
    const distributionStats = useMemo(() => {
        const activeSites = sites.filter(s => s.status === 'Active');
        return {
            unassigned: activeSites.filter(s => s.assignedConsultantId === 0).length,
            assigned: activeSites.filter(s => s.assignedConsultantId !== 0).length
        };
    }, [sites]);

    const filteredSites = useMemo(() => {
        return sites.filter(site => {
            const matchesSearch = searchQuery === '' || 
                site.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (site.city && site.city.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesConsultant = filterConsultant === 'all' || site.assignedConsultantId === parseInt(filterConsultant);
            
            // Special handling for 'all': Exclude 'Completed' unless explicitly selected or searching specifically
            let matchesStatus = true;
            if (filterStatus === 'all') {
                matchesStatus = site.status !== 'Completed';
            } else {
                matchesStatus = site.status === filterStatus;
            }

            const matchesFrequency = filterFrequency === 'all' || site.frequency === filterFrequency;

            return matchesSearch && matchesConsultant && matchesStatus && matchesFrequency;
        }).sort((a, b) => a.clientName.localeCompare(b.clientName));
    }, [sites, searchQuery, filterConsultant, filterStatus, filterFrequency]);

    const applyQuickFilter = (status: SiteStatus | 'all', frequency: VisitFrequency | 'all') => {
        setFilterStatus(status);
        setFilterFrequency(frequency);
        setFilterConsultant('all');
        setSearchQuery('');
    };

    const handleRestartProject = async (site: Site) => {
        if (window.confirm(`Restart project for ${site.clientName}? This will set the site to 'Active'.`)) {
            await updateSite(site.id, { status: 'Active' });
        }
    };
    
    const getLastVisitInfo = (siteId: number) => {
        // Find most recent report
        const siteReports = reports.filter(r => r.siteId === siteId).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
        if (siteReports.length > 0) {
            const last = siteReports[0];
            const consultant = users.find(u => u.id === last.consultantId);
            return { date: last.visitDate, status: last.status, consultant: consultant?.name, report: last };
        }
        // Fallback to site.lastVisited if no report found (legacy data)
        const site = sites.find(s => s.id === siteId);
        if (site?.lastVisited) {
            return { date: site.lastVisited, status: 'Legacy Record', consultant: undefined, report: null };
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {isImportModalOpen && <ImportSitesModal onClose={() => setIsImportModalOpen(false)} />}
            {isGenerateModalOpen && <GeneratePlanModal users={users} onClose={() => setIsGenerateModalOpen(false)} onGenerate={generateNextWeeksPlans} />}
            {isDistributionModalOpen && <SiteDistributionModal onClose={() => setIsDistributionModalOpen(false)} />}
            <PlanEditorModal />
            {viewingReport && (
                <ReportPrintModal
                    report={viewingReport}
                    site={sites.find(s => s.id === viewingReport.siteId)!}
                    consultant={users.find(u => u.id === viewingReport.consultantId)}
                    onClose={() => setViewingReport(null)}
                />
            )}
            
            {/* Interactive Legend / Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <button onClick={() => applyQuickFilter('Active', 'Weekly')} className={`p-3 text-center transition-all bg-green-50 border rounded-lg cursor-pointer hover:shadow-md dark:bg-green-900/20 dark:border-green-800 group ${filterStatus === 'Active' && filterFrequency === 'Weekly' ? 'ring-2 ring-green-500 border-transparent' : 'border-green-100'}`}>
                    <dt className="text-xs font-medium text-green-600 uppercase dark:text-green-400">Active Weekly</dt>
                    <dd className="mt-1 text-2xl font-bold text-green-800 dark:text-green-200">{siteStats.weekly}</dd>
                </button>
                <button onClick={() => applyQuickFilter('Active', 'Bi-Weekly')} className={`p-3 text-center transition-all bg-blue-50 border rounded-lg cursor-pointer hover:shadow-md dark:bg-blue-900/20 dark:border-blue-800 group ${filterStatus === 'Active' && filterFrequency === 'Bi-Weekly' ? 'ring-2 ring-blue-500 border-transparent' : 'border-blue-100'}`}>
                    <dt className="text-xs font-medium text-blue-600 uppercase dark:text-blue-400">Active Bi-Wk</dt>
                    <dd className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-200">{siteStats.biWeekly}</dd>
                </button>
                <button onClick={() => applyQuickFilter('Active', 'Monthly')} className={`p-3 text-center transition-all bg-purple-50 border rounded-lg cursor-pointer hover:shadow-md dark:bg-purple-900/20 dark:border-purple-800 group ${filterStatus === 'Active' && filterFrequency === 'Monthly' ? 'ring-2 ring-purple-500 border-transparent' : 'border-purple-100'}`}>
                    <dt className="text-xs font-medium text-purple-600 uppercase dark:text-purple-400">Active Monthly</dt>
                    <dd className="mt-1 text-2xl font-bold text-purple-800 dark:text-purple-200">{siteStats.monthly}</dd>
                </button>
                <button onClick={() => applyQuickFilter('On Hold', 'all')} className={`p-3 text-center transition-all bg-amber-50 border rounded-lg cursor-pointer hover:shadow-md dark:bg-amber-900/20 dark:border-amber-800 group ${filterStatus === 'On Hold' ? 'ring-2 ring-amber-500 border-transparent' : 'border-amber-100'}`}>
                    <dt className="text-xs font-medium text-amber-600 uppercase dark:text-amber-400">On Hold</dt>
                    <dd className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">{siteStats.onHold}</dd>
                </button>
                <button onClick={() => applyQuickFilter('Completed', 'all')} className={`p-3 text-center transition-all bg-gray-50 border rounded-lg cursor-pointer hover:shadow-md dark:bg-gray-700/40 dark:border-gray-600 group ${filterStatus === 'Completed' ? 'ring-2 ring-gray-500 border-transparent' : 'border-gray-200'}`}>
                    <dt className="text-xs font-medium text-gray-600 uppercase dark:text-gray-400">Finished Projects</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-800 dark:text-gray-200">{siteStats.completed}</dd>
                </button>
            </div>
            
            {/* Combined Site Distribution & Actions Panel - VERTICAL STACKED LAYOUT */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700/50 border-b dark:border-gray-700">
                     <div className="flex flex-col gap-6">
                        
                        {/* Top Zone: Text Description - Full Width */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Site Distribution & Actions
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage workforce allocation, auto-generate plans, and maintain the master site list.
                            </p>
                        </div>

                        {/* Bottom Zone: Toolbar */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            
                            {/* Left: Stats / Legend */}
                            <div className="flex flex-wrap gap-3 text-sm">
                                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all shadow-sm">
                                    <span className="font-bold mr-1.5">{distributionStats.unassigned}</span> Unassigned
                                </div>
                                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800 transition-all shadow-sm">
                                    <span className="font-bold mr-1.5">{distributionStats.assigned}</span> Assigned
                                </div>
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex flex-wrap gap-3 xl:justify-end">
                                <button 
                                    onClick={() => setIsDistributionModalOpen(true)} 
                                    className="flex items-center justify-center px-4 py-2 text-sm font-bold text-white transition-all transform bg-teal-600 rounded-lg shadow-sm hover:bg-teal-700 hover:-translate-y-0.5 focus:ring-4 focus:ring-teal-500/30"
                                >
                                    <UserGroupIcon className="w-4 h-4 mr-2" />
                                    Distribution Mode
                                </button>
                                <button 
                                    onClick={() => setIsGenerateModalOpen(true)} 
                                    className="flex items-center justify-center px-4 py-2 text-sm font-bold text-white transition-all transform bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 hover:-translate-y-0.5 focus:ring-4 focus:ring-indigo-500/30"
                                >
                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                    Auto-Generate Plans
                                </button>
                                <button onClick={() => onEditSite('new')} className="flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-brand-primary hover:bg-brand-secondary shadow-sm">
                                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                                    Add Site
                                </button>
                                <button onClick={() => setIsImportModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 shadow-sm">
                                    <UploadIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                                    Import
                                </button>
                                <div className="flex rounded-lg shadow-sm" role="group">
                                    <button onClick={() => exportSitesToCSV(sites, users)} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 border-r-0">
                                        <DocumentDownloadIcon className="w-4 h-4 mr-1.5 text-green-600" />
                                        CSV
                                    </button>
                                    <button onClick={() => exportSitesToWord(sites, users)} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                                        <DocumentWordIcon className="w-4 h-4 mr-1.5 text-blue-600" />
                                        DOC
                                    </button>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Separate Filters Card and View Toggle Card */}
            <div className="flex flex-col lg:flex-row gap-4">
                
                {/* Filters Card */}
                <div className="flex-1 p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
                            <input 
                                type="text" 
                                placeholder="Client, Address, City..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Consultant</label>
                            <select value={filterConsultant} onChange={(e) => setFilterConsultant(e.target.value)} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                                <option value="all">All Consultants</option>
                                {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                <option value="0">Unassigned</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SiteStatus | 'all')} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                                <option value="all">All Active/Hold (Hide Completed)</option>
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Not Active">Not Active (Inactive)</option>
                                <option value="Completed">Finished Projects</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Frequency</label>
                            <select value={filterFrequency} onChange={(e) => setFilterFrequency(e.target.value as VisitFrequency | 'all')} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                                <option value="all">All Frequencies</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Bi-Weekly">Bi-Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Shop Audit">Shop Audit</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* View Toggle Card */}
                <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 flex flex-col justify-center min-w-[160px]">
                     <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">View Mode</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`flex-1 p-2 rounded-md flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-primary dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            title="Grid View (Expanded)"
                        >
                            <ViewBoardsIcon className="w-5 h-5 mr-1" />
                            <span className="text-xs font-medium">Grid</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`flex-1 p-2 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-primary dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            title="List View (Compact)"
                        >
                            <ListIcon className="w-5 h-5 mr-1" />
                             <span className="text-xs font-medium">List</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Site Content */}
            {filteredSites.length > 0 ? (
                viewMode === 'grid' ? (
                    // GRID VIEW
                    <div className="grid grid-cols-1 gap-4">
                        {filteredSites.map(site => (
                            <div key={site.id} className="relative">
                                <SiteCard 
                                    site={site} 
                                    isReadOnly={true}
                                    isCompleted={site.status === 'Completed'}
                                    onReport={() => {}} // Read only in this view
                                />
                                {/* Overlay Actions */}
                                <div className="absolute top-4 right-4 flex space-x-2">
                                    {site.status === 'Completed' && (
                                        <button 
                                            onClick={() => handleRestartProject(site)}
                                            className="flex items-center px-3 py-1.5 text-xs font-bold text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 shadow-sm dark:bg-green-900/40 dark:border-green-800 dark:text-green-300"
                                            title="Restart Project"
                                        >
                                            <RefreshIcon className="w-4 h-4 mr-1" />
                                            Restart Project
                                        </button>
                                    )}
                                    {site.status !== 'Completed' && (
                                        <button 
                                            onClick={() => onSetPriority(site)}
                                            className={`p-1.5 rounded-md border ${site.isPriority ? 'bg-yellow-100 border-yellow-200 text-yellow-600' : 'bg-white border-gray-200 text-gray-400 hover:text-yellow-500'}`}
                                            title="Set Priority"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={site.isPriority ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => onEditSite(site)} 
                                        className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:text-brand-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                        title="Edit Site Details"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // LIST VIEW
                    <div className="bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th scope="col" className="px-2 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400 w-1/6">Client Name</th>
                                    <th scope="col" className="px-2 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400 w-1/6">Address</th>
                                    <th scope="col" className="px-2 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400 w-24">Freq</th>
                                    <th scope="col" className="px-2 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400 w-1/6">Assigned To</th>
                                    <th scope="col" className="px-2 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400 w-1/6">Requestor</th>
                                    <th scope="col" className="px-2 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400 w-1/6">Recent History</th>
                                    <th scope="col" className="relative px-2 py-3 w-20"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                {filteredSites.map((site) => {
                                    const lastVisit = getLastVisitInfo(site.id);
                                    const assignedUser = users.find(u => u.id === site.assignedConsultantId);
                                    
                                    return (
                                        <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-2 py-3 whitespace-normal">
                                                <div className="flex items-center">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 break-words line-clamp-2">{site.clientName}</div>
                                                    {site.isPriority && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363 1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{site.status}</div>
                                            </td>
                                            <td className="px-2 py-3 whitespace-normal">
                                                <div className="text-sm text-gray-900 dark:text-gray-200 break-words line-clamp-2">{site.address}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{site.city}</div>
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {site.frequency}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 whitespace-normal">
                                                {assignedUser ? (
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{assignedUser.name}</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-3 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                                                {site.initialVisitRequestor ? (
                                                    <span className="text-purple-700 dark:text-purple-300 font-medium break-words line-clamp-2">{site.initialVisitRequestor}</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-3 whitespace-normal">
                                                {lastVisit ? (
                                                    <div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-sm text-gray-900 dark:text-gray-200 font-medium whitespace-nowrap">{formatDateString(lastVisit.date)}</div>
                                                            {lastVisit.report && (
                                                                <button 
                                                                    onClick={() => setViewingReport(lastVisit.report)}
                                                                    className="text-xs text-brand-primary hover:underline ml-1"
                                                                >
                                                                    View
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 break-words line-clamp-1">
                                                            {lastVisit.status} {lastVisit.consultant ? `by ${lastVisit.consultant}` : ''}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No history</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button 
                                                        onClick={() => onEditSite(site)}
                                                        className="text-brand-primary hover:text-brand-secondary dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    {site.status !== 'Completed' && (
                                                         <button 
                                                            onClick={() => onSetPriority(site)}
                                                            className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-500 dark:hover:text-yellow-400"
                                                        >
                                                            Priority
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <EmptyState Icon={FunnelIcon} title="No Sites Found" message="Try adjusting your filters or adding a new site." />
            )}
        </div>
    );
};

export default AllSitesView;
