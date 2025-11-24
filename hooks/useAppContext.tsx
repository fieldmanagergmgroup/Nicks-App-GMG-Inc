
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { User, Site, Report, Procedure, UserRole, WeeklyPlanState, WeeklyPlan, AppContextType, ToastMessage, Theme, Announcement, Complaint, ProcedureType, RouteOptimizationConfig, Weekday, RouteMode, RouteSuggestion, ComplaintStatus, Incentive, ActionLog, BulletinItem, ActionType, Certificate, ActionLogDocument, NavigationTarget, AnnouncementType, BillingStatus, PlanGenerationOptions, VisitActivity } from '../types';
import { USERS, SITES, REPORTS, PROCEDURES, ANNOUNCEMENTS, COMPLAINTS, INCENTIVES, ACTION_LOGS, BULLETIN_ITEMS } from '../data/mockData';
import { findFastestRoute, findBalancedRoute } from '../utils/routing';
import { isSiteDue, getManagementAlert } from '../utils/scheduling';
import { safeLocalStorage } from '../utils/storage';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const INITIAL_ROUTE_CONFIG: RouteOptimizationConfig = {
    travelTimeRate: 25,
    distanceRate: 0.55,
    perSiteRate: 50,
    avgSpeedKmh: 60,
    maxDailyDriveTime: 8,
    maxDailyDistance: 500,
};

