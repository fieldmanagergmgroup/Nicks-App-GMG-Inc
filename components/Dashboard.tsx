
import React, { useState, Suspense, lazy, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import Header from './Header';
import Spinner from './common/Spinner';
import { MegaphoneIcon, CogIcon, BulletinBoardIcon, XIcon } from './icons';

const ManagementView = lazy(() => import('./ManagementView'));
const ConsultantView = lazy(() => import('./ConsultantView'));
const RoutePlanningView = lazy(() => import('./RoutePlanningView'));
const SettingsView = lazy(() => import('./SettingsView'));
const BulletinBoardView = lazy(() => import('./BulletinBoardView'));

type ManagerView = 'management' | 'consultant';
type ConsultantViewTab = 'plan' | 'route' | 'bulletin' | 'settings';

const Dashboard: React.FC = () => {
  const { user, bulletinItems, pendingNavigation, clearPendingNavigation, announcements, acknowledgeAnnouncement, setPendingNavigation } = useAppContext();
  const [activeManagerView, setActiveManagerView] = useState<ManagerView>('management');
  const [activeConsultantTab, setActiveConsultantTab] = useState<ConsultantViewTab>('plan');

  // Effect to switch views based on clicked toasts/alerts
  useEffect(() => {
      if (pendingNavigation && user) {
           if (user.role === 'management') {
               if (pendingNavigation.view === 'management') {
                   setActiveManagerView('management');
               } else if (pendingNavigation.view === 'consultant') {
                   setActiveManagerView('consultant');
               }
           }
      }
  }, [pendingNavigation, user]);

  const unreadBulletinCount = useMemo(() => {
    if (!user) return 0;
    return bulletinItems.filter(item => !item.acknowledgments.some(ack => ack.userId === user.id)).length;
  }, [bulletinItems, user]);

  const AnnouncementBanner: React.FC = () => {
    const { setPendingNavigation } = useAppContext();
    
    const activeBanner = useMemo(() => {
      if (!user) return null;
      // Strictly filter for 'banner' or 'critical' types. 
      // General alerts (type='general') will NOT show here.
      const banners = announcements.filter(a => 
        (a.type === 'banner' || a.type === 'critical') && 
        (a.targetUserId === user.id || !a.targetUserId) &&
        !a.isAcknowledged
      );
      // Show the most recent one if multiple exist
      return banners.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [announcements, user]);

    if (!activeBanner) return null;

    const handleBannerClick = () => {
        if (activeBanner.navTarget) {
            setPendingNavigation(activeBanner.navTarget);
        }
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        acknowledgeAnnouncement(activeBanner.id);
    };

    return (
      <div 
        className="relative z-40 bg-red-600 cursor-pointer transition-colors hover:bg-red-700"
        onClick={handleBannerClick}
      >
        <div className="px-3 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center flex-1 w-0">
              <span className="flex p-2 bg-red-800 rounded-lg">
                <MegaphoneIcon className="w-6 h-6 text-white" aria-hidden="true" />
              </span>
              <p className="ml-3 font-medium text-white truncate">
                <span className="md:hidden">{activeBanner.message}</span>
                <span className="hidden md:inline">{activeBanner.message}</span>
              </p>
            </div>
            <div className="flex-shrink-0 order-2 sm:order-3 sm:ml-3">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex p-2 -mr-1 rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2 relative z-50"
                aria-label="Dismiss"
              >
                <XIcon className="w-6 h-6 text-white" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ManagerViewSwitcher: React.FC = () => (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex -mb-px space-x-6 overflow-x-auto sm:space-x-8">
          <button
            onClick={() => setActiveManagerView('management')}
            className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeManagerView === 'management'
                ? 'border-gray-800 text-gray-900 dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'
            }`}
          >
            Management Dashboard
          </button>
          <button
            onClick={() => setActiveManagerView('consultant')}
            className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeManagerView === 'consultant'
                ? 'border-gray-800 text-gray-900 dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'
            }`}
          >
            My Route List
          </button>
        </div>
      </div>
    </div>
  );

  const ConsultantTabs: React.FC = () => {
      // Determine if the user is a consultant OR a manager acting as a consultant
      const isConsultantMode = user?.role === 'consultant' || (user?.role === 'management' && activeManagerView === 'consultant');

      return (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex -mb-px space-x-6 overflow-x-auto sm:space-x-8">
              <button
                onClick={() => setActiveConsultantTab('plan')}
                className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeConsultantTab === 'plan'
                    ? 'border-gray-800 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'
                }`}
              >
                My Weekly Plan
              </button>
              <button
                onClick={() => setActiveConsultantTab('route')}
                className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeConsultantTab === 'route'
                    ? 'border-gray-800 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'
                }`}
              >
                Route Planning
              </button>
              
              {/* Enable these tabs for managers in consultant view as well to match consultant experience */}
              <button
                onClick={() => setActiveConsultantTab('bulletin')}
                className={`flex items-center flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeConsultantTab === 'bulletin'
                    ? 'border-gray-800 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'
                }`}
              >
                <BulletinBoardIcon className="w-4 h-4 mr-2" />
                Bulletin Board
                {unreadBulletinCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
                        {unreadBulletinCount}
                    </span>
                )}
              </button>
              <button
                onClick={() => setActiveConsultantTab('settings')}
                className={`flex items-center flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeConsultantTab === 'settings'
                    ? 'border-gray-800 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'
                }`}
              >
                <CogIcon className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      );
  };

  const viewToShow = () => {
    // Logic for Consultant Users
    if (user?.role === 'consultant') {
      switch (activeConsultantTab) {
        case 'plan': return <ConsultantView />;
        case 'route': return <RoutePlanningView isConsultantView={true} />;
        case 'bulletin': return <BulletinBoardView />;
        case 'settings': return <SettingsView />;
        default: return <ConsultantView />;
      }
    }
    
    // Logic for Management Users
    if (user?.role === 'management') {
      if (activeManagerView === 'management') {
          return <ManagementView />;
      } else {
          // Management in "My Route List" mode
          switch (activeConsultantTab) {
            case 'plan': return <ConsultantView />;
            case 'route': return <RoutePlanningView isConsultantView={true} />;
            case 'bulletin': return <BulletinBoardView />;
            case 'settings': return <SettingsView />;
            default: return <ConsultantView />;
          }
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen">
      <Header />
      <AnnouncementBanner />
      {user?.role === 'management' && <ManagerViewSwitcher />}
      
      {(user?.role === 'consultant' || (user?.role === 'management' && activeManagerView === 'consultant')) && <ConsultantTabs />}
      
      <main className="p-4 mx-auto max-w-7xl sm:p-6 lg:p-8">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner /></div>}>
          {viewToShow()}
        </Suspense>
      </main>
    </div>
  );
};

export default Dashboard;
