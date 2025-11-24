
export type UserRole = 'consultant' | 'management';

export interface Certificate {
  id: string;
  name: string;
  issueDate: string;
  expiryDate?: string;
  notes?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  certificates?: Certificate[];
}

export type VisitFrequency = 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Shop Audit';

export type SiteStatus = 'Active' | 'Not Active' | 'On Hold' | 'Completed';

export interface Contact {
  role: string;
  name: string;
  info: string;
}

export type BillingStatus = 'processed' | 'not_processed';

export interface Site {
  id: number;
  clientName: string;
  address: string;
  frequency: VisitFrequency;
  assignedConsultantId: number;
  status: SiteStatus;
  lastVisited?: string;
  notes?: string;
  isPriority?: boolean;
  priorityNote?: string;
  siteGroupId?: string;
  clientType: string;
  scopeOfWork: string;
  contacts: Contact[];
  city: string; 
  latitude: number;
  longitude: number;
  initialVisitRequestor?: string;
  
  // On Hold Logic
  onHoldReason?: string;
  onHoldStart?: string; // ISO Date YYYY-MM-DD
  onHoldEnd?: string;   // ISO Date YYYY-MM-DD
  onHoldSetBy?: number; // User ID
  onHoldUpdatedAt?: string;
  onHoldApprovalStatus?: 'Pending' | 'Approved';

  // Billing Logic
  billingStatus?: BillingStatus;
  billingStatusUpdatedAt?: string;
  billingStatusUpdatedBy?: number;
}

export type ReportStatus = 'Visit Complete' | 'Site Not Active' | 'Client Cancelled' | 'Project Finished' | 'On Hold' | 'Revisit Waived';
export type ProcedureType = 'SWP' | 'JHA';

export interface DeliveredItems {
  greenBooks?: number;
  safetyBoard?: number;
  fireExtinguisher?: number;
  eyeWashStation?: number;
  firstAidKitSmall?: number;
  firstAidKitLarge?: number;
  inspectionTags?: number;
  specificProcedure?: number;
}

export interface ReportDocument {
    id: string;
    name: string;
    data: string; // Base64 string
    type: string; // MIME type
    uploadedAt: string;
}

export interface Report {
  id: string;
  siteId: number;
  consultantId: number;
  visitDate: string;
  status: ReportStatus;
  notes: string;
  managementNotes: string; // For address/contact changes etc.
  reviewStatus: 'pending' | 'approved' | 'rejected' | null;
  proceduresCreated: ProcedureType[];
  documents: ReportDocument[];
  deliveredItems?: DeliveredItems;
}

export interface Procedure {
  id: string;
  reportId?: string;
  siteId: number;
  consultantId: number;
  description: string;
  status: 'Ongoing' | 'Completed';
  fileUrl?: string;
  createdAt: string;
  type: ProcedureType;
}

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface WeeklyPlan {
  todo: Site[];
  planned: Record<Weekday, Site[]>;
}

export interface WeeklyPlanState {
    [key: number]: WeeklyPlan;
}

export interface NavigationTarget {
  view: 'management' | 'consultant';
  tab?: string; // e.g., 'training', 'sites'
  subTab?: string;
  itemId?: string | number;
}

export type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  navTarget?: NavigationTarget;
};

export type Theme = 'light' | 'dark' | 'system';

export type AnnouncementType = 'general' | 'banner' | 'critical';

export interface Announcement {
  id: number;
  message: string;
  createdAt: string;
  targetUserId?: number;
  requiresAcknowledgment?: boolean;
  isAcknowledged?: boolean;
  acknowledgedAt?: string;
  type: AnnouncementType;
  navTarget?: NavigationTarget;
}

export type ComplaintStatus = 'Open' | 'Under Review' | 'Resolved';

export interface Complaint {
    id: string;
    userId: number;
    siteId?: number;
    notes: string;
    date: string;
    status: ComplaintStatus;
    managementNotes?: string;
}

export type RouteMode = 'fastest' | 'balanced';

export interface RouteOptimizationConfig {
    travelTimeRate: number; // $/hour
    distanceRate: number; // $/km
    perSiteRate: number; // $/site
    avgSpeedKmh: number; // km/h
    maxDailyDriveTime: number; // hours
    maxDailyDistance: number; // km
}

export interface RouteSuggestion {
    mode: RouteMode;
    orderedSites: Site[];
    totalDistance: number; // km
    totalTime: number; // hours
    estimatedPay: {
        timePay: number;
        distancePay: number;
        sitePay: number;
        total: number;
    };
    costPerSite: number;
    warnings: string[];
}

export type IncentiveStatus = 'Pending' | 'Approved' | 'Paid';
export type IncentiveType = 'Lump Sum' | 'Percentage' | 'Recurring' | 'Other';
export type IncentiveCategory = 'New Client' | 'Client Expansion' | 'Referral' | 'Performance' | 'Other';

export interface Incentive {
  id: string;
  userId: number;
  description: string;
  amount: number;
  date: string;
  status: IncentiveStatus;
  incentiveType: IncentiveType;
  category: IncentiveCategory;
  notes?: string;
}

export type ActionType = 'Status Change' | 'Report Filed' | 'Plan Update' | 'Hold Request' | 'Undo Action' | 'Edit Report' | 'Remove Site' | 'Acknowledgment' | 'Certificate Update' | 'Billing Update';

export interface ActionLogDocument {
    name: string;
    data: string; // Base64
}

export interface ActionLog {
    id: string;
    userId: number;
    userName: string;
    siteId?: number;
    siteName?: string;
    actionType: ActionType;
    details: string;
    timestamp: string;
    documents?: ActionLogDocument[]; // Snapshot of documents involved in this action
}