const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Migration Logic to ensure new Mock Data Loads
  useEffect(() => {
      const MIGRATION_KEY = 'v5_migration_banners_fix_v2'; 
      try {
          if (!localStorage.getItem(MIGRATION_KEY)) {
              // Clear existing user/announcement data to load new mock data
              localStorage.removeItem('users');
              localStorage.removeItem('announcements');
              localStorage.setItem(MIGRATION_KEY, 'true');
              window.location.reload();
          }
      } catch (e) {
          console.error("Migration failed", e);
      }
  }, []);

  // Core Data State - Initialized from LocalStorage if available, else Mock Data
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => safeLocalStorage.getItem('users', USERS));
  const [sites, setSites] = useState<Site[]>(() => safeLocalStorage.getItem('sites', SITES));
  const [reports, setReports] = useState<Report[]>(() => safeLocalStorage.getItem('reports', REPORTS));
  const [procedures, setProcedures] = useState<Procedure[]>(() => safeLocalStorage.getItem('procedures', PROCEDURES));
  // Hydrate announcements with a type if they are missing (for old data)
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
      const stored = safeLocalStorage.getItem<Announcement[]>('announcements', ANNOUNCEMENTS);
      return stored.map(a => ({...a, type: a.type || 'general'}));
  });
  const [complaints, setComplaints] = useState<Complaint[]>(() => safeLocalStorage.getItem('complaints', COMPLAINTS));
  const [incentives, setIncentives] = useState<Incentive[]>(() => safeLocalStorage.getItem('incentives', INCENTIVES));
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlanState>(() => safeLocalStorage.getItem('weeklyPlans', {}));
  const [actionLogs, setActionLogs] = useState<ActionLog[]>(() => safeLocalStorage.getItem('actionLogs', ACTION_LOGS));
  const [bulletinItems, setBulletinItems] = useState<BulletinItem[]>(() => safeLocalStorage.getItem('bulletinItems', BULLETIN_ITEMS));
  
  // Tracking State
  const [visitActivities, setVisitActivities] = useState<VisitActivity[]>(() => safeLocalStorage.getItem('visitActivities', []));

  // Plan Editing State
  const [draftWeeklyPlans, setDraftWeeklyPlans] = useState<WeeklyPlanState | null>(null);

  // Route Optimization State
  const [routeConfig, setRouteConfig] = useState<RouteOptimizationConfig>(INITIAL_ROUTE_CONFIG);
  const [routeSuggestions, setRouteSuggestions] = useState<RouteSuggestion | null>(null);
  
  // Import Undo State
  const [lastImportedSiteIds, setLastImportedSiteIds] = useState<number[] | null>(null);
  
  // Navigation State
  const [pendingNavigation, setPendingNavigation] = useState<NavigationTarget | null>(null);

  // UX State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setThemeState] = useState<Theme>(() => {
      if (typeof window !== 'undefined') {
          const storedTheme = localStorage.getItem('theme');
          if (storedTheme) return storedTheme as Theme;
          return 'system';
      }
      return 'light';
  });

  // Alerts Ref to prevent spamming on re-renders
  const alertsProcessedRef = useRef<boolean>(false);

  // --- Persistence Effects ---
  useEffect(() => safeLocalStorage.setItem('users', users), [users]);
  useEffect(() => safeLocalStorage.setItem('sites', sites), [sites]);
  useEffect(() => safeLocalStorage.setItem('reports', reports), [reports]);
  useEffect(() => safeLocalStorage.setItem('procedures', procedures), [procedures]);
  useEffect(() => safeLocalStorage.setItem('announcements', announcements), [announcements]);
  useEffect(() => safeLocalStorage.setItem('complaints', complaints), [complaints]);
  useEffect(() => safeLocalStorage.setItem('incentives', incentives), [incentives]);
  useEffect(() => safeLocalStorage.setItem('weeklyPlans', weeklyPlans), [weeklyPlans]);
  useEffect(() => safeLocalStorage.setItem('actionLogs', actionLogs), [actionLogs]);
  useEffect(() => safeLocalStorage.setItem('bulletinItems', bulletinItems), [bulletinItems]);
  useEffect(() => safeLocalStorage.setItem('visitActivities', visitActivities), [visitActivities]);

  const withLoading = useCallback(async <T extends any[], R>(fn: (...args: T) => Promise<R> | R, ...args: T): Promise<R> => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(res => setTimeout(res, 300)); // Simulate network delay
      const result = await fn(...args);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(message);
      addToast(message, 'error');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'success', navTarget?: NavigationTarget) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, navTarget }]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 6000); // Slightly longer duration for clickable toasts
  }, []);
  
  const resetAppData = useCallback(() => {
      if(window.confirm("Are you sure? This will reset all data to the initial demo state. This cannot be undone.")) {
          localStorage.clear();
          window.location.reload();
      }
  }, []);

  const clearPendingNavigation = useCallback(() => {
      setPendingNavigation(null);
  }, []);

  const logAction = useCallback((actionType: ActionType, details: string, siteId?: number, documents?: ActionLogDocument[]) => {
      if (!user) return;
      const site = sites.find(s => s.id === siteId);
      const newLog: ActionLog = {
          id: `log-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          siteId,
          siteName: site?.clientName,
          actionType,
          details,
          timestamp: new Date().toISOString(),
          documents
      };
      setActionLogs(prev => [newLog, ...prev]);
  }, [user, sites]);
  
  // --- Background Tracking Logic ---
  const logVisitActivity = useCallback(async (siteId: number) => {
      if (!user || user.role !== 'consultant') return;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const nowStr = new Date().toISOString();

      setVisitActivities(prev => {
          // Check if activity exists for this user/site today
          const existingIndex = prev.findIndex(a => 
              a.consultantId === user.id && 
              a.siteId === siteId && 
              a.date === todayStr
          );

          if (existingIndex >= 0) {
              // Update existing
              const newActivities = [...prev];
              newActivities[existingIndex] = {
                  ...newActivities[existingIndex],
                  lastActivityAt: nowStr,
                  // If it was completed, keep it completed. If in_progress, keep it in_progress.
                  // Status is upgraded to completed only via report submission.
              };
              return newActivities;
          } else {
              // Create new
              return [...prev, {
                  id: `act-${Date.now()}`,
                  consultantId: user.id,
                  siteId,
                  date: todayStr,
                  lastActivityAt: nowStr,
                  status: 'in_progress'
              }];
          }
      });
  }, [user]);

  const addAnnouncement = useCallback((message: string, targetUserId?: number, requiresAcknowledgment: boolean = false, type: AnnouncementType = 'general', navTarget?: NavigationTarget) => {
    const newAnnouncement: Announcement = {
        id: Date.now() + Math.random(),
        message,
        createdAt: new Date().toISOString(),
        targetUserId,
        requiresAcknowledgment,
        isAcknowledged: false,
        type,
        navTarget
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  }, []);
  
  const broadcastBanner = useCallback(async (message: string) => {
      if (!user) return;
      
      // Create an announcement for EVERY user (consultants and management)
      const newAnnouncements: Announcement[] = users.map(u => ({
          id: Date.now() + Math.random(),
          message,
          createdAt: new Date().toISOString(),
          targetUserId: u.id,
          requiresAcknowledgment: true,
          isAcknowledged: false,
          type: 'banner' // Explicitly set as banner type
      }));
      
      setAnnouncements(prev => [...newAnnouncements, ...prev]);
      addToast("Banner notification sent to all users.", "success");
      logAction('Status Change', `Broadcast banner sent: "${message}"`);
  }, [users, user, logAction, addToast]);

  const acknowledgeAnnouncement = useCallback(async (announcementId: number) => {
    if (!user) return;

    const targetAnnouncement = announcements.find(a => a.id === announcementId);
    if (!targetAnnouncement) return;

    setAnnouncements(prev => prev.map(a => 
        a.id === announcementId 
            ? { ...a, isAcknowledged: true, acknowledgedAt: new Date().toISOString() } 
            : a
    ));

    logAction('Acknowledgment', `User confirmed receipt of message: "${targetAnnouncement.message}"`);
    addToast("Receipt confirmed.", "success");

    // Notify Management that user acknowledged (only if it wasn't a self-ack)
    const managementUsers = users.filter(u => u.role === 'management');
    managementUsers.forEach(manager => {
        if (manager.id !== user.id) {
            // These are GENERAL notifications for management feed, not banners
            const notification: Announcement = {
                id: Date.now() + Math.random(),
                message: `${user.name} has confirmed receipt of message: "${targetAnnouncement.message.substring(0, 30)}..."`,
                createdAt: new Date().toISOString(),
                targetUserId: manager.id,
                requiresAcknowledgment: false, 
                type: 'general'
            };
             setAnnouncements(prev => [notification, ...prev]);
        }
    });

  }, [user, users, announcements, addToast, logAction]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // --- Management Alerts Effect ---
  useEffect(() => {
      // Check alerts only if user is management and haven't processed for this session load
      if (user?.role === 'management' && !alertsProcessedRef.current) {
          let alertCount = 0;
          const todayStr = new Date().toISOString().split('T')[0];
          const todayDate = new Date();
          todayDate.setHours(0,0,0,0);
          
          try {
              // 1. Check Site Visits
              sites.forEach(site => {
                 const alertMessage = getManagementAlert(site);
                 if (alertMessage) {
                     // Check if any alert with this message exists for today, regardless of acknowledgment status
                     const exists = announcements.some(a => 
                         a.targetUserId === user.id && 
                         a.message === alertMessage && 
                         a.createdAt.startsWith(todayStr)
                     );
                     
                     if (!exists) {
                         setAnnouncements(prev => [{
                             id: Date.now() + Math.random(),
                             message: alertMessage,
                             createdAt: new Date().toISOString(),
                             targetUserId: user.id,
                             requiresAcknowledgment: false,
                             type: 'general', // Standard alert, not a banner
                             navTarget: { view: 'management', tab: 'sites' }
                         }, ...prev]);
                         alertCount++;
                     }
                 }
              });

              // 2. Check Certificate Expirations
              if (Array.isArray(users)) {
                  users.forEach(u => {
                      if (u.role === 'consultant' && Array.isArray(u.certificates)) {
                          u.certificates.forEach(cert => {
                              if (cert && cert.expiryDate) {
                                  const expiry = new Date(cert.expiryDate);
                                  expiry.setHours(0,0,0,0);
                                  
                                  const diffTime = expiry.getTime() - todayDate.getTime();
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  
                                  let alertMsg = '';
                                  let isCritical = false;
                                  
                                  // Trigger 1: Expiring Soon (30 days out)
                                  if (diffDays <= 30 && diffDays > 0) {
                                      alertMsg = `Certificate Expiring Soon: ${u.name}'s "${cert.name}" expires in ${diffDays} days (${cert.expiryDate}).`;
                                  }
                                  // Trigger 2: Expired (Active Alert)
                                  else if (diffDays <= 0) {
                                       alertMsg = `Certificate EXPIRED: ${u.name}'s "${cert.name}" expired on ${cert.expiryDate}.`;
                                       isCritical = true;
                                  }

                                  if (alertMsg) {
                                      // Check if an announcement already exists for this specific message created TODAY
                                      // IMPORTANT: Check against all announcements, including acknowledged ones, to prevent regeneration.
                                      const exists = announcements.some(a => 
                                          (a.targetUserId === user.id || !a.targetUserId) && 
                                          a.message === alertMsg &&
                                          a.createdAt.startsWith(todayStr) 
                                      );
                                      
                                      if (!exists) {
                                          // If it's critical (Expired), make it a 'critical' type so it hits the banner
                                          // Otherwise, it's just a 'general' alert
                                          const type: AnnouncementType = isCritical ? 'critical' : 'general';
                                          const navTarget: NavigationTarget = { view: 'management', tab: 'training' };
                                          
                                          setAnnouncements(prev => [{
                                             id: Date.now() + Math.random(),
                                             message: alertMsg,
                                             createdAt: new Date().toISOString(),
                                             targetUserId: user.id,
                                             requiresAcknowledgment: true, // Alert persists until acknowledged
                                             type,
                                             navTarget
                                          }, ...prev]);
                                          alertCount++;
                                      }
                                  }
                              }
                          });
                      }
                  });
              }
          } catch (err) {
              console.error("Error generating alerts:", err);
          }
          
          alertsProcessedRef.current = true;
      }
  }, [user, sites, users, announcements, addToast]);

  const login = useCallback((userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      alertsProcessedRef.current = false; // Reset alert check on login
    }
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);
  
  const updateWeeklyPlan = useCallback((consultantId: number, plan: WeeklyPlan) => {
    setWeeklyPlans(prev => ({...prev, [consultantId]: plan}));
    logAction('Plan Update', 'User updated their weekly plan.');
  }, [logAction]);

  const addReport = useCallback(async (reportData: Omit<Report, 'id' | 'consultantId'| 'reviewStatus'>) => {
    if (!user) return;
    
    const requiresReview = reportData.managementNotes.trim() !== '' || reportData.status === 'Revisit Waived';

    const newReport: Report = {
      ...reportData,
      id: `rep-${Date.now()}`,
      consultantId: user.id,
      reviewStatus: requiresReview ? 'pending' : null,
      documents: reportData.documents || [], 
    };
    setReports(prev => [newReport, ...prev]);
    
    let statusUpdate: Partial<Site> = { };
    
    if (reportData.status === 'Visit Complete') {
        statusUpdate.lastVisited = reportData.visitDate;
    }

    if (reportData.status === 'Project Finished') {
        statusUpdate.status = 'Completed';
    } else if (reportData.status === 'Client Cancelled') {
        statusUpdate.status = 'Not Active';
    }

    setSites(prev => prev.map(site => 
      site.id === reportData.siteId ? { ...site, ...statusUpdate } : site
    ));
    
    // Update Activity Tracker to Completed
    const todayStr = new Date().toISOString().split('T')[0];
    setVisitActivities(prev => {
        const existingIndex = prev.findIndex(a => a.consultantId === user.id && a.siteId === reportData.siteId && a.date === todayStr);
        const nowStr = new Date().toISOString();
        
        if (existingIndex >= 0) {
            const newActivities = [...prev];
            newActivities[existingIndex] = {
                ...newActivities[existingIndex],
                lastActivityAt: nowStr,
                status: 'completed'
            };
            return newActivities;
        } else {
            return [...prev, {
                id: `act-${Date.now()}`,
                consultantId: user.id,
                siteId: reportData.siteId,
                date: todayStr,
                lastActivityAt: nowStr,
                status: 'completed'
            }];
        }
    });
    
    if (reportData.proceduresCreated.length > 0) {
        reportData.proceduresCreated.forEach((procType: ProcedureType) => {
            const newProcedure: Procedure = {
                id: `proc-${Date.now()}-${procType}`,
                reportId: newReport.id,
                siteId: reportData.siteId,
                consultantId: user.id,
                description: `New ${procType} created during visit.`,
                status: 'Ongoing',
                createdAt: reportData.visitDate,
                type: procType,
            };
            setProcedures(prev => [newProcedure, ...prev]);
        });
    }

    // Prepare documents for log (snapshot of data)
    const logDocs: ActionLogDocument[] = newReport.documents.map(d => ({ name: d.name, data: d.data }));
    
    logAction('Report Filed', `Report filed with status: ${reportData.status}. ${newReport.documents.length} document(s) attached.`, reportData.siteId, logDocs);
    addToast(requiresReview ? 'Report submitted for review.' : 'Report submitted successfully!');
  }, [user, addToast, logAction]);

  const updateReport = useCallback(async (reportId: string, updates: Partial<Report>) => {
      if (!user) return;

      const existingReport = reports.find(r => r.id === reportId);
      let logDetails = `Updated report details for ${reportId}.`;
      const addedLogDocs: ActionLogDocument[] = [];

      if (existingReport) {
          const changes: string[] = [];
          if (updates.status && updates.status !== existingReport.status) {
              changes.push(`Status changed from ${existingReport.status} to ${updates.status}`);
              
              if (existingReport.status === 'Project Finished' && updates.status !== 'Project Finished') {
                   setSites(prev => prev.map(s => s.id === existingReport.siteId ? { ...s, status: 'Active' } : s));
                   changes.push("Site status reverted to Active");
              }
              else if (updates.status === 'Project Finished') {
                   setSites(prev => prev.map(s => s.id === existingReport.siteId ? { ...s, status: 'Completed' } : s));
                   changes.push("Site status set to Completed");
              }
          }
          
          if (updates.notes && updates.notes !== existingReport.notes) changes.push("Updated visit notes");
          
          if (updates.documents) {
              const oldDocIds = new Set(existingReport.documents.map(d => d.id));
              const newDocIds = new Set(updates.documents.map(d => d.id));
              
              const addedDocs = updates.documents.filter(d => !oldDocIds.has(d.id));
              const removedDocs = existingReport.documents.filter(d => !newDocIds.has(d.id));
              
              if (addedDocs.length > 0) {
                  changes.push(`Uploaded ${addedDocs.length} document(s): ${addedDocs.map(d => d.name).join(', ')}`);
                  // Capture added documents for log
                  addedDocs.forEach(d => addedLogDocs.push({ name: d.name, data: d.data }));
              }
              if (removedDocs.length > 0) changes.push(`Removed ${removedDocs.length} document(s): ${removedDocs.map(d => d.name).join(', ')}`);
          }
          
          if (changes.length > 0) {
              logDetails = changes.join('; ');
          } else {
              logDetails = "Report updated (no major changes detected).";
          }
      }

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, ...updates } : r));
      
      if (existingReport) {
        logAction('Edit Report', logDetails, existingReport.siteId, addedLogDocs.length > 0 ? addedLogDocs : undefined);
      }
      addToast('Report updated successfully.');
  }, [user, reports, addToast, logAction]);

  const deleteReport = useCallback(async (reportId: string) => {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      const remainingReports = reports.filter(r => r.id !== reportId && r.siteId === report.siteId && r.status === 'Visit Complete');
      const lastReport = remainingReports.sort((a,b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];
      const newLastVisited = lastReport ? lastReport.visitDate : undefined; 

      setReports(prev => prev.filter(r => r.id !== reportId));
      
      setSites(prev => prev.map(s => {
          if (s.id === report.siteId) {
               let updates: any = {};
               
               if (report.status === 'Visit Complete') {
                   updates.lastVisited = newLastVisited;
               }

               if (s.status === 'Not Active' && report.status === 'Client Cancelled') {
                   updates.status = 'Active';
               }
               if (s.status === 'Completed' && report.status === 'Project Finished') {
                   updates.status = 'Active';
               }
               
               return { ...s, ...updates };
          }
          return s;
      }));

      // Capture deleted documents to preserve in logs
      const deletedDocs: ActionLogDocument[] = report.documents.map(d => ({ name: d.name, data: d.data }));

      logAction('Undo Action', `Deleted report ${reportId}, reverting status/dates. ${deletedDocs.length} documents archived in log.`, report.siteId, deletedDocs);
      addToast('Report deleted. Site status and visit history reverted.');
  }, [reports, addToast, logAction]);

  const addSite = useCallback((siteData: Omit<Site, 'id'>): boolean => {
    const alreadyExists = sites.some(s => s.clientName.toLowerCase() === siteData.clientName.toLowerCase() && s.address.toLowerCase() === siteData.address.toLowerCase());
    if (alreadyExists) {
        addToast("A site with this name and address already exists.", 'error');
        return false;
    }
    const newSite: Site = {
      ...siteData,
      id: Date.now(),
    };
    setSites(prev => [newSite, ...prev]);

    if (newSite.assignedConsultantId) {
        setWeeklyPlans(prevPlans => {
            const plan = prevPlans[newSite.assignedConsultantId];
            if (plan) {
                const newPlan = { ...plan, todo: [newSite, ...plan.todo] };
                return { ...prevPlans, [newSite.assignedConsultantId]: newPlan };
            }
            return prevPlans;
        });
        addAnnouncement(
            `New site assigned to your list: ${newSite.clientName}`, 
            newSite.assignedConsultantId,
            true,
            'general' 
        );
    }

    addToast(`Site "${newSite.clientName}" added!`);
    setLastImportedSiteIds(null);
    return true;
  }, [sites, addToast, addAnnouncement]);

  const addSites = useCallback((newSitesData: Omit<Site, 'id'>[]): { added: number; skipped: number; } => {
    let added = 0;
    let skipped = 0;
    const importedIds: number[] = [];

    setSites(prevSites => {
      const existingSiteKeys = new Set(
        prevSites.map(s => `${s.clientName.toLowerCase().trim()}|${s.address.toLowerCase().trim()}`)
      );
      
      const sitesToAdd: Site[] = [];
      let siteIdCounter = Date.now();

      newSitesData.forEach(newSiteData => {
        const key = `${newSiteData.clientName.toLowerCase().trim()}|${newSiteData.address.toLowerCase().trim()}`;
        if (existingSiteKeys.has(key)) {
          skipped++;
        } else {
          added++;
          const newSiteId = siteIdCounter + added;
          sitesToAdd.push({ ...newSiteData, id: newSiteId });
          importedIds.push(newSiteId);
          existingSiteKeys.add(key);
        }
      });
      
      return [...prevSites, ...sitesToAdd];
    });

    if(importedIds.length > 0) {
      setLastImportedSiteIds(importedIds);
    } else {
      setLastImportedSiteIds(null);
    }

    return { added, skipped };
  }, []);

  const updateSite = useCallback((siteId: number, updates: Partial<Omit<Site, 'id'>> & { linkToSiteId?: number | null }) => {
     const { linkToSiteId, ...siteUpdates } = updates;
     let changedSites: Site[] = [];
    
    setSites(prevSites => {
        let sitesToUpdate = [...prevSites];
        if (linkToSiteId !== undefined) {
            if (linkToSiteId === null) { 
                siteUpdates.siteGroupId = undefined;
            } else { 
                const siteToLinkTo = prevSites.find(s => s.id === linkToSiteId)!;
                const targetGroupId = siteToLinkTo.siteGroupId || `group-${siteToLinkTo.id}`;
                siteUpdates.siteGroupId = targetGroupId;
                sitesToUpdate = sitesToUpdate.map(s => s.id === siteToLinkTo.id ? { ...s, siteGroupId: targetGroupId } : s);
            }
        }

        const oldSite = prevSites.find(s => s.id === siteId);
        const newConsultantId = siteUpdates.assignedConsultantId;
        
        sitesToUpdate = sitesToUpdate.map(site => {
             if (site.id === siteId) {
                 const updated = { ...site, ...siteUpdates };
                 changedSites.push(updated);
                 return updated;
             }
             return site;
        });

        if (newConsultantId && oldSite?.siteGroupId && newConsultantId !== oldSite.assignedConsultantId) {
            sitesToUpdate = sitesToUpdate.map(site => {
                if (site.siteGroupId === oldSite.siteGroupId && site.id !== siteId) {
                     const updated = { ...site, assignedConsultantId: newConsultantId };
                     changedSites.push(updated);
                     return updated;
                }
                return site;
            });
        }
        return sitesToUpdate;
    });

    if (changedSites.length > 0 && updates.assignedConsultantId) {
        setWeeklyPlans(prevPlans => {
            const nextPlans = { ...prevPlans };
            const newConsultantId = updates.assignedConsultantId!;

            changedSites.forEach(changedSite => {
                const oldConsultantId = sites.find(s => s.id === changedSite.id)?.assignedConsultantId;

                if (oldConsultantId && nextPlans[oldConsultantId]) {
                    nextPlans[oldConsultantId] = {
                        todo: nextPlans[oldConsultantId].todo.filter(s => s.id !== changedSite.id),
                        planned: WEEKDAYS.reduce((acc, day) => {
                            acc[day] = nextPlans[oldConsultantId].planned[day].filter(s => s.id !== changedSite.id);
                            return acc;
                        }, {} as Record<Weekday, Site[]>)
                    };
                }

                if (nextPlans[newConsultantId]) {
                     const inTodo = nextPlans[newConsultantId].todo.some(s => s.id === changedSite.id);
                     const inPlanned = WEEKDAYS.some(day => nextPlans[newConsultantId].planned[day].some(s => s.id === changedSite.id));
                     
                     if (!inTodo && !inPlanned) {
                         nextPlans[newConsultantId] = {
                             ...nextPlans[newConsultantId],
                             todo: [changedSite, ...nextPlans[newConsultantId].todo]
                         };
                     }
                }
            });
            return nextPlans;
        });

        if (changedSites.length > 0) {
             const newConsultantId = updates.assignedConsultantId!;
             const siteNames = changedSites.map(s => s.clientName).join(', ');
             addAnnouncement(
                 `Schedule Updated: Assigned ${changedSites.length} site(s) (${siteNames}) to your list.`, 
                 newConsultantId,
                 true,
                 'general' 
             );
             
             const removedFrom = new Set<number>();
             changedSites.forEach(s => {
                 const old = sites.find(oldS => oldS.id === s.id)?.assignedConsultantId;
                 if (old && old !== newConsultantId) removedFrom.add(old);
             });
             removedFrom.forEach(cId => {
                 addAnnouncement(
                     `Schedule Updated: ${changedSites.length} site(s) moved from your list.`, 
                     cId,
                     true,
                     'general' 
                 );
             });
        }
    }

    setLastImportedSiteIds(null);
    logAction('Status Change', 'Site details updated.', siteId);
    addToast('Site updated successfully!');
  }, [users, sites, addToast, logAction, addAnnouncement]);

  const updateSiteBillingStatus = useCallback(async (siteId: number, status: BillingStatus) => {
      if (!user) return;
      setSites(prev => prev.map(s => {
          if (s.id === siteId) {
              return {
                  ...s,
                  billingStatus: status,
                  billingStatusUpdatedAt: new Date().toISOString(),
                  billingStatusUpdatedBy: user.id
              };
          }
          return s;
      }));
      // Silent update or minimal toast to not clutter
      // logAction('Billing Update', `Billing status changed to ${status}`, siteId);
  }, [user, logAction]);

  const reassignSites = useCallback(async (siteIds: number[], newConsultantId: number) => {
    const sitesToMove = sites.filter(s => siteIds.includes(s.id));
    if (sitesToMove.length === 0) return;

    const oldConsultantsSet = new Set<number>();

    setSites(prevSites => prevSites.map(s => {
        if (siteIds.includes(s.id)) {
            if(s.assignedConsultantId !== 0) oldConsultantsSet.add(s.assignedConsultantId);
            return { ...s, assignedConsultantId: newConsultantId };
        }
        return s;
    }));

    setWeeklyPlans(prevPlans => {
        const nextPlans = { ...prevPlans };

        sitesToMove.forEach(site => {
            const oldId = site.assignedConsultantId;
            
            if (oldId && nextPlans[oldId]) {
                 nextPlans[oldId] = {
                    todo: nextPlans[oldId].todo.filter(s => s.id !== site.id),
                    planned: WEEKDAYS.reduce((acc, day) => {
                        acc[day] = nextPlans[oldId].planned[day].filter(s => s.id !== site.id);
                        return acc;
                    }, {} as Record<Weekday, Site[]>)
                };
            }

            if (nextPlans[newConsultantId]) {
                 const updatedSite = { ...site, assignedConsultantId: newConsultantId };
                 const inTodo = nextPlans[newConsultantId].todo.some(s => s.id === site.id);
                 const inPlanned = WEEKDAYS.some(day => nextPlans[newConsultantId].planned[day].some(s => s.id === site.id));

                 if (!inTodo && !inPlanned) {
                     nextPlans[newConsultantId] = {
                         ...nextPlans[newConsultantId],
                         todo: [updatedSite, ...nextPlans[newConsultantId].todo]
                     };
                 }
            }
        });
        return nextPlans;
    });
    
    const newConsultantName = users.find(u => u.id === newConsultantId)?.name || 'Consultant';
    
    addAnnouncement(
        `You have been assigned ${sitesToMove.length} new site(s), including ${sitesToMove[0].clientName}.`, 
        newConsultantId,
        true,
        'general' 
    );

    oldConsultantsSet.forEach(oldId => {
        if (oldId !== newConsultantId) {
            addAnnouncement(
                `Schedule Update: ${sitesToMove.filter(s => s.assignedConsultantId === oldId).length} site(s) were moved from your list.`, 
                oldId,
                true,
                'general'
            );
        }
    });

    addToast(`Successfully reassigned ${sitesToMove.length} site(s) to ${newConsultantName}.`);
    logAction('Plan Update', `Reassigned ${sitesToMove.length} sites to user ${newConsultantId}`);

  }, [sites, users, addAnnouncement, addToast, logAction]);

  const requestSiteHold = useCallback((siteId: number, reason: string, start: string, end: string) => {
      if (!user) return;
      setSites(prev => prev.map(s => {
          if (s.id === siteId) {
              return {
                  ...s,
                  status: 'On Hold', 
                  onHoldReason: reason,
                  onHoldStart: start,
                  onHoldEnd: end,
                  onHoldSetBy: user.id,
                  onHoldUpdatedAt: new Date().toISOString(),
                  onHoldApprovalStatus: user.role === 'management' ? 'Approved' : 'Pending'
              };
          }
          return s;
      }));
      logAction('Hold Request', `Hold requested: ${reason} (${start} to ${end})`, siteId);
      addToast(user.role === 'management' ? 'Site put on hold successfully.' : 'Hold request submitted for approval.');
  }, [user, addToast, logAction]);

  const resolveHoldRequest = useCallback((siteId: number, approved: boolean) => {
      setSites(prev => prev.map(s => {
          if (s.id === siteId) {
              if (approved) {
                  return { ...s, onHoldApprovalStatus: 'Approved', onHoldUpdatedAt: new Date().toISOString() };
              } else {
                  return { 
                      ...s, 
                      status: 'Active',
                      onHoldReason: undefined,
                      onHoldStart: undefined,
                      onHoldEnd: undefined,
                      onHoldSetBy: undefined,
                      onHoldApprovalStatus: undefined,
                      onHoldUpdatedAt: new Date().toISOString()
                  } as Site;
              }
          }
          return s;
      }));
      logAction('Status Change', approved ? 'Hold Approved' : 'Hold Rejected', siteId);
      addToast(approved ? 'Hold request approved.' : 'Hold request rejected, site active.');
  }, [addToast, logAction]);

  const clearSiteHold = useCallback((siteId: number) => {
      setSites(prev => prev.map(s => {
          if (s.id === siteId) {
              return {
                  ...s,
                  status: 'Active',
                  onHoldReason: undefined,
                  onHoldStart: undefined,
                  onHoldEnd: undefined,
                  onHoldSetBy: undefined,
                  onHoldApprovalStatus: undefined,
                  onHoldUpdatedAt: new Date().toISOString()
              } as Site;
          }
          return s;
      }));
      logAction('Undo Action', 'Hold cleared/removed manually.', siteId);
      addToast('Hold cleared. Site is active.');
  }, [addToast, logAction]);

  const addProcedure = useCallback((procedureData: Omit<Procedure, 'id' | 'consultantId' | 'createdAt' | 'reportId'>) => {
    if (!user) return;
    const newProcedure: Procedure = {
        ...procedureData,
        id: `proc-${Date.now()}`,
        consultantId: user.id,
        createdAt: new Date().toISOString().split('T')[0],
    };
    setProcedures(prev => [newProcedure, ...prev]);
    addToast('Procedure added successfully!');
  }, [user, addToast]);

  const updateProcedure = useCallback((procedureId: string, updates: Partial<Omit<Procedure, 'id'>>) => {
    setProcedures(prev => prev.map(proc => 
      proc.id === procedureId ? { ...proc, ...updates } : proc
    ));
    addToast('Procedure status updated.');
  }, [addToast]);
  
  const addUser = useCallback((name: string, email: string, role: UserRole) => {
    const newUser: User = { id: Date.now(), name, email, role, phone: '', certificates: [] };
    setUsers(prev => [...prev, newUser]);
    addToast(`User "${name}" created.`);
  }, [addToast]);

  const updateUser = useCallback((userId: number, updates: { name?: string; email?: string; role?: UserRole; phone?: string; }) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    ));
    if (user && user.id === userId) {
        setUser(prevUser => ({ ...prevUser!, ...updates }));
    }
    addToast('User profile updated.');
  }, [user, addToast]);

  const addCertificate = useCallback(async (userId: number, certificate: Omit<Certificate, 'id'>) => {
      const newCert: Certificate = { ...certificate, id: `cert-${Date.now()}` };
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, certificates: [...(u.certificates || []), newCert] } : u
      ));
      logAction('Certificate Update', `Added certificate ${certificate.name} for user ${userId}`);
      addToast('Certificate added.');
  }, [addToast, logAction]);

  const updateCertificate = useCallback(async (userId: number, certId: string, updates: Partial<Certificate>) => {
      setUsers(prev => prev.map(u => {
          if (u.id === userId && u.certificates) {
              return {
                  ...u,
                  certificates: u.certificates.map(c => c.id === certId ? { ...c, ...updates } : c)
              };
          }
          return u;
      }));
      // Check if this resolves an expiring/expired state
      const cert = users.find(u => u.id === userId)?.certificates?.find(c => c.id === certId);
      const updatedCert = { ...cert, ...updates };
      
      // Only clear if date is pushed future
      if (updatedCert.expiryDate && new Date(updatedCert.expiryDate) > new Date()) {
           setAnnouncements(prev => prev.filter(a => {
               const isRelated = (a.targetUserId === userId || !a.targetUserId) && a.message.includes(updatedCert.name || '');
               const isExpiryMsg = a.message.includes('EXPIRED') || a.message.includes('Expiring Soon');
               return !(isRelated && isExpiryMsg);
           }));
      }

      logAction('Certificate Update', `Updated certificate ${certId} for user ${userId}`);
      addToast('Certificate updated.');
  }, [addToast, logAction, users]);

  const deleteCertificate = useCallback(async (userId: number, certId: string) => {
      const userToUpdate = users.find(u => u.id === userId);
      const certName = userToUpdate?.certificates?.find(c => c.id === certId)?.name;

      setUsers(prev => prev.map(u => {
          if (u.id === userId && u.certificates) {
              return {
                  ...u,
                  certificates: u.certificates.filter(c => c.id !== certId)
              };
          }
          return u;
      }));

      // Clear any alerts related to this deleted certificate
      if (certName) {
          setAnnouncements(prev => prev.filter(a => {
               const isRelated = (a.targetUserId === userId || !a.targetUserId) && a.message.includes(certName);
               const isExpiryMsg = a.message.includes('EXPIRED') || a.message.includes('Expiring Soon');
               return !(isRelated && isExpiryMsg);
          }));
      }
      
      addToast('Certificate removed.');
  }, [addToast, users]);
  
  const addComplaint = useCallback((userId: number, notes: string, siteId?: number) => {
    const newComplaint: Complaint = {
        id: `comp-${Date.now()}`,
        userId,
        notes,
        siteId,
        date: new Date().toISOString().split('T')[0],
        status: 'Open',
        managementNotes: '',
    };
    setComplaints(prev => [newComplaint, ...prev]);
    addToast('Complaint recorded successfully.');
  }, [addToast]);

  const updateComplaint = useCallback((complaintId: string, updates: { status?: ComplaintStatus; managementNotes?: string }) => {
    setComplaints(prev => prev.map(c => 
      c.id === complaintId ? { ...c, ...updates } : c
    ));
    addToast('Complaint updated.');
  }, [addToast]);

  const addIncentive = useCallback((incentiveData: Omit<Incentive, 'id'>) => {
    const newIncentive: Incentive = {
      ...incentiveData,
      id: `inc-${Date.now()}`,
    };
    setIncentives(prev => [newIncentive, ...prev]);
    addToast('Incentive logged successfully.');
  }, [addToast]);

  const updateIncentive = useCallback((id: string, updates: Partial<Omit<Incentive, 'id'>>) => {
    setIncentives(prev => prev.map(inc => 
      inc.id === id ? { ...inc, ...updates } : inc
    ));
    addToast('Incentive updated.');
  }, [addToast]);

  const addBulletinItem = useCallback(async (itemData: Omit<BulletinItem, 'id' | 'createdAt' | 'acknowledgments'>) => {
      if (!user) return;
      const newItem: BulletinItem = {
          id: `bull-${Date.now()}`,
          createdAt: new Date().toISOString(),
          acknowledgments: [],
          ...itemData,
          createdBy: user.id
      };
      setBulletinItems(prev => [newItem, ...prev]);
      addToast('Notice posted to bulletin board.');
  }, [user, addToast]);

  const updateBulletinItem = useCallback(async (id: string, updates: Partial<Omit<BulletinItem, 'id' | 'createdAt' | 'acknowledgments'>>) => {
      setBulletinItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      addToast('Notice updated.');
  }, [addToast]);

  const deleteBulletinItem = useCallback(async (id: string) => {
      setBulletinItems(prev => prev.filter(item => item.id !== id));
      addToast('Notice removed.');
  }, [addToast]);

  const acknowledgeBulletinItem = useCallback(async (id: string) => {
      if (!user) return;
      setBulletinItems(prev => prev.map(item => {
          if (item.id === id) {
              if (item.acknowledgments.some(ack => ack.userId === user.id)) return item;
              return {
                  ...item,
                  acknowledgments: [...item.acknowledgments, { userId: user.id, timestamp: new Date().toISOString() }]
              };
          }
          return item;
      }));
      addToast('Notice acknowledged.');
  }, [user, addToast]);
  
  const approveChange = useCallback((reportId: string) => {
      const report = reports.find(r => r.id === reportId);
      if(!report || !report.managementNotes) return;
      
      setSites(prevSites => prevSites.map(s => {
          if (s.id === report.siteId) {
              return { ...s, notes: `${s.notes || ''}\n[Update Approved on ${new Date().toISOString().split('T')[0]}]: ${report.managementNotes}` };
          }
          return s;
      }));
      setReports(prevReports => prevReports.map(r => r.id === reportId ? { ...r, reviewStatus: 'approved' } : r));
      logAction('Status Change', 'Report Change Approved', report.siteId);
      addToast('Change approved and site notes updated.');
  }, [reports, addToast, logAction]);

  const rejectChange = useCallback((reportId: string) => {
      setReports(prevReports => prevReports.map(r => r.id === reportId ? { ...r, reviewStatus: 'rejected' } : r));
      addToast('Change has been rejected.');
  }, [addToast]);

  const generateNextWeeksPlans = useCallback(async (options: PlanGenerationOptions) => {
    const { targetUserIds, includeUnassigned, cityFilter, frequencyFilter, maxSitesPerUser = 999 } = options;
    
    // 1. Initialize Drafts for Targets
    const newDraftPlans: WeeklyPlanState = {};
    targetUserIds.forEach(id => {
        newDraftPlans[id] = {
            todo: [],
            planned: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] }
        };
    });

    // 2. Get Assigned Sites for these users
    let sitesToProcess = sites.filter(s => targetUserIds.includes(s.assignedConsultantId));
    
    // 3. Optionally add Unassigned Sites
    if (includeUnassigned) {
        const unassigned = sites.filter(s => s.assignedConsultantId === 0);
        sitesToProcess = [...sitesToProcess, ...unassigned];
    }

    // 4. Apply Filters (City, Frequency, IsDue)
    sitesToProcess = sitesToProcess.filter(s => {
        if (s.status !== 'Active') return false;
        if (cityFilter !== 'all' && s.city !== cityFilter) return false;
        if (frequencyFilter !== 'all' && s.frequency !== frequencyFilter) return false;
        return isSiteDue(s);
    });

    // 5. Distribute
    // Sort sites to process: Assigned ones go to their owner. Unassigned ones get distributed.
    // We also need to respect maxSitesPerUser.
    
    // Helper to check count
    const getCount = (userId: number) => newDraftPlans[userId].todo.length;

    sitesToProcess.forEach(site => {
        let targetId = site.assignedConsultantId;

        // If site is unassigned (0) OR assigned to someone not in target list (shouldn't happen due to filter, but safety check)
        // We need to pick a target from targetUserIds
        if (targetId === 0 || !targetUserIds.includes(targetId)) {
            // Find user with lowest count who isn't full
            const candidate = targetUserIds
                .filter(uid => getCount(uid) < maxSitesPerUser)
                .sort((a, b) => getCount(a) - getCount(b))[0]; // Sort by current load
            
            if (candidate) {
                targetId = candidate;
            } else {
                return; // No one can take this site
            }
        } else {
            // Site is assigned to a target user. Check capacity.
            if (getCount(targetId) >= maxSitesPerUser) return;
        }

        // Add to plan
        newDraftPlans[targetId].todo.push(site);
    });

    setDraftWeeklyPlans(newDraftPlans);
    addToast(`Draft plans generated for ${targetUserIds.length} users with ${sitesToProcess.length} sites.`, 'info');
  }, [sites, addToast]);

  const confirmDraftPlans = useCallback((editedPlans: WeeklyPlanState) => {
    // 1. Update Weekly Plans
    setWeeklyPlans(editedPlans);

    // 2. Update Site Assignments based on the plan to ensure consistency
    setSites(prevSites => {
        const newSites = [...prevSites];
        let changed = false;
        const assignments = new Map<number, number>(); // siteId -> consultantId

        // Gather all assignments from the confirmed plan
        Object.entries(editedPlans).forEach(([consultantIdStr, p]) => {
            const plan = p as WeeklyPlan; // Explicit cast to ensure type
            const consultantId = parseInt(consultantIdStr);
            // From Todo
            plan.todo.forEach(s => assignments.set(s.id, consultantId));
            // From Planned Days
            Object.values(plan.planned).forEach((dayList: any) => {
                (dayList as Site[]).forEach(s => assignments.set(s.id, consultantId));
            });
        });

        // Apply assignments to sites
        for (let i = 0; i < newSites.length; i++) {
            const site = newSites[i];
            if (assignments.has(site.id)) {
                const newOwnerId = assignments.get(site.id)!;
                if (site.assignedConsultantId !== newOwnerId) {
                    newSites[i] = { ...site, assignedConsultantId: newOwnerId };
                    changed = true;
                }
            }
        }

        return changed ? newSites : prevSites;
    });

    setDraftWeeklyPlans(null);
    addToast("Next week's plans have been confirmed and distributed!", 'success');
    
    Object.keys(editedPlans).forEach(consultantId => {
        addAnnouncement("Your new weekly plan has been generated and distributed.", parseInt(consultantId), true, 'general');
    });

  }, [addToast, addAnnouncement]);

  const clearDraftPlans = useCallback(() => {
    setDraftWeeklyPlans(null);
    addToast("Draft plan discarded.", 'info');
  }, [addToast]);

  const updateRouteConfig = useCallback((newConfig: Partial<RouteOptimizationConfig>) => {
    setRouteConfig(prev => ({...prev, ...newConfig}));
    addToast("Routing settings updated.");
  }, [addToast]);

  const generateRouteSuggestions = useCallback((consultantId: number, day: Weekday, mode: RouteMode) => {
    const plan = weeklyPlans[consultantId];
    if (!plan || !plan.planned[day] || plan.planned[day].length === 0) {
        addToast("No sites planned for this day.", 'info');
        setRouteSuggestions(null);
        return;
    }
    const sitesForDay = plan.planned[day];
    const homeBase = { latitude: 43.6532, longitude: -79.3832 }; 
    
    let suggestion: RouteSuggestion;
    if (mode === 'balanced') {
        suggestion = findBalancedRoute(sitesForDay, homeBase, routeConfig);
    } else {
        suggestion = findFastestRoute(sitesForDay, homeBase, routeConfig);
    }
    
    setRouteSuggestions(suggestion);
    addToast(`Generated "${mode}" route for ${day}.`);
  }, [weeklyPlans, routeConfig, addToast]);

  const clearRouteSuggestions = useCallback(() => {
    setRouteSuggestions(null);
  }, []);
  
  const undoLastImport = useCallback(() => {
    if (!lastImportedSiteIds || lastImportedSiteIds.length === 0) {
        addToast("No recent import to undo.", 'info');
        return;
    }
    setSites(prevSites => prevSites.filter(site => !lastImportedSiteIds.includes(site.id)));
    addToast(`Successfully removed ${lastImportedSiteIds.length} imported sites.`, 'success');
    setLastImportedSiteIds(null);
  }, [lastImportedSiteIds, addToast]);

  const memoizedValue = useMemo(() => ({ 
    user, users, sites, reports, procedures, announcements, complaints, incentives, actionLogs, bulletinItems, visitActivities,
    login, logout, addReport: (...args) => withLoading(addReport, ...args), 
    updateReport: (...args) => withLoading(updateReport, ...args),
    deleteReport: (...args) => withLoading(deleteReport, ...args),
    addSite: (...args) => withLoading(addSite, ...args), 
    addSites: (...args) => withLoading(addSites, ...args),
    updateSite: (...args) => withLoading(updateSite, ...args),
    updateSiteBillingStatus: (...args) => withLoading(updateSiteBillingStatus, ...args),
    reassignSites: (...args) => withLoading(reassignSites, ...args),
    requestSiteHold: (...args) => withLoading(requestSiteHold, ...args),
    resolveHoldRequest: (...args) => withLoading(resolveHoldRequest, ...args),
    clearSiteHold: (...args) => withLoading(clearSiteHold, ...args),
    updateProcedure: (...args) => withLoading(updateProcedure, ...args),
    addUser: (...args) => withLoading(addUser, ...args), 
    updateUser: (...args) => withLoading(updateUser, ...args),
    addCertificate: (...args) => withLoading(addCertificate, ...args),
    updateCertificate: (...args) => withLoading(updateCertificate, ...args),
    deleteCertificate: (...args) => withLoading(deleteCertificate, ...args),
    addProcedure: (...args) => withLoading(addProcedure, ...args),
    addAnnouncement: (...args) => withLoading(addAnnouncement, ...args),
    broadcastBanner: (...args) => withLoading(broadcastBanner, ...args),
    acknowledgeAnnouncement: (...args) => withLoading(acknowledgeAnnouncement, ...args),
    addComplaint: (...args) => withLoading(addComplaint, ...args),
    updateComplaint: (...args) => withLoading(updateComplaint, ...args),
    addIncentive: (...args) => withLoading(addIncentive, ...args),
    updateIncentive: (...args) => withLoading(updateIncentive, ...args),
    addBulletinItem: (...args) => withLoading(addBulletinItem, ...args),
    updateBulletinItem: (...args) => withLoading(updateBulletinItem, ...args),
    deleteBulletinItem: (...args) => withLoading(deleteBulletinItem, ...args),
    acknowledgeBulletinItem: (...args) => withLoading(acknowledgeBulletinItem, ...args),
    weeklyPlans, updateWeeklyPlan,
    isLoading, error, toasts, addToast, theme, setTheme,
    approveChange: (...args) => withLoading(approveChange, ...args),
    rejectChange: (...args) => withLoading(rejectChange, ...args),
    generateNextWeeksPlans: (...args) => withLoading(generateNextWeeksPlans, ...args),
    routeConfig, updateRouteConfig: (...args) => withLoading(updateRouteConfig, ...args), 
    routeSuggestions, generateRouteSuggestions: (...args) => withLoading(generateRouteSuggestions, ...args),
    clearRouteSuggestions,
    draftWeeklyPlans, confirmDraftPlans, clearDraftPlans,
    lastImportedSiteIds, undoLastImport: (...args) => withLoading(undoLastImport, ...args),
    pendingNavigation, setPendingNavigation, clearPendingNavigation,
    logVisitActivity, // Added tracker function
    resetAppData
  }), [user, users, sites, reports, procedures, announcements, complaints, incentives, actionLogs, bulletinItems, visitActivities, login, logout, addReport, updateReport, deleteReport, addSite, addSites, updateSite, updateSiteBillingStatus, reassignSites, requestSiteHold, resolveHoldRequest, clearSiteHold, updateProcedure, addUser, updateUser, addCertificate, updateCertificate, deleteCertificate, addProcedure, addAnnouncement, broadcastBanner, acknowledgeAnnouncement, addComplaint, updateComplaint, addIncentive, updateIncentive, addBulletinItem, updateBulletinItem, deleteBulletinItem, acknowledgeBulletinItem, weeklyPlans, updateWeeklyPlan, isLoading, error, toasts, addToast, theme, setTheme, withLoading, approveChange, rejectChange, generateNextWeeksPlans, routeConfig, updateRouteConfig, routeSuggestions, generateRouteSuggestions, clearRouteSuggestions, draftWeeklyPlans, confirmDraftPlans, clearDraftPlans, lastImportedSiteIds, undoLastImport, pendingNavigation, setPendingNavigation, clearPendingNavigation, logVisitActivity, resetAppData]);

  return (
    <AppContext.Provider value={memoizedValue}>
      {children}
    </AppContext.Provider>
  );
};
