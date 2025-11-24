
import React, { useMemo, useEffect, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import SiteCard from './SiteCard';
import { Site, Report, Weekday, ReportStatus } from '../types';
import EmptyState from './common/EmptyState';
import { ClipboardCheckIcon, PauseIcon, ListIcon, ViewBoardsIcon, LocationMarkerIcon, CalendarPlusIcon, PencilAltIcon, ArrowUturnLeftIcon, RefreshIcon, XCircleIcon } from './icons';
import EarlyVisitConfirmationModal from './EarlyVisitConfirmationModal';
import { RECENT_FRIDAY } from '../data/mockData';
import ReportModal from './ReportModal';
import PlanVisitModal from './PlanVisitModal';
import { getWeekRange } from '../utils/dateUtils';

const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
type ViewMode = 'list' | 'expanded';
type PlanLocation = Weekday | 'todo';

interface ConsultantViewProps {
  consultantId?: number;
  isReadOnly?: boolean;
}

const FREQUENCY_WEIGHT: Record<string, number> = {
    'Weekly': 1,
    'Bi-Weekly': 2,
    'Monthly': 3,
    'Shop Audit': 4
};

// --- Sub-component: Compact Site Row (for List View) ---
const CompactSiteRow: React.FC<{
    site: Site;
    onReport: (site: Site, status?: ReportStatus) => void;
    onPlan: (site: Site) => void;
    onHold: (site: Site) => void;
    onUndo?: (site: Site) => void;
    currentLocation: PlanLocation;
    isReadOnly?: boolean;
    isRevisit?: boolean;
}> = ({ site, onReport, onPlan, onHold, onUndo, currentLocation, isReadOnly, isRevisit }) => {
    const isCompleted = site.status === 'Completed' || site.status === 'Not Active';
    return (
        <div className={`flex flex-col p-3 mb-2 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between ${isCompleted && !isRevisit ? 'opacity-60' : ''} ${isRevisit ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800' : ''}`}>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {site.clientName}
                    {isRevisit && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"><RefreshIcon className="w-3 h-3 mr-1"/> Potential Revisit</span>}
                </h4>
                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                     <LocationMarkerIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                     <span className="truncate">{site.address}, {site.city}</span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                     <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">{site.frequency}</span>
                     {site.isPriority && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded dark:bg-red-900/30 dark:text-red-300">Priority</span>}
                </div>
            </div>
            
            {!isReadOnly && !isCompleted && site.status !== 'On Hold' && (
                <div className="flex items-center mt-3 space-x-2 sm:mt-0 sm:ml-4">
                    {isRevisit && (
                        <button onClick={() => onReport(site, 'Revisit Waived')} className="p-2 text-amber-600 bg-amber-50 rounded-full hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40" title="Waive Revisit">
                             <XCircleIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => onReport(site, 'Visit Complete')} className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40" title="File Report">
                        <PencilAltIcon className="w-5 h-5" />
                    </button>
                     <button onClick={() => onPlan(site)} className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600" title="Change Day">
                        <CalendarPlusIcon className="w-5 h-5" />
                    </button>
                     <button onClick={() => onHold(site)} className="p-2 text-amber-600 bg-amber-50 rounded-full hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40" title="Hold">
                        <PauseIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            {(isCompleted || site.status === 'On Hold') && !isReadOnly && (
                <div className="flex items-center mt-3 space-x-2 sm:mt-0 sm:ml-4">
                    {onReport && isCompleted && (
                        <button onClick={() => onReport(site)} className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300" title="Edit Report">
                            <PencilAltIcon className="w-5 h-5" />
                        </button>
                    )}
                    {onUndo && (
                         <button onClick={() => onUndo(site)} className="p-2 text-green-600 bg-green-50 rounded-full hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300" title="Undo / Restore">
                            <ArrowUturnLeftIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}
             {site.status === 'On Hold' && (
                <span className="mt-2 sm:mt-0 px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded dark:bg-amber-900/50 dark:text-amber-300">On Hold</span>
            )}
            {isCompleted && !isRevisit && (
                 <span className="mt-2 sm:mt-0 px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded dark:bg-green-900/50 dark:text-green-300">Completed</span>
            )}
        </div>
    );
};


const ConsultantView: React.FC<ConsultantViewProps> = ({ consultantId, isReadOnly = false }) => {
  const { user, users, sites, reports, weeklyPlans, updateWeeklyPlan, deleteReport, clearSiteHold } = useAppContext();
  const [viewMode, setViewMode] = useState<ViewMode>('expanded');
  
  // Modals State
  const [earlyVisitCandidate, setEarlyVisitCandidate] = useState<{ site: Site; targetDay: Weekday; sourceDay: Weekday; } | null>(null);
  const [reportModalState, setReportModalState] = useState<{ isOpen: boolean; site?: Site; initialStatus: ReportStatus; isManagementNote: boolean; existingReport?: Report }>({ isOpen: false, initialStatus: 'Visit Complete', isManagementNote: false });
  const [planModalState, setPlanModalState] = useState<{ isOpen: boolean; site?: Site; currentLocation?: PlanLocation }>({ isOpen: false });

  const currentConsultantId = consultantId || user?.id;
  const rawPlan = weeklyPlans[currentConsultantId || 0];
  const getFreshSite = (s: Site) => sites.find(latest => latest.id === s.id) || s;

  const isSiteCompletedThisWeek = (siteId: number) => {
      // Only considered completed if there is a SUCCESSFUL visit report or a WAIVED visit report
      // FIX: Use getWeekRange to ensure we check the whole week, not just today
      const { start, end } = getWeekRange(new Date());
      
      const report = reports.find(r => 
          r.siteId === siteId && 
          r.consultantId === currentConsultantId && 
          new Date(r.visitDate) >= start && 
          new Date(r.visitDate) <= end
      );
      
      // If status is "Site Not Active", it is NOT completed in the traditional sense, allowing for revisit.
      if (report && report.status === 'Site Not Active') {
          return false; 
      }
      
      const site = sites.find(s => s.id === siteId);
      return !!report || site?.status === 'Completed';
  };

  const mySites = useMemo(() => sites.filter(site => site.assignedConsultantId === currentConsultantId), [sites, currentConsultantId]);
  
  useEffect(() => {
    if (currentConsultantId && !weeklyPlans[currentConsultantId] && !isReadOnly && mySites.length > 0) {
        const activeSites = mySites.filter(site => site.status === 'Active' && !isSiteCompletedThisWeek(site.id));
        updateWeeklyPlan(currentConsultantId, {
            todo: activeSites,
            planned: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] },
        });
    }
  }, [mySites, weeklyPlans, currentConsultantId, isReadOnly, updateWeeklyPlan, reports]);

  if (!currentConsultantId) return null;

  const displayData = useMemo(() => {
      if (!rawPlan) return { todo: [], planned: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] }, onHold: [], completed: [], revisits: [], revisitsSet: new Set<number>() };

      const onHold: Site[] = [];
      const completed: Site[] = [];
      const activeTodo: Site[] = [];
      const activePlanned: Record<Weekday, Site[]> = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
      const revisits: Site[] = [];

      const { start, end } = getWeekRange(new Date());

      const processSite = (siteStub: Site, plannedDay?: Weekday) => {
          const site = getFreshSite(siteStub);

          // 1. Check if already fully completed this week (Complete, Cancelled, Finished, OR Waived)
          const completedReport = reports.find(r => 
             r.siteId === site.id && r.consultantId === currentConsultantId && 
             (r.status === 'Visit Complete' || r.status === 'Revisit Waived' || r.status === 'Project Finished' || r.status === 'Client Cancelled') &&
             new Date(r.visitDate) >= start && new Date(r.visitDate) <= end
          );
          
          if (completedReport) {
              // Only show in completed list if it was completed THIS week
              completed.push(site);
              return;
          }
          
          if (site.status === 'Completed') {
              // Permanently completed/finished projects are hidden from the active weekly plan to reduce clutter
              return;
          }

          // 2. Check if site was marked 'Not Active' this week (needing revisit)
          const notActiveReport = reports.find(r => 
              r.siteId === site.id && 
              r.consultantId === currentConsultantId && 
              r.status === 'Site Not Active' &&
              new Date(r.visitDate) >= start &&
              new Date(r.visitDate) <= end
          );

          if (notActiveReport) {
              revisits.push(site);
              return; // Exclude from normal plan, move to separate 'revisit' list
          }

          if (site.status === 'On Hold') {
              onHold.push(site);
          } else {
              if (plannedDay) activePlanned[plannedDay].push(site);
              else activeTodo.push(site);
          }
      };

      rawPlan.todo.forEach(s => processSite(s));
      WEEKDAYS.forEach(day => rawPlan.planned[day].forEach(s => processSite(s, day)));
      
      // Sort functions
      const sortByFrequency = (a: Site, b: Site) => {
          const weightA = FREQUENCY_WEIGHT[a.frequency] || 99;
          const weightB = FREQUENCY_WEIGHT[b.frequency] || 99;
          if (weightA !== weightB) return weightA - weightB;
          return a.clientName.localeCompare(b.clientName);
      };

      activeTodo.sort(sortByFrequency);
      revisits.sort(sortByFrequency); // Sort revisits by frequency too

      return { 
          todo: activeTodo, 
          revisits: revisits,
          planned: activePlanned, 
          onHold, 
          completed, 
          revisitsSet: new Set(revisits.map(s => s.id)) 
      };
  }, [rawPlan, sites, reports, currentConsultantId]);

  const executePlanMove = (siteId: number, targetDay: Weekday | 'todo', sourceDay: Weekday | 'todo') => {
    if (!rawPlan) return;
    const newPlan = JSON.parse(JSON.stringify(rawPlan));
    let siteToMove: Site | undefined;

    if (sourceDay === 'todo') {
        const index = newPlan.todo.findIndex((s: Site) => s.id === siteId);
        if (index > -1) [siteToMove] = newPlan.todo.splice(index, 1);
    } else {
        const index = newPlan.planned[sourceDay].findIndex((s: Site) => s.id === siteId);
        if (index > -1) [siteToMove] = newPlan.planned[sourceDay].splice(index, 1);
    }

    if (siteToMove) {
        if (targetDay === 'todo') {
            newPlan.todo.unshift(siteToMove);
        } else {
            newPlan.planned[targetDay].push(siteToMove);
        }
        updateWeeklyPlan(currentConsultantId, newPlan);
    }
  };

  const planSiteCheck = (siteId: number, targetDay: Weekday | 'todo', sourceDay: Weekday | 'todo') => {
    if (isReadOnly || targetDay === sourceDay) return;
    const site = sites.find(s => s.id === siteId);
    
    if (site && targetDay === 'Monday' && site.frequency === 'Weekly' && !site.isPriority && site.lastVisited === RECENT_FRIDAY) {
        setEarlyVisitCandidate({ site, targetDay, sourceDay });
        return;
    }
    executePlanMove(siteId, targetDay, sourceDay);
    setPlanModalState({ isOpen: false });
  };
  
  const findReportForSite = (siteId: number): Report | undefined => {
    if (!currentConsultantId) return undefined;
    const { start, end } = getWeekRange(new Date());
    const siteReports = reports.filter(r => 
        r.siteId === siteId && 
        r.consultantId === currentConsultantId && 
        new Date(r.visitDate) >= start && 
        new Date(r.visitDate) <= end
    );
    // Return the latest one
    return siteReports.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];
  };

  const consultantName = useMemo(() => users.find(u => u.id === currentConsultantId)?.name, [users, currentConsultantId]);
  const todaysWeekday = useMemo(() => { const d = new Date().getDay(); return WEEKDAYS[d > 0 ? d - 1 : 6]; }, []);

  // --- Modal Handlers ---
  const openReportModal = (site: Site, initialStatus: ReportStatus = 'Visit Complete', isManagementNote = false) => {
      const existingReport = findReportForSite(site.id);
      setReportModalState({ isOpen: true, site, initialStatus, isManagementNote, existingReport });
  };
  
  const openPlanModal = (site: Site) => {
       let currentLocation: PlanLocation = 'todo';
       WEEKDAYS.forEach(day => {
           if (displayData.planned[day].find(s => s.id === site.id)) currentLocation = day;
       });
       setPlanModalState({ isOpen: true, site, currentLocation });
  };

  // When clicking "Hold", open the Report Modal with "On Hold" status pre-selected.
  const openHoldModal = (site: Site) => {
      openReportModal(site, 'On Hold');
  };

  // --- Undo Actions ---
  
  const handleUndoAction = (site: Site) => {
      if (site.status === 'On Hold') {
          if(window.confirm("Resume this site? It will return to active status.")) {
              clearSiteHold(site.id);
          }
      } else {
          const report = findReportForSite(site.id);
          if (report) {
              if(window.confirm("Undo completion? This will delete the report and mark the site as active.")) {
                  deleteReport(report.id);
              }
          }
      }
  };

  // --- Render Helpers ---
  const renderSiteCard = (site: Site, location: PlanLocation, isCompleted = false, isHold = false) => {
      const isRevisit = displayData.revisitsSet.has(site.id);
      return (
          <div key={site.id} className="relative group">
            <SiteCard 
                site={site} 
                report={isCompleted ? findReportForSite(site.id) : undefined}
                isCompleted={isCompleted}
                currentLocation={location} 
                isReadOnly={isReadOnly} 
                isTodaysRoute={location === todaysWeekday}
                hideManagementInfo={true}
                isRevisit={isRevisit}
                onReport={openReportModal}
                onHold={openHoldModal}
                onPlanSite={() => openPlanModal(site)}
            />
            {/* Overlay Actions for Completed/Hold items in Expanded View */}
            {(isCompleted || isHold) && !isReadOnly && (
                <div className="absolute top-2 right-2 flex space-x-1">
                    {isCompleted && (
                        <button onClick={() => openReportModal(site)} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 shadow-sm" title="Edit Report">
                            <PencilAltIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => handleUndoAction(site)} className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 shadow-sm" title="Undo / Restore">
                        <ArrowUturnLeftIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
          </div>
      );
  };

  return (
    <>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col justify-between md:flex-row md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">{isReadOnly ? `${consultantName}'s Weekly Plan` : 'Your Weekly Plan'}</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{isReadOnly ? 'Viewing this consultant\'s schedule.' : 'Manage your visits for the week.'}</p>
          </div>
          {/* View Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 self-start md:self-auto">
            <button onClick={() => setViewMode('list')} className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-brand-primary dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                <ListIcon className="w-4 h-4 mr-2"/> List
            </button>
             <button onClick={() => setViewMode('expanded')} className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'expanded' ? 'bg-white dark:bg-gray-600 text-brand-primary dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                <ViewBoardsIcon className="w-4 h-4 mr-2"/> Exploded
            </button>
          </div>
        </div>
        
        {viewMode === 'expanded' ? (
            // --- EXPANDED CARD VIEW ---
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Left Column: Sites to Plan */}
                <div className="space-y-6">
                    {/* Potential Revisits Section - Top Priority */}
                    {displayData.revisits.length > 0 && (
                        <div className="p-4 space-y-4 bg-red-50 border border-red-200 rounded-lg shadow-sm dark:bg-red-900/20 dark:border-red-800">
                             <h2 className="flex items-center pb-2 text-xl font-bold border-b border-red-300 text-red-800 dark:text-red-300 dark:border-red-700">
                                <RefreshIcon className="w-5 h-5 mr-2" />
                                Potential Revisits ({displayData.revisits.length})
                            </h2>
                             <div className="space-y-3">
                                {displayData.revisits.map((site) => renderSiteCard(site, 'todo'))}
                             </div>
                        </div>
                    )}

                    {/* Standard To-Do List */}
                    <div className="p-4 space-y-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <h2 className="pb-2 text-xl font-semibold border-b-2 border-brand-primary text-brand-secondary dark:text-white">Sites to Plan ({displayData.todo.length})</h2>
                        {displayData.todo.length === 0 ? (
                            <EmptyState title="All Planned!" message="Your to-do list is empty." />
                        ) : (
                            <div className="space-y-3 max-h-[70vh] lg:max-h-[60vh] overflow-y-auto pr-2">
                                {displayData.todo.map((site) => renderSiteCard(site, 'todo'))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Weekly Plan */}
                <div className="p-4 space-y-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <h2 className="pb-2 text-xl font-semibold border-b-2 border-brand-primary text-brand-secondary dark:text-white">My Weekly Plan</h2>
                    <div className="space-y-4 max-h-[70vh] lg:max-h-[60vh] overflow-y-auto pr-2">
                        {WEEKDAYS.map(day => (
                            <div key={day}>
                                <h3 className="font-bold text-gray-700 dark:text-gray-300">{day} ({displayData.planned[day].length})</h3>
                                <div className="mt-2 space-y-3">
                                    {displayData.planned[day].length > 0 ? (
                                        displayData.planned[day].map((site) => renderSiteCard(site, day))
                                    ) : (
                                        <div className="flex items-center justify-center h-16 text-sm text-center text-gray-400 border-2 border-dashed rounded-md dark:border-gray-600 dark:text-gray-500">
                                            No active sites planned for {day}.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            // --- SUMMARY LIST VIEW ---
            <div className="space-y-6">
                 {/* Revisits Section - List View */}
                {displayData.revisits.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm dark:bg-red-900/20 dark:border-red-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-red-200 dark:border-red-800 bg-red-100 dark:bg-red-900/40">
                             <h2 className="font-bold text-red-800 dark:text-red-200 flex items-center">
                                <RefreshIcon className="w-4 h-4 mr-2"/> Potential Revisits ({displayData.revisits.length})
                            </h2>
                        </div>
                        <div className="p-4">
                             {displayData.revisits.map(site => (
                                 <CompactSiteRow 
                                    key={site.id} 
                                    site={site} 
                                    currentLocation='todo' 
                                    isRevisit={true} 
                                    onReport={(s, status) => openReportModal(s, status || 'Visit Complete')} 
                                    onPlan={() => openPlanModal(site)} 
                                    onHold={() => openHoldModal(site)} 
                                    isReadOnly={isReadOnly} 
                                />
                             ))}
                        </div>
                    </div>
                )}

                {/* Unscheduled */}
                <div className="bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                         <h2 className="font-semibold text-gray-800 dark:text-gray-200">To Plan / Unscheduled ({displayData.todo.length})</h2>
                    </div>
                    <div className="p-4">
                         {displayData.todo.length > 0 ? (
                             displayData.todo.map(site => <CompactSiteRow key={site.id} site={site} currentLocation='todo' onReport={(s) => openReportModal(s)} onPlan={() => openPlanModal(site)} onHold={() => openHoldModal(site)} isReadOnly={isReadOnly} />)
                         ) : <p className="text-sm text-gray-500 dark:text-gray-400 italic">No sites left to plan.</p>}
                    </div>
                </div>

                {/* Weekly Schedule */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {WEEKDAYS.map(day => (
                         <div key={day} className="bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden flex flex-col">
                            <div className={`px-3 py-2 border-b dark:border-gray-700 ${day === todaysWeekday ? 'bg-brand-primary text-white' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                                <h3 className={`font-semibold text-sm ${day === todaysWeekday ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>{day}</h3>
                            </div>
                            <div className="p-2 flex-1 bg-gray-50/50 dark:bg-gray-800">
                                {displayData.planned[day].length > 0 ? (
                                    displayData.planned[day].map(site => <CompactSiteRow key={site.id} site={site} currentLocation={day} onReport={(s) => openReportModal(s)} onPlan={() => openPlanModal(site)} onHold={() => openHoldModal(site)} isReadOnly={isReadOnly} />)
                                ) : <div className="h-full min-h-[4rem] flex items-center justify-center text-xs text-gray-400 border-2 border-dashed rounded border-gray-200 dark:border-gray-700">Empty</div>}
                            </div>
                         </div>
                    ))}
                </div>
            </div>
        )}

        {/* Sites On Hold Pool */}
        {(displayData.onHold.length > 0 || displayData.completed.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t dark:border-gray-700">
                <div>
                    <h2 className="flex items-center pb-2 text-lg font-semibold border-b border-amber-300 text-amber-800 dark:text-amber-400 dark:border-amber-700 mb-4">
                        <PauseIcon className="w-5 h-5 mr-2" />
                        Sites On Hold ({displayData.onHold.length})
                    </h2>
                    {displayData.onHold.map(site => (
                        viewMode === 'expanded' ? 
                        <div key={site.id} className="mb-4">{renderSiteCard(site, 'todo', false, true)}</div> :
                        <CompactSiteRow key={site.id} site={site} currentLocation='todo' onReport={() => {}} onPlan={() => {}} onHold={() => {}} onUndo={() => handleUndoAction(site)} isReadOnly={isReadOnly} />
                    ))}
                </div>
                <div>
                     <h2 className="flex items-center pb-2 text-lg font-semibold border-b border-green-300 text-green-800 dark:text-green-400 dark:border-green-700 mb-4">
                        <ClipboardCheckIcon className="w-5 h-5 mr-2" />
                        Completed / Inactive ({displayData.completed.length})
                    </h2>
                    {displayData.completed.map(site => (
                        viewMode === 'expanded' ? 
                        <div key={site.id} className="mb-4">{renderSiteCard(site, 'todo', true)}</div> :
                        <CompactSiteRow key={site.id} site={site} currentLocation='todo' onReport={(s) => openReportModal(s)} onPlan={() => {}} onHold={() => {}} onUndo={() => handleUndoAction(site)} isReadOnly={isReadOnly} />
                    ))}
                </div>
            </div>
        )}
      </div>
      
      {/* Modals - Managed at ConsultantView Level */}
      {reportModalState.isOpen && reportModalState.site && (
          <ReportModal 
            site={reportModalState.site}
            onClose={() => setReportModalState(prev => ({ ...prev, isOpen: false, existingReport: undefined }))}
            initialStatus={reportModalState.initialStatus}
            isManagementNote={reportModalState.isManagementNote}
            existingReport={reportModalState.existingReport}
          />
      )}
      {planModalState.isOpen && planModalState.site && planModalState.currentLocation && (
          <PlanVisitModal 
            isOpen={true}
            onClose={() => setPlanModalState(prev => ({ ...prev, isOpen: false }))}
            siteName={planModalState.site.clientName}
            currentLocation={planModalState.currentLocation}
            onPlan={(target) => planSiteCheck(planModalState.site!.id, target, planModalState.currentLocation!)}
          />
      )}
      
      {/* Alert Modal - Rendered LAST to ensure it is on top of everything else */}
      {earlyVisitCandidate && (
        <EarlyVisitConfirmationModal
          isOpen={!!earlyVisitCandidate}
          onClose={() => setEarlyVisitCandidate(null)}
          onConfirm={() => {
            if (earlyVisitCandidate) {
              executePlanMove(earlyVisitCandidate.site.id, earlyVisitCandidate.targetDay, earlyVisitCandidate.sourceDay);
              setEarlyVisitCandidate(null);
            }
          }}
          siteName={earlyVisitCandidate?.site.clientName || ''}
        />
      )}
    </>
  );
};

export default React.memo(ConsultantView);