
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Report, User, DeliveredItems, Site } from '../types';
import EmptyState from './common/EmptyState';
import { CheckBadgeIcon, FlagIcon, PauseIcon, CheckCircleIcon, XCircleIcon, MegaphoneIcon, ClockIcon, PencilIcon } from './icons';
import { formatDateString } from '../utils/formatDate';
import SiteEditModal from './SiteEditModal';

const itemKeyToLabel = (key: string): string => {
    const labels: Record<string, string> = {
        greenBooks: 'Green Books',
        safetyBoard: 'Safety Boards',
        fireExtinguisher: 'Fire Extinguisher',
        eyeWashStation: 'Eye Wash Stations',
        firstAidKitSmall: 'First Aid Kits (Small)',
        firstAidKitLarge: 'First Aid Kits (Large)',
        inspectionTags: 'Inspection Tags',
        specificProcedure: 'Workplace Specific Procedures',
    };
    return labels[key] || key;
};

const ReviewView: React.FC = () => {
  const { reports, sites, users, approveChange, rejectChange, resolveHoldRequest, announcements } = useAppContext();
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const pendingReports = useMemo(() => reports.filter(r => r.reviewStatus === 'pending'), [reports]);
  const pendingHolds = useMemo(() => sites.filter(s => s.status === 'On Hold' && s.onHoldApprovalStatus === 'Pending'), [sites]);

  // Acknowledgment Logic
  const acknowledgmentData = useMemo(() => {
      const trackingAnnouncements = announcements
        .filter(a => a.requiresAcknowledgment && a.targetUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const pending = trackingAnnouncements.filter(a => !a.isAcknowledged);
      const confirmed = trackingAnnouncements.filter(a => a.isAcknowledged);

      return { pending, confirmed };
  }, [announcements]);

  const consultants = useMemo(() => users.filter(u => u.role === 'consultant'), [users]);
  
  const consultantSubmissionStatus = useMemo(() => {
    return consultants.map(consultant => {
        const submittedCount = reports.filter(r => r.consultantId === consultant.id && r.visitDate === new Date().toISOString().split('T')[0]).length;
        return {
            ...consultant,
            submittedCount
        };
    });
  }, [reports, consultants]);

  const getSiteName = (siteId: number) => sites.find(s => s.id === siteId)?.clientName || 'Unknown Site';
  const getConsultantName = (consultantId: number) => users.find(u => u.id === consultantId)?.name || 'Unknown Consultant';
  const getUserName = (userId: number) => users.find(u => u.id === userId)?.name || 'Unknown User';

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        
        {/* Pending Hold Requests Section */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pending Hold Requests ({pendingHolds.length})</h2>
             {pendingHolds.length > 0 ? (
                <div className="mt-4 space-y-4">
                    {pendingHolds.map(site => (
                         <div key={site.id} className="p-4 bg-white border-l-4 rounded-r-lg shadow border-amber-500 dark:bg-gray-800 dark:border-amber-400">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                        {site.clientName} <span className="text-sm font-normal text-gray-500">({site.address})</span>
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Requested by {site.onHoldSetBy ? getUserName(site.onHoldSetBy) : 'Unknown'}
                                    </p>
                                </div>
                                <div className="flex items-center mt-3 space-x-2 sm:mt-0 flex-shrink-0">
                                    <button onClick={() => resolveHoldRequest(site.id, false)} className="flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">
                                        <XCircleIcon className="w-4 h-4 mr-1"/> Reject
                                    </button>
                                    <button onClick={() => resolveHoldRequest(site.id, true)} className="flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                                        <CheckCircleIcon className="w-4 h-4 mr-1"/> Approve Hold
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 mt-3 space-y-2 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-500/30">
                                <div className="flex items-start space-x-3">
                                    <PauseIcon className="flex-shrink-0 w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                            {formatDateString(site.onHoldStart)} — {formatDateString(site.onHoldEnd)}
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                            Reason: "{site.onHoldReason}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             ) : (
                 <div className="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300 dark:bg-gray-800/50 dark:border-gray-700">
                     No pending site hold requests.
                 </div>
             )}
        </div>

        {/* Pending Report Approvals Section */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pending Report Approvals ({pendingReports.length})</h2>
            {pendingReports.length > 0 ? (
            <div className="mt-4 space-y-4">
                {pendingReports.map((report) => (
                <div key={report.id} className="p-4 bg-white border-l-4 rounded-r-lg shadow border-yellow-500 dark:bg-gray-800 dark:border-yellow-400">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            {getSiteName(report.siteId)}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Submitted by {getConsultantName(report.consultantId)} on {formatDateString(report.visitDate)}
                            </p>
                        </div>
                        <div className="flex items-center mt-3 space-x-2 sm:mt-0 flex-shrink-0">
                            <button 
                                onClick={() => {
                                    const site = sites.find(s => s.id === report.siteId);
                                    if(site) setEditingSite(site);
                                }}
                                className="flex items-center px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                <PencilIcon className="w-4 h-4 mr-1"/> Edit Site
                            </button>
                            <button onClick={() => rejectChange(report.id)} className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Reject</button>
                            <button onClick={() => approveChange(report.id)} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Approve</button>
                        </div>
                    </div>
                    <div className="p-3 mt-3 space-y-3 rounded-md bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-500/30">
                        <div className="flex items-start space-x-3">
                            <FlagIcon className="flex-shrink-0 w-5 h-5 text-yellow-500" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                <span className="font-bold">Note for Review:</span> "{report.managementNotes}"
                            </p>
                        </div>
                        {report.deliveredItems && Object.keys(report.deliveredItems).length > 0 && (
                            <div className="pt-2 border-t border-yellow-200 dark:border-yellow-500/30">
                                <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">Delivered Items:</p>
                                <ul className="text-xs list-disc list-inside text-yellow-700 dark:text-yellow-300">
                                    {(Object.entries(report.deliveredItems) as [keyof DeliveredItems, number][]).map(([key, value]) => (
                                        <li key={key}>{itemKeyToLabel(key)}: <span className="font-bold">{value}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                ))}
            </div>
            ) : (
             <div className="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300 dark:bg-gray-800/50 dark:border-gray-700">
                All consultant submissions that required review have been processed.
            </div>
            )}
        </div>

        {/* Consultant Acknowledgments Section */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Consultant Acknowledgments</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Track receipt of schedule changes, swaps, and new site assignments.</p>
            
            <div className="mt-4 space-y-6">
                {/* Pending Confirmations */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1.5" />
                        Pending Confirmation ({acknowledgmentData.pending.length})
                    </h3>
                    {acknowledgmentData.pending.length > 0 ? (
                        acknowledgmentData.pending.map(announcement => (
                            <div key={announcement.id} className="p-4 bg-white border-l-4 rounded-r-lg shadow border-yellow-500 dark:bg-gray-800 dark:border-yellow-400">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <MegaphoneIcon className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            Waiting for: {getUserName(announcement.targetUserId!)}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">"{announcement.message}"</p>
                                        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                            Sent: {new Date(announcement.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300 dark:bg-gray-800/50 dark:border-gray-700 text-sm">
                            No pending acknowledgments.
                        </div>
                    )}
                </div>

                {/* Recently Confirmed (History) */}
                 <div>
                    <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider flex items-center mb-3">
                        <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                        Receipt History
                    </h3>
                    {acknowledgmentData.confirmed.length > 0 ? (
                         <div className="space-y-3">
                            {acknowledgmentData.confirmed.slice(0, 5).map(announcement => (
                                <div key={announcement.id} className="p-4 bg-white border-l-4 rounded-r-lg shadow border-green-500 dark:bg-gray-800 dark:border-green-400">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                Confirmed: {getUserName(announcement.targetUserId!)}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">"{announcement.message}"</p>
                                            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                                Acknowledged: {new Date(announcement.acknowledgedAt!).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {acknowledgmentData.confirmed.length > 5 && (
                                <p className="text-xs text-center text-gray-500 italic">
                                    ...and {acknowledgmentData.confirmed.length - 5} older confirmations.
                                </p>
                            )}
                         </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300 dark:bg-gray-800/50 dark:border-gray-700 text-sm">
                            No receipt confirmations history available yet.
                        </div>
                    )}
                 </div>
            </div>
        </div>

      </div>
      
      <div className="lg:col-span-1">
         <div className="lg:sticky lg:top-24">
            <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Today's Submissions</h3>
                <ul className="mt-3 space-y-2">
                    {consultantSubmissionStatus.map(consultant => (
                        <li key={consultant.id} className="flex items-center justify-between p-2 text-sm bg-gray-50 rounded-md dark:bg-gray-700/50">
                           <span className="font-medium text-gray-700 dark:text-gray-300">{consultant.name}</span>
                           <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${consultant.submittedCount > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                                {consultant.submittedCount} report{consultant.submittedCount !== 1 ? 's' : ''}
                           </span>
                        </li>
                    ))}
                </ul>
            </div>
         </div>
      </div>
      {editingSite && (
          <SiteEditModal 
              site={editingSite} 
              onClose={() => setEditingSite(null)} 
          />
      )}
    </div>
  );
};

export default ReviewView;
