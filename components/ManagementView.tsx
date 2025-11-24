
import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { 
    DocumentTextIcon, 
    UserEditIcon, 
    ClipboardListIcon, 
    CalendarWeekIcon,
    ChartPieIcon,
    CheckBadgeIcon,
    MapIcon,
    CogIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    MenuIcon,
    XIcon,
    TrendingUpIcon,
    HistoryIcon,
    BulletinBoardIcon,
    AcademicCapIcon,
    CurrencyDollarIcon,
    CreditCardIcon,
    LocationMarkerIcon // Using LocationMarker for Tracking tab icon
} from './icons';
import Spinner from './common/Spinner';
import SiteEditModal from './SiteEditModal';
import { Site } from '../types';
import ProcedureEditModal from './ProcedureEditModal';
import PriorityNoteModal from './PriorityNoteModal';


const AllSitesView = lazy(() => import('./AllSitesView'));
const ConsultantSchedulesView = lazy(() => import('./ConsultantSchedulesView'));
const AnalyticsDashboardView = lazy(() => import('./AnalyticsDashboardView'));
const UserManagementView = lazy(() => import('./UserManagementView'));
const ProceduresView = lazy(() => import('./ProceduresView'));
const ReviewView = lazy(() => import('./ReviewView'));
const RoutePlanningView = lazy(() => import('./RoutePlanningView'));
const SettingsView = lazy(() => import('./SettingsView'));
const SafetyEquipmentView = lazy(() => import('./SafetyEquipmentView'));
const ComplaintsView = lazy(() => import('./ComplaintsView'));
const GrowthIncentivesView = lazy(() => import('./GrowthIncentivesView'));
const ActivityLogView = lazy(() => import('./ActivityLogView'));
const BulletinBoardView = lazy(() => import('./BulletinBoardView'));
const TrainingView = lazy(() => import('./TrainingView'));
const GrowthAnalyticsView = lazy(() => import('./GrowthAnalyticsView'));
const BillingView = lazy(() => import('./BillingView'));
const ConsultantTrackingView = lazy(() => import('./ConsultantTrackingView'));


type MgmtTab = 'sites' | 'schedules' | 'routes' | 'tracking' | 'analytics' | 'growth' | 'safety-equipment' | 'review' | 'procedures' | 'complaints' | 'incentives' | 'activity' | 'users' | 'bulletin' | 'training' | 'settings' | 'billing';

