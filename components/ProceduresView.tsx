
import React, { useMemo } from 'react';
import { Procedure } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import EmptyState from './common/EmptyState';
import { DocumentTextIcon, ClipboardListIcon, UploadIcon, DocumentDownloadIcon } from './icons';
import { exportProceduresToCSV } from '../utils/csvExport';

interface ProceduresViewProps {
  onAddProcedure: () => void;
}

const ProceduresView: React.FC<ProceduresViewProps> = ({ onAddProcedure }) => {
    const { procedures, users, sites, updateProcedure } = useAppContext();
    
    const procedureStatusCounts = useMemo(() => procedures.reduce((acc, proc) => { acc[proc.status] = (acc[proc.status] || 0) + 1; return acc; }, {} as Record<'Ongoing' | 'Completed', number>), [procedures]);
    const handleStatusToggle = (proc: Procedure) => { const newStatus = proc.status === 'Ongoing' ? 'Completed' : 'Ongoing'; updateProcedure(proc.id, { status: newStatus }); };
    const handleUpload = (procId: string) => { const fileName = prompt("Simulate upload: Enter document name:"); if (fileName) updateProcedure(procId, { fileUrl: fileName }); };

    if (procedures.length === 0) return (<EmptyState Icon={DocumentTextIcon} title="No Procedures Documented" message="Create the first SWP/JHA entry for a client."><button onClick={onAddProcedure} className="flex items-center justify-center px-4 py-2 mt-4 text-sm font-semibold text-white transition-colors rounded-md bg-green-700 hover:bg-green-800"><ClipboardListIcon className="w-5 h-5 mr-2" />Add First Procedure</button></EmptyState>);

    return (<div className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg md:flex-row md:items-center dark:bg-gray-800">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Procedure Status:</span>
                <div className="flex items-center"><span className="block w-3 h-3 mr-1.5 bg-yellow-400 rounded-full"></span><span className="text-xs text-gray-600 dark:text-gray-400">Ongoing: <strong>{procedureStatusCounts['Ongoing'] || 0}</strong></span></div>
                <div className="flex items-center"><span className="block w-3 h-3 mr-1.5 bg-green-500 rounded-full"></span><span className="text-xs text-gray-600 dark:text-gray-400">Completed: <strong>{procedureStatusCounts['Completed'] || 0}</strong></span></div>
            </div>
            <div className="flex items-center w-full space-x-2 md:w-auto">
                <button onClick={onAddProcedure} className="flex items-center justify-center flex-1 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-md bg-green-700 md:w-auto hover:bg-green-800"><ClipboardListIcon className="w-5 h-5 mr-2" />Add</button>
                <button onClick={() => exportProceduresToCSV(procedures, sites, users)} className="flex items-center justify-center flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md md:w-auto hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"><DocumentDownloadIcon className="w-5 h-5 mr-2" />Export</button>
            </div>
        </div>
        <div className="space-y-3">
        {procedures.map((proc, index) => { const site = sites.find(s => s.id === proc.siteId); const consultant = users.find(u => u.id === proc.consultantId); return (<div key={proc.id} className="p-4 bg-white rounded-lg shadow dark:bg-gray-800 dark:border dark:border-gray-700">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                        <span className="px-2 py-1 mr-2 text-xs font-bold text-white rounded-md bg-brand-secondary">{proc.type}</span>
                        {proc.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">For: <span className="font-medium text-gray-700 dark:text-gray-300">{site?.clientName || 'N/A'}</span></p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Created by {consultant?.name || 'N/A'} on {proc.createdAt}</p>
                </div>
                <button onClick={() => handleStatusToggle(proc)} className={`flex-shrink-0 px-3 py-1 text-xs font-bold text-white rounded-full ${proc.status === 'Ongoing' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}>{proc.status}</button>
            </div>
            <div className="flex flex-col items-start gap-2 mt-4 pt-4 border-t sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                <div>{proc.fileUrl ? <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-brand-primary hover:underline">{proc.fileUrl}</a> : <span className="text-xs italic text-gray-400 dark:text-gray-500">No file uploaded</span>}</div>
                <button onClick={() => handleUpload(proc.id)} className="flex items-center px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"><UploadIcon className="w-4 h-4 mr-1"/>{proc.fileUrl ? 'Replace File' : 'Upload File'}</button>
            </div>
        </div>); })}
        </div>
    </div>);
};

export default ProceduresView;
