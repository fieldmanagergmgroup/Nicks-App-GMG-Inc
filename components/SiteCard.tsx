
import React, { useMemo, useState } from 'react';
import { Site, Report, Weekday, ReportStatus, SiteStatus, DeliveredItems } from '../types';
import {
    LocationMarkerIcon,
    StarIcon,
    CalendarPlusIcon,
    PencilAltIcon,
    LinkIcon,
    FlagIcon,
    DirectionsIcon,
    PhoneIcon,
    PauseIcon,
    UserIcon,
    ClockIcon,
    RefreshIcon,
    XCircleIcon,
    DocumentTextIcon
} from './icons';
import { formatDateString } from '../utils/formatDate';
import { useAppContext } from '../hooks/useAppContext';
import ReportPrintModal from './ReportPrintModal';

type PlanLocation = Weekday | 'todo';

interface SiteCardProps {
  site: Site;
  report?: Report;
  isCompleted?: boolean;
  onPlanSite?: (site: Site) => void;
  currentLocation?: PlanLocation;
  isReadOnly?: boolean;
  isTodaysRoute?: boolean;
  displayIndex?: number;
  // New props for external control
  onReport?: (site: Site, initialStatus: ReportStatus, isManagementNote: boolean) => void;
  onHold?: (site: Site) => void;
  isRevisit?: boolean;
  hideManagementInfo?: boolean; // Added to hide extra management info in consultant view if needed
}