const ManagementView: React.FC = () => {
  const { reports, complaints, isLoading, announcements, user, pendingNavigation, clearPendingNavigation } = useAppContext();
  const [activeTab, setActiveTab] = useState<MgmtTab>('sites');
  const [editingSite, setEditingSite] = useState<Site | 'new' | null>(null);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [prioritizingSite, setPrioritizingSite] = useState<Site | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pendingReviewCount = useMemo(() => reports.filter(r => r.reviewStatus === 'pending').length, [reports]);
  const openComplaintsCount = useMemo(() => complaints.filter(c => c.status === 'Open').length, [complaints]);
  
  // Effect to handle incoming navigation requests from alerts/toasts
  useEffect(() => {
      if (pendingNavigation && pendingNavigation.view === 'management' && pendingNavigation.tab) {
          setActiveTab(pendingNavigation.tab as MgmtTab);
          clearPendingNavigation();
      }
  }, [pendingNavigation, clearPendingNavigation]);

  // Calculate Badge Counts based on Active Alerts/Announcements
  const getBadgeCount = (tabKey: string, baseCount: number = 0) => {
      if (!user) return baseCount;
      const alertCount = announcements.filter(a => 
          (a.targetUserId === user.id || !a.targetUserId) && // Targeted or Global
          !a.isAcknowledged && // Active only
          a.navTarget?.tab === tabKey // Matches this tab
      ).length;
      return baseCount + alertCount;
  };

  const tabs = [
    { id: 'sites', label: 'Site Management', icon: DocumentTextIcon, badge: getBadgeCount('sites') },
    { id: 'schedules', label: 'Consultant Schedules', icon: CalendarWeekIcon, badge: getBadgeCount('schedules') },
    { id: 'routes', label: 'Route Planning', icon: MapIcon, badge: getBadgeCount('routes') },
    { id: 'tracking', label: 'Live Tracking', icon: LocationMarkerIcon, badge: getBadgeCount('tracking') }, // New Tab
    { id: 'analytics', label: 'Analytics', icon: ChartPieIcon, badge: getBadgeCount('analytics') },
    { id: 'growth', label: 'Growth & Seasonal Insights', icon: TrendingUpIcon, badge: getBadgeCount('growth') },
    { id: 'safety-equipment', label: 'Safety Equipment', icon: ShieldCheckIcon, badge: getBadgeCount('safety-equipment') },
    { id: 'review', label: 'Review & Approvals', icon: CheckBadgeIcon, badge: getBadgeCount('review', pendingReviewCount) },
    { id: 'procedures', label: 'Procedures', icon: ClipboardListIcon, badge: getBadgeCount('procedures') },
    { id: 'complaints', label: 'Damage Control', icon: ShieldExclamationIcon, badge: getBadgeCount('complaints', openComplaintsCount) },
    { id: 'incentives', label: 'Incentive Program', icon: CurrencyDollarIcon, badge: getBadgeCount('incentives') },
    { id: 'billing', label: 'Billing', icon: CreditCardIcon, badge: getBadgeCount('billing') },
    { id: 'activity', label: 'Activity Log', icon: HistoryIcon, badge: getBadgeCount('activity') },
    { id: 'bulletin', label: 'Bulletin Board', icon: BulletinBoardIcon, badge: getBadgeCount('bulletin') },
    { id: 'training', label: 'Training & Certs', icon: AcademicCapIcon, badge: getBadgeCount('training') },
    { id: 'users', label: 'User Management', icon: UserEditIcon, badge: getBadgeCount('users') },
    { id: 'settings', label: 'Settings', icon: CogIcon, badge: getBadgeCount('settings') },
  ];

  const renderActiveTab = () => {
    switch(activeTab) {
      case 'sites': return <AllSitesView onEditSite={setEditingSite} onSetPriority={setPrioritizingSite} />;
      case 'schedules': return <ConsultantSchedulesView />;
      case 'routes': return <RoutePlanningView />;
      case 'tracking': return <ConsultantTrackingView />;
      case 'analytics': return <AnalyticsDashboardView />;
      case 'growth': return <GrowthAnalyticsView />;
      case 'safety-equipment': return <SafetyEquipmentView />;
      case 'review': return <ReviewView />;
      case 'procedures': return <ProceduresView onAddProcedure={() => setIsProcedureModalOpen(true)} />;
      case 'complaints': return <ComplaintsView />;
      case 'incentives': return <GrowthIncentivesView />;
      case 'billing': return <BillingView />;
      case 'activity': return <ActivityLogView />;
      case 'bulletin': return <BulletinBoardView />;
      case 'training': return <TrainingView />;
      case 'users': return <UserManagementView />;
      case 'settings': return <SettingsView />;
      default: return null;
    }
  };

  const handleTabClick = (tabId: MgmtTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  }

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Menu';

  return (
    <div className="space-y-8">
      {isLoading && <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-black/20"><Spinner /></div>}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">Management Dashboard</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Oversee all consultant activities and address flagged items.</p>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-8">
        {/* Mobile Navigation */}
        <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="flex items-center justify-between w-full p-3 text-left bg-white border rounded-md dark:bg-gray-800 dark:border-gray-700">
                <span className="font-semibold text-gray-800 dark:text-white">{activeTabLabel}</span>
                <MenuIcon className="w-6 h-6 text-gray-500" />
            </button>
            {isMobileMenuOpen && (
                 <div className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                        <h2 className="font-bold text-gray-800 dark:text-white">Navigation</h2>
                        <button onClick={() => setIsMobileMenuOpen(false)}>
                            <XIcon className="w-6 h-6 text-gray-500"/>
                        </button>
                    </div>
                     <div className="flex-1 p-4 overflow-y-auto">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id as MgmtTab)}
                                className={`group w-full flex items-center text-left p-3 rounded-md text-base font-medium transition-colors ${activeTab === tab.id 
                                    ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' 
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                <tab.icon className="flex-shrink-0 w-6 h-6 mr-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                                <span className="flex-grow">{tab.label}</span>
                                {tab.badge > 0 && (
                                    <span className="ml-2 flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white rounded-full bg-status-flagged">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        {/* Desktop Navigation */}
        <aside className="hidden md:block md:w-1/4 lg:w-1/5 flex-shrink-0">
            <div className="flex flex-col space-y-1">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as MgmtTab)}
                        className={`group w-full flex items-center text-left px-3 py-3 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id 
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        <tab.icon className="flex-shrink-0 w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                        <span className="flex-grow whitespace-nowrap">{tab.label}</span>
                        {tab.badge > 0 && (
                            <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white rounded-full bg-status-flagged">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </aside>

        <div className="mt-6 md:mt-0 md:flex-1">
            <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner /></div>}>
                {renderActiveTab()}
            </Suspense>
        </div>
      </div>
      
      {editingSite && (
          <SiteEditModal
            site={editingSite === 'new' ? undefined : editingSite}
            onClose={() => setEditingSite(null)}
          />
      )}
      {isProcedureModalOpen && (
          <ProcedureEditModal onClose={() => setIsProcedureModalOpen(false)} />
      )}
      {prioritizingSite && (
          <PriorityNoteModal
            site={prioritizingSite}
            onClose={() => setPrioritizingSite(null)}
          />
      )}
    </div>
  );
};

export default ManagementView;