export type BulletinCategory = 'Company Update' | 'Health & Safety' | 'General';
export type BulletinPriority = 'High' | 'Normal';

export interface BulletinItem {
    id: string;
    title: string;
    content: string;
    category: BulletinCategory;
    priority: BulletinPriority;
    createdAt: string;
    createdBy: number; // User ID of manager
    acknowledgments: { userId: number; timestamp: string }[];
}

export interface PlanGenerationOptions {
    targetUserIds: number[];
    includeUnassigned: boolean;
    cityFilter: string;
    frequencyFilter: string;
    maxSitesPerUser: number;
}

export interface VisitActivity {
    id: string;
    consultantId: number;
    siteId: number;
    date: string; // YYYY-MM-DD
    lastActivityAt: string; // ISO Timestamp
    status: 'in_progress' | 'completed';
}

export interface AppContextType {
  user: User | null;
  users: User[];
  sites: Site[];
  reports: Report[];
  procedures: Procedure[];
  announcements: Announcement[];
  complaints: Complaint[];
  incentives: Incentive[];
  actionLogs: ActionLog[];
  bulletinItems: BulletinItem[];
  visitActivities: VisitActivity[];
  login: (userId: number) => void;
  logout: () => void;
  addReport: (report: Omit<Report, 'id' | 'consultantId' | 'reviewStatus'>) => Promise<void>;
  updateReport: (reportId: string, updates: Partial<Report>) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  addSite: (siteData: Omit<Site, 'id'>) => Promise<boolean>;
  addSites: (newSites: Omit<Site, 'id'>[]) => Promise<{ added: number; skipped: number; }>;
  updateSite: (siteId: number, updates: Partial<Omit<Site, 'id'>> & { linkToSiteId?: number | null }) => Promise<void>;
  updateSiteBillingStatus: (siteId: number, status: BillingStatus) => Promise<void>;
  reassignSites: (siteIds: number[], newConsultantId: number) => Promise<void>;
  requestSiteHold: (siteId: number, reason: string, start: string, end: string) => Promise<void>;
  resolveHoldRequest: (siteId: number, approved: boolean) => Promise<void>;
  clearSiteHold: (siteId: number) => Promise<void>;
  updateProcedure: (procedureId: string, updates: Partial<Omit<Procedure, 'id'>>) => Promise<void>;
  addUser: (name: string, email: string, role: UserRole) => Promise<void>;
  updateUser: (userId: number, updates: { name?: string; email?: string; role?: UserRole; phone?: string; }) => Promise<void>;
  addCertificate: (userId: number, certificate: Omit<Certificate, 'id'>) => Promise<void>;
  updateCertificate: (userId: number, certId: string, updates: Partial<Certificate>) => Promise<void>;
  deleteCertificate: (userId: number, certId: string) => Promise<void>;
  addProcedure: (procedureData: Omit<Procedure, 'id' | 'consultantId' | 'createdAt' | 'reportId'>) => Promise<void>;
  addAnnouncement: (message: string, targetUserId?: number, requiresAcknowledgment?: boolean, type?: AnnouncementType, navTarget?: NavigationTarget) => Promise<void>;
  broadcastBanner: (message: string) => Promise<void>;
  acknowledgeAnnouncement: (announcementId: number) => Promise<void>;
  addComplaint: (userId: number, notes: string, siteId?: number) => Promise<void>;
  updateComplaint: (complaintId: string, updates: { status?: ComplaintStatus; managementNotes?: string }) => Promise<void>;
  addIncentive: (incentive: Omit<Incentive, 'id'>) => Promise<void>;
  updateIncentive: (id: string, updates: Partial<Omit<Incentive, 'id'>>) => Promise<void>;
  addBulletinItem: (item: Omit<BulletinItem, 'id' | 'createdAt' | 'acknowledgments'>) => Promise<void>;
  updateBulletinItem: (id: string, updates: Partial<Omit<BulletinItem, 'id' | 'createdAt' | 'acknowledgments'>>) => Promise<void>;
  deleteBulletinItem: (id: string) => Promise<void>;
  acknowledgeBulletinItem: (id: string) => Promise<void>;
  weeklyPlans: WeeklyPlanState;
  updateWeeklyPlan: (consultantId: number, plan: WeeklyPlan) => void;
  isLoading: boolean;
  error: string | null;
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage['type'], navTarget?: NavigationTarget) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  approveChange: (reportId: string) => Promise<void>;
  rejectChange: (reportId: string) => Promise<void>;
  generateNextWeeksPlans: (options: PlanGenerationOptions) => Promise<void>;
  // Route Optimization
  routeConfig: RouteOptimizationConfig;
  updateRouteConfig: (newConfig: Partial<RouteOptimizationConfig>) => Promise<void>;
  routeSuggestions: RouteSuggestion | null;
  generateRouteSuggestions: (consultantId: number, day: Weekday, mode: RouteMode) => Promise<void>;
  clearRouteSuggestions: () => void;
  // Plan Editing
  draftWeeklyPlans: WeeklyPlanState | null;
  confirmDraftPlans: (editedPlans: WeeklyPlanState) => void;
  clearDraftPlans: () => void;
  // Import Undo
  lastImportedSiteIds: number[] | null;
  undoLastImport: () => Promise<void>;
  // Navigation State
  pendingNavigation: NavigationTarget | null;
  setPendingNavigation: (target: NavigationTarget | null) => void;
  clearPendingNavigation: () => void;
  // Tracking
  logVisitActivity: (siteId: number) => Promise<void>;
  // Debug
  resetAppData?: () => void;
}
