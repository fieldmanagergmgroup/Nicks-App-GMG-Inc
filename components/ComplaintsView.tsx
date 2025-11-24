
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Complaint, ComplaintStatus } from '../types';
import { formatDateString } from '../utils/formatDate';
import { ShieldExclamationIcon, ChevronDownIcon, PlusCircleIcon } from './icons';
import EmptyState from './common/EmptyState';
import useDebounce from '../hooks/useDebounce';
import LogComplaintModal from './LogComplaintModal';

const statusColors: Record<ComplaintStatus, { bg: string, text: string, border: string }> = {
    'Open': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-500' },
    'Under Review': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-500' },
    'Resolved': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', border: 'border-green-500' },
};

const ComplaintsView: React.FC = () => {
    const { complaints, users, sites, updateComplaint } = useAppContext();
    
    // Filters
    const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'all'>('Open');
    const [filterConsultant, setFilterConsultant] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);
    const [managementNotes, setManagementNotes] = useState('');
    const [isLoggingComplaint, setIsLoggingComplaint] = useState(false);
    
    const consultants = useMemo(() => users.filter(u => u.role === 'consultant'), [users]);

    const filteredComplaints = useMemo(() => {
        return complaints.filter(complaint => {
            const consultant = users.find(u => u.id === complaint.userId);
            const site = sites.find(s => s.id === complaint.siteId);

            const statusMatch = filterStatus === 'all' ? true : complaint.status === filterStatus;
            const consultantMatch = filterConsultant === 'all' ? true : complaint.userId === parseInt(filterConsultant);
            const searchMatch = debouncedSearchQuery ?
                consultant?.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                site?.clientName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                complaint.notes.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
                : true;
            
            return statusMatch && consultantMatch && searchMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [complaints, users, sites, filterStatus, filterConsultant, debouncedSearchQuery]);
    
    const summaryStats = useMemo(() => {
        const byConsultant = complaints.reduce((acc, curr) => {
            const consultantName = users.find(u => u.id === curr.userId)?.name || 'Unknown';
            acc[consultantName] = (acc[consultantName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            openCount: complaints.filter(c => c.status === 'Open').length,
            byConsultant: Object.entries(byConsultant)
              .sort(([, a], [, b]) => Number(b) - Number(a))
              .slice(0, 5),
        };
    }, [complaints, users]);
    
    const toggleExpand = (complaint: Complaint) => {
        if (expandedComplaintId === complaint.id) {
            setExpandedComplaintId(null);
            setManagementNotes('');
        } else {
            setExpandedComplaintId(complaint.id);
            setManagementNotes(complaint.managementNotes || '');
        }
    };

    const handleStatusUpdate = (complaintId: string, status: ComplaintStatus) => {
        updateComplaint(complaintId, { status });
    };

    const handleNotesSave = (complaintId: string) => {
        updateComplaint(complaintId, { managementNotes: managementNotes.trim() });
        setExpandedComplaintId(null);
    };

    return (
        <div className="space-y-6">
            {isLoggingComplaint && <LogComplaintModal onClose={() => setIsLoggingComplaint(false)} />}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Damage Control</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                   Manage and review complaints logged against consultants to maintain service quality and track performance.
                </p>
            </div>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                 <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Complaints</h3>
                    <p className="mt-1 text-3xl font-bold text-red-600 dark:text-red-400">{summaryStats.openCount}</p>
                </div>
                <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Complaints per Consultant</h3>
                    {summaryStats.byConsultant.length > 0 ? (
                        <div className="mt-2 space-y-1">
                            {summaryStats.byConsultant.map(([name, count]) => (
                                <div key={name} className="flex justify-between text-xs">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="mt-2 text-xs text-gray-500">No complaints logged.</p>}
                </div>
            </div>
            
             <div className="p-4 space-y-4 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">All Complaints</h3>
                     <button onClick={() => setIsLoggingComplaint(true)} className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-white transition-colors rounded-md sm:w-auto bg-green-700 hover:bg-green-800">
                        <PlusCircleIcon className="w-5 h-5 mr-2" />Log New Complaint
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary" />
                    <select value={filterConsultant} onChange={e => setFilterConsultant(e.target.value)} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"><option value="all">All Consultants</option>{consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ComplaintStatus | 'all')} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"><option value="all">All Statuses</option>{(['Open', 'Under Review', 'Resolved'] as ComplaintStatus[]).map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
            </div>

            {filteredComplaints.length > 0 ? (
                <div className="space-y-4">
                    {filteredComplaints.map(complaint => {
                        const consultant = users.find(u => u.id === complaint.userId);
                        const site = sites.find(s => s.id === complaint.siteId);
                        const isExpanded = expandedComplaintId === complaint.id;
                        
                        return (
                            <div key={complaint.id} className={`p-4 bg-white rounded-lg shadow dark:bg-gray-800 dark:border ${statusColors[complaint.status].border}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[complaint.status].bg} ${statusColors[complaint.status].text}`}>{complaint.status}</span>
                                            <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">{formatDateString(complaint.date)}</p>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{complaint.notes}</p>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            Against: <span className="font-semibold">{consultant?.name || 'Unknown'}</span>
                                            {site && ` at site: `}
                                            {site && <span className="font-semibold">{site.clientName}</span>}
                                        </p>
                                    </div>
                                    <button onClick={() => toggleExpand(complaint)} className="p-2 -mr-2 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                                {isExpanded && (
                                     <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                                        <div>
                                            <label htmlFor={`notes-${complaint.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Management Notes</label>
                                            <textarea id={`notes-${complaint.id}`} rows={3} value={managementNotes} onChange={e => setManagementNotes(e.target.value)} className="w-full mt-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary" placeholder="Log actions taken, resolutions, etc."></textarea>
                                        </div>
                                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium">Update Status:</span>
                                                {(['Open', 'Under Review', 'Resolved'] as ComplaintStatus[]).map(s => (
                                                    <button key={s} onClick={() => handleStatusUpdate(complaint.id, s)} disabled={complaint.status === s} className={`px-2 py-1 text-xs font-semibold rounded-full disabled:opacity-50 ${statusColors[s].bg} ${statusColors[s].text}`}>{s}</button>
                                                ))}
                                            </div>
                                            <button onClick={() => handleNotesSave(complaint.id)} className="w-full px-4 py-2 text-sm font-semibold text-white rounded-md sm:w-auto bg-brand-primary hover:bg-brand-secondary">Save Notes</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState Icon={ShieldExclamationIcon} title="No Complaints Found" message="No complaints match the current filters." />
            )}
        </div>
    );
};

export default ComplaintsView;
