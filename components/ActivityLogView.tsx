
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType } from '../types';
import { formatDateString } from '../utils/formatDate';
import { HistoryIcon, FunnelIcon, DocumentTextIcon } from './icons';
import EmptyState from './common/EmptyState';
import useDebounce from '../hooks/useDebounce';

const ActivityLogView: React.FC = () => {
    const { actionLogs, users } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterUser, setFilterUser] = useState<string>('all');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const actionTypes: ActionType[] = ['Status Change', 'Report Filed', 'Plan Update', 'Hold Request', 'Undo Action', 'Edit Report', 'Remove Site'];

    const filteredLogs = useMemo(() => {
        return actionLogs.filter(log => {
            const searchMatch = debouncedSearch ? 
                log.details.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                log.userName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (log.siteName && log.siteName.toLowerCase().includes(debouncedSearch.toLowerCase()))
                : true;
            
            const typeMatch = filterType === 'all' || log.actionType === filterType;
            const userMatch = filterUser === 'all' || log.userId.toString() === filterUser;

            return searchMatch && typeMatch && userMatch;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [actionLogs, debouncedSearch, filterType, filterUser]);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = actionLogs.filter(l => l.timestamp.startsWith(today));
        return {
            totalActions: actionLogs.length,
            todayActions: todayLogs.length,
            undoCount: actionLogs.filter(l => l.actionType === 'Undo Action').length
        };
    }, [actionLogs]);

    const selectClasses = "block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm focus:ring-brand-primary focus:border-brand-primary p-2 border";

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between md:flex-row md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Consultant Activity Log</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Audit trail of all actions performed within the application.</p>
                </div>
                <div className="flex space-x-4 text-sm">
                    <div className="px-3 py-2 bg-white border rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">Today:</span> <span className="font-bold text-gray-800 dark:text-gray-200">{stats.todayActions}</span>
                    </div>
                    <div className="px-3 py-2 bg-white border rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">Undos:</span> <span className="font-bold text-amber-600">{stats.undoCount}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <input 
                        type="text" 
                        placeholder="Search logs..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClasses}>
                        <option value="all">All Action Types</option>
                        {actionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className={selectClasses}>
                        <option value="all">All Users</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            </div>

            {filteredLogs.length > 0 ? (
                <div className="overflow-hidden bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Timestamp</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Role</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">User</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Action</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Details & Documents</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {filteredLogs.map(log => {
                                const user = users.find(u => u.id === log.userId);
                                const isManagement = user?.role === 'management';
                                
                                return (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap dark:text-gray-400">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full 
                                            ${isManagement 
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                            {isManagement ? 'Management' : 'Consultant'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">
                                        {log.userName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                            ${log.actionType === 'Undo Action' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                                              log.actionType === 'Report Filed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {log.actionType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div>
                                            {log.siteName && <span className="font-bold text-gray-700 dark:text-gray-300 mr-1">[{log.siteName}]</span>}
                                            {log.details}
                                        </div>
                                        {log.documents && log.documents.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {log.documents.map((doc, idx) => (
                                                    <a 
                                                        key={idx}
                                                        href={doc.data} 
                                                        download={doc.name}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-brand-primary bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                                    >
                                                        <DocumentTextIcon className="w-3 h-3 mr-1" />
                                                        {doc.name}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState Icon={HistoryIcon} title="No Logs Found" message="No activity matches your current filters." />
            )}
        </div>
    );
};

export default ActivityLogView;