const statusInfoMap: Record<SiteStatus, { bg: string, text: string }> = { 
    'Active': { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300' }, 
    'Not Active': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300' }, 
    'On Hold': { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-800 dark:text-amber-300' }, 
    'Completed': { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300' } 
};

const itemKeyToLabel = (key: string): string => {
    const labels: Record<string, string> = {
        greenBooks: 'Green Books',
        safetyBoard: 'Safety Boards',
        fireExtinguisher: 'Fire Extinguishers',
        eyeWashStation: 'Eye Wash Stations',
        firstAidKitSmall: 'First Aid Kits (Small)',
        firstAidKitLarge: 'First Aid Kits (Large)',
        inspectionTags: 'Inspection Tags',
        specificProcedure: 'Workplace Specific Procedures',
    };
    return labels[key] || key;
};

const SiteCard: React.FC<SiteCardProps> = ({ site, report, isCompleted = false, onPlanSite, currentLocation, isReadOnly = false, isTodaysRoute = false, displayIndex, onReport, onHold, isRevisit = false }) => {
  const { users, reports, user, logVisitActivity } = useAppContext();
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  
  const assignedConsultant = users.find(u => u.id === site.assignedConsultantId);

  const visitHistory = useMemo(() => reports
      .filter(r => r.siteId === site.id)
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
      .slice(0, 3), [reports, site.id]);

  const cardClasses = [
    'flex flex-col justify-between p-4 bg-white rounded-lg shadow-md transition-shadow dark:bg-gray-800 dark:border',
    isCompleted ? 'opacity-70' : 'hover:shadow-lg',
    isRevisit 
        ? 'border-2 border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500' 
        : (site.isPriority ? 'border-2 border-red-500 dark:border-red-500' : 'dark:border-gray-700'),
    isTodaysRoute && !isCompleted && !isRevisit ? 'border-2 border-green-500' : ''
  ].join(' ');

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReportClick = (initialStatus: ReportStatus = 'Visit Complete', isManagementNote: boolean = false) => {
      // Trigger background tracking when opening report modal
      if (user?.role === 'consultant' && !isReadOnly) {
          logVisitActivity(site.id);
      }
      if (onReport) {
          onReport(site, initialStatus, isManagementNote);
      }
  };

  const handleViewClick = (report: Report) => {
      // Viewing a past report is also a form of interaction, arguably "working on" the site context
      // But to be precise, usually we only care about "working on current visit".
      // However, user might reference old report before starting new. Let's log it as activity.
      if (user?.role === 'consultant' && !isReadOnly) {
          logVisitActivity(site.id);
      }
      setViewingReport(report);
  };

  return (
      <div className={cardClasses}>
        <div className="flex-grow">
          <div className="flex items-start justify-between">
             <h3 className="flex items-start text-lg font-bold text-brand-secondary dark:text-white">
                {displayIndex && <span className="mr-2 text-gray-400">{displayIndex}.</span>}
                <span className="flex-1">
                  {site.clientName}
                  {site.siteGroupId && <LinkIcon className="inline-block w-4 h-4 ml-2 text-gray-400" title="Linked Site" />}
                </span>
             </h3>
             {site.isPriority && <StarIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" aria-label="Priority Site"/>}
          </div>
          
          <div className="flex items-center mt-1 space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <LocationMarkerIcon className="flex-shrink-0 w-4 h-4" />
            <span>{site.address}</span>
          </div>

          {/* Revisit Badge */}
          {isRevisit && (
            <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <RefreshIcon className="w-3 h-3 mr-1" /> Potential Revisit
                </span>
            </div>
          )}
          
          {/* Management Specific Details: Distributed To & Recent Visit */}
          {!site.hideManagementInfo && user?.role === 'management' && (
             <div className="mt-2 p-2 bg-gray-50 rounded-md dark:bg-gray-700/30 text-xs space-y-1">
                 <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <UserIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    <span className="font-semibold mr-1">Distributed to:</span>
                    <span>{assignedConsultant?.name || 'Unassigned'}</span>
                 </div>
                 <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <ClockIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    <span className="font-semibold mr-1">Recent Visit:</span>
                    <span>{formatDateString(site.lastVisited) || 'None'}</span>
                 </div>
             </div>
          )}

          {site.isPriority && site.priorityNote && (
            <p className="p-2 mt-2 text-xs text-red-800 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">{site.priorityNote}</p>
          )}
          
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Frequency</dt>
                  <dd className="font-medium text-gray-800 dark:text-gray-200">{site.frequency}</dd>
              </div>
              <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="flex flex-wrap gap-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfoMap[site.status].bg} ${statusInfoMap[site.status].text}`}>{site.status}</span>
                      {site.status === 'On Hold' && site.onHoldApprovalStatus === 'Pending' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">Pending Review</span>
                      )}
                  </dd>
              </div>
              {site.status === 'On Hold' && (
                  <div className="sm:col-span-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50">
                      <dt className="text-xs font-bold text-amber-800 dark:text-amber-300">On Hold Details</dt>
                      <dd className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                         <p>Until: {formatDateString(site.onHoldEnd)}</p>
                         <p className="italic">"{site.onHoldReason}"</p>
                      </dd>
                  </div>
              )}
              <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Scope of Work</dt>
                  <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{site.scopeOfWork || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Site Contacts</dt>
                  <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                      {site.contacts.length > 0 ? (
                          <ul className="space-y-1 list-disc list-inside">
                              {site.contacts.map((contact, index) => (
                                  <li key={index}><span className="font-semibold">{contact.role}:</span> {contact.name} ({contact.info})</li>
                              ))}
                          </ul>
                      ) : <span className="italic">No contacts listed.</span>}
                  </dd>
              </div>
              <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Recent Visit History</dt>
                  <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                      {visitHistory.length > 0 ? (
                          <ul className="space-y-1">
                              {visitHistory.map(report => {
                                  const consultant = users.find(u => u.id === report.consultantId);
                                  return (
                                      <li key={report.id} className="text-xs flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                          <span className="truncate mr-2">
                                              {formatDateString(report.visitDate)} - <span className="font-bold">{report.status}</span> {consultant && `(by ${consultant.name})`}
                                          </span>
                                          <button
                                              onClick={(e) => { e.stopPropagation(); handleViewClick(report); }}
                                              className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800 transition-colors"
                                              title="View Report Details"
                                          >
                                              <DocumentTextIcon className="w-3 h-3 mr-1"/> View
                                          </button>
                                      </li>
                                  );
                              })}
                          </ul>
                      ) : <span className="text-xs italic">No recent history. Last visit: {formatDateString(site.lastVisited) || 'N/A'}</span>}
                  </dd>
              </div>
          </dl>

          {user?.role === 'management' && site.initialVisitRequestor && (
            <div className="mt-3 px-3 py-2 text-xs bg-purple-50 border border-purple-200 rounded-md dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700 flex items-start">
                <PhoneIcon className="w-4 h-4 mr-2 text-purple-700 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold block text-purple-900 dark:text-purple-100 mb-0.5">Initial Requestor:</span>
                    {site.initialVisitRequestor}
                </div>
            </div>
          )}

          {isCompleted && report && (
            <div className="p-3 mt-4 text-sm border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div>
                    <p><span className="font-semibold">Status:</span> {report.status}</p>
                    <p className="mt-1 italic text-gray-600 dark:text-gray-400">"{report.notes}"</p>
                    {report.reviewStatus === 'pending' && <p className="mt-1 font-semibold text-yellow-600">Change pending approval.</p>}
                </div>
                {report.deliveredItems && Object.keys(report.deliveredItems).length > 0 && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Delivered Items:</p>
                        <ul className="text-xs list-disc list-inside text-gray-500 dark:text-gray-400">
                            {(Object.entries(report.deliveredItems) as [keyof DeliveredItems, number][]).map(([key, value]) => (
                                <li key={key}>{itemKeyToLabel(key)}: <span className="font-bold">{value}</span></li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
          )}
        </div>
        
        {!isCompleted && !isReadOnly && (
          <div className="pt-4 mt-auto" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
                {isTodaysRoute && (
                    <button onClick={handleNavigate} className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-white transition-colors rounded-md bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                        <DirectionsIcon className="w-5 h-5 mr-2" /> Navigate
                    </button>
                )}
                <button 
                    onClick={() => handleReportClick('Visit Complete', false)} 
                    className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                    <PencilAltIcon className="w-5 h-5 mr-2" /> File Visit Report
                </button>
                {isRevisit && (
                    <button 
                        onClick={() => handleReportClick('Revisit Waived', true)}
                        className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                        <XCircleIcon className="w-5 h-5 mr-2" /> Waive Revisit
                    </button>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button 
                        onClick={() => onPlanSite && onPlanSite(site)} 
                        className="flex items-center justify-center w-full px-2 py-2.5 text-sm font-semibold text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2"
                    >
                        <CalendarPlusIcon className="w-5 h-5" />
                    </button>
                     <button 
                        onClick={() => onHold && onHold(site)} 
                        className="flex items-center justify-center w-full px-2 py-2.5 text-sm font-semibold text-amber-800 transition-colors bg-amber-100 rounded-md dark:bg-amber-900/50 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2" 
                        title="Put Site On Hold"
                    >
                        <PauseIcon className="w-5 h-5" />
                    </button>
                     <button 
                        onClick={() => handleReportClick('Site Not Active', true)} 
                        className="flex items-center justify-center w-full px-2 py-2.5 text-sm font-semibold text-red-800 transition-colors bg-red-100 rounded-md dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/80 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2" 
                        title="Flag Issue / Inactive"
                    >
                        <FlagIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        )}
        {viewingReport && (
            <ReportPrintModal
                report={viewingReport}
                site={site}
                consultant={users.find(u => u.id === viewingReport.consultantId)}
                onClose={() => setViewingReport(null)}
            />
        )}
      </div>
  );
};

export default SiteCard;
