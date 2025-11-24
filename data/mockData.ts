
import { User, Site, Report, Procedure, Announcement, Complaint, Incentive, ActionLog, BulletinItem, VisitFrequency, SiteStatus } from '../types';

const today = new Date();
const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
};
const daysFromNow = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
};

export const RECENT_FRIDAY = (() => {
    const d = new Date();
    // Find most recent Friday
    while (d.getDay() !== 5) {
        d.setDate(d.getDate() - 1);
    }
    return d.toISOString().split('T')[0];
})();

// --- 1. USERS ---
export const USERS: User[] = [
  { 
      id: 1, 
      name: 'Alice Johnson', 
      email: 'alice@gmg.com', 
      role: 'consultant', 
      phone: '416-555-0101',
      certificates: [
          { id: 'cert-1', name: 'Working at Heights (Refresher)', issueDate: daysAgo(365), expiryDate: daysFromNow(730), notes: 'Ministry approved' },
          { id: 'cert-2', name: 'First Aid - Standard Level C', issueDate: daysAgo(400), expiryDate: daysFromNow(600) },
          { id: 'cert-3', name: 'WHMIS 2015', issueDate: daysAgo(100), expiryDate: daysFromNow(265) }
      ]
  },
  { 
      id: 2, 
      name: 'Bob Williams', 
      email: 'bob@gmg.com', 
      role: 'consultant', 
      phone: '905-555-0102',
      certificates: [
          { id: 'cert-5', name: 'WHMIS 2015', issueDate: daysAgo(400), expiryDate: daysAgo(35), notes: 'EXPIRED: Needs immediate renewal' }, // Expired
          { id: 'cert-8', name: 'Working at Heights', issueDate: daysAgo(1100), expiryDate: daysAgo(5), notes: 'Expired last week' }, // Expired
          { id: 'cert-9', name: 'First Aid - Standard Level C', issueDate: daysAgo(1080), expiryDate: daysFromNow(10) } // Expiring Soon
      ]
  },
  { id: 3, name: 'Charlie Davis', email: 'charlie@gmg.com', role: 'management', phone: '416-555-0103' },
  { 
      id: 4, 
      name: 'David Miller', 
      email: 'david@gmg.com', 
      role: 'consultant', 
      phone: '519-555-0104',
      certificates: [
          { id: 'cert-10', name: 'Working at Heights', issueDate: daysAgo(200), expiryDate: daysFromNow(895) },
          { id: 'cert-11', name: 'Traffic Control (Book 7)', issueDate: daysAgo(400), expiryDate: daysAgo(1), notes: 'Just Expired' }
      ] 
  },
  {
      id: 5,
      name: 'Sarah Connor',
      email: 'sarah@gmg.com',
      role: 'consultant',
      phone: '647-555-9876',
      certificates: [
          { id: 'cert-12', name: 'Joint Health and Safety Committee Part 1', issueDate: daysAgo(60), expiryDate: '' },
          { id: 'cert-13', name: 'Working at Heights', issueDate: daysAgo(10), expiryDate: daysFromNow(1085) }
      ]
  }
];

// --- 2. SITES ---
export const SITES: Site[] = [
  // Active / Assigned Sites (Alice - ID 1)
  { id: 1, clientName: 'ABC Construction', address: '123 Main St', city: 'Toronto', frequency: 'Weekly', assignedConsultantId: 1, status: 'Active', clientType: 'General Contractor', scopeOfWork: 'Full site safety inspection weekly.', contacts: [{role: 'Site Super', name: 'John Doe', info: '555-1234'}], latitude: 43.6532, longitude: -79.3832 },
  { id: 4, clientName: 'Urban Condos', address: '101 High Rise Blvd', city: 'Toronto', frequency: 'Weekly', assignedConsultantId: 1, status: 'Active', clientType: 'General Contractor', scopeOfWork: 'High rise construction safety.', contacts: [], latitude: 43.6426, longitude: -79.3871 },
  { id: 3, clientName: 'City Developments', address: '789 Pine Ln', city: 'Brampton', frequency: 'Monthly', assignedConsultantId: 1, status: 'Active', clientType: 'Developer', scopeOfWork: 'Monthly audit of safety documentation.', contacts: [], latitude: 43.7315, longitude: -79.7624 },
  
  // Active / Assigned Sites (Bob - ID 2)
  { id: 2, clientName: 'XYZ Builders', address: '456 Oak Ave', city: 'Mississauga', frequency: 'Bi-Weekly', assignedConsultantId: 2, status: 'Active', clientType: 'Framing Subtrade', scopeOfWork: 'Check PPE and fall arrest systems.', contacts: [{role: 'Foreman', name: 'Mike Smith', info: '555-5678'}], latitude: 43.5890, longitude: -79.6441, lastVisited: daysAgo(3) },
  { id: 5, clientName: 'Suburban Homes', address: '202 Suburbia Dr', city: 'Vaughan', frequency: 'Bi-Weekly', assignedConsultantId: 2, status: 'Active', clientType: 'Home Builder', scopeOfWork: 'Low rise residential inspection.', contacts: [], latitude: 43.8563, longitude: -79.5085 },
  
  // Active / Assigned Sites (David - ID 4)
  { id: 6, clientName: 'Tech Hub Reno', address: '303 Innovation Way', city: 'Markham', frequency: 'Weekly', assignedConsultantId: 4, status: 'Active', clientType: 'Renovation', scopeOfWork: 'Interior demo and re-fit safety.', contacts: [], latitude: 43.8561, longitude: -79.3370 },
  { id: 9, clientName: 'East Side Lofts', address: '606 Heritage St', city: 'Scarborough', frequency: 'Bi-Weekly', assignedConsultantId: 4, status: 'Active', clientType: 'Restoration', scopeOfWork: 'Facade restoration safety.', contacts: [], latitude: 43.7731, longitude: -79.2576 },

  // Specific Status Cases
  { 
      id: 7, clientName: 'Lakeside Towers', address: '404 Waterfront Rd', city: 'Toronto', frequency: 'Weekly', 
      assignedConsultantId: 1, status: 'On Hold', onHoldReason: 'Project paused for winter', onHoldStart: daysAgo(10), onHoldEnd: daysFromNow(20), onHoldSetBy: 3, onHoldApprovalStatus: 'Approved', 
      clientType: 'High Rise', scopeOfWork: 'Excavation phase.', contacts: [], latitude: 43.638, longitude: -79.39 
  },
  { 
      id: 8, clientName: 'West End Plaza', address: '505 Retail Ct', city: 'Etobicoke', frequency: 'Monthly', 
      assignedConsultantId: 2, status: 'Completed', clientType: 'Commercial', scopeOfWork: 'Plaza renovation.', contacts: [], latitude: 43.6205, longitude: -79.5132,
      billingStatus: 'processed', billingStatusUpdatedAt: daysAgo(5), billingStatusUpdatedBy: 3
  },
  
  // Unassigned Pool
  { id: 10, clientName: 'North Gate Industrial', address: '707 Factory Ln', city: 'Vaughan', frequency: 'Shop Audit', assignedConsultantId: 0, status: 'Active', clientType: 'Industrial', scopeOfWork: 'Shop floor safety audit.', contacts: [], latitude: 43.83, longitude: -79.55 },
  { id: 11, clientName: 'River Valley Estates', address: '808 River Rd', city: 'Brampton', frequency: 'Weekly', assignedConsultantId: 0, status: 'Active', clientType: 'Developer', scopeOfWork: 'Subdivision service.', contacts: [], latitude: 43.7, longitude: -79.75 },

  // Linked Sites Group
  { id: 12, clientName: 'Metro Expansion Ph1', address: '900 Transit Way', city: 'Toronto', frequency: 'Weekly', assignedConsultantId: 5, status: 'Active', clientType: 'Infrastructure', scopeOfWork: 'Tunneling safety.', siteGroupId: 'metro-exp', contacts: [], latitude: 43.66, longitude: -79.4 },
  { id: 13, clientName: 'Metro Expansion Ph2', address: '902 Transit Way', city: 'Toronto', frequency: 'Weekly', assignedConsultantId: 5, status: 'Active', clientType: 'Infrastructure', scopeOfWork: 'Station fit-out.', siteGroupId: 'metro-exp', contacts: [], latitude: 43.665, longitude: -79.41 },

  // On Hold Pending Review
  { 
      id: 14, clientName: 'Mapleview Mall', address: '555 Maple Ave', city: 'Burlington', frequency: 'Monthly', 
      assignedConsultantId: 2, status: 'On Hold', onHoldReason: 'Client requested stop due to budget.', onHoldStart: daysAgo(1), onHoldEnd: daysFromNow(30), onHoldSetBy: 2, onHoldApprovalStatus: 'Pending',
      clientType: 'Retail', scopeOfWork: 'Renovation.', contacts: [], latitude: 43.32, longitude: -79.8 
  },

  // Priority Site
  { id: 15, clientName: 'Emergency Hospital Wing', address: '777 Health Dr', city: 'Mississauga', frequency: 'Weekly', assignedConsultantId: 1, status: 'Active', isPriority: true, priorityNote: 'Ensure strictly 7AM start.', clientType: 'Institutional', scopeOfWork: 'Critical infrastructure.', contacts: [], latitude: 43.55, longitude: -79.6 }
];

// --- 3. REPORTS ---
export const REPORTS: Report[] = [
    // TODAY'S Reports (Simulates activity for Tracking View)
    {
        id: 'rep-today-1', siteId: 1, consultantId: 1, visitDate: daysAgo(0), status: 'Visit Complete',
        notes: 'Site activity normal. Excavation continuing.', managementNotes: '', reviewStatus: null,
        proceduresCreated: [], documents: [], deliveredItems: { greenBooks: 1 }
    },
    {
        id: 'rep-today-2', siteId: 6, consultantId: 4, visitDate: daysAgo(0), status: 'Visit Complete',
        notes: 'Drywall installation in progress. PPE compliance good.', managementNotes: '', reviewStatus: null,
        proceduresCreated: ['JHA'], documents: []
    },

    // Pending Review Reports
    {
        id: 'rep-pending-1', siteId: 2, consultantId: 2, visitDate: daysAgo(1), status: 'Site Not Active',
        notes: 'Site locked upon arrival. No answer from super.', managementNotes: 'Need to contact head office to confirm schedule.', reviewStatus: 'pending',
        proceduresCreated: [], documents: []
    },
    {
        id: 'rep-pending-2', siteId: 15, consultantId: 1, visitDate: daysAgo(2), status: 'Visit Complete',
        notes: 'Visit done.', managementNotes: 'Address changed to Building B entrance.', reviewStatus: 'pending',
        proceduresCreated: [], documents: []
    },

    // History
    {
        id: 'rep-hist-1', siteId: 8, consultantId: 2, visitDate: daysAgo(5), status: 'Project Finished',
        notes: 'Final walkthrough completed. All deficiencies closed.', managementNotes: '', reviewStatus: 'approved',
        proceduresCreated: [], documents: [], deliveredItems: { safetyBoard: 1 }
    },
    {
        id: 'rep-hist-2', siteId: 4, consultantId: 1, visitDate: daysAgo(7), status: 'Visit Complete',
        notes: 'Routine inspection.', managementNotes: '', reviewStatus: null,
        proceduresCreated: ['SWP'], documents: []
    }
];

// --- 4. PROCEDURES ---
export const PROCEDURES: Procedure[] = [
    { id: 'proc-1', siteId: 6, consultantId: 4, description: 'JHA for overhead drywall installation', status: 'Ongoing', createdAt: daysAgo(0), type: 'JHA' },
    { id: 'proc-2', siteId: 4, consultantId: 1, description: 'SWP for confined space entry', status: 'Completed', createdAt: daysAgo(7), type: 'SWP', fileUrl: 'conf_space_swp_v1.pdf' }
];

// --- 5. ANNOUNCEMENTS ---
export const ANNOUNCEMENTS: Announcement[] = [
    { id: 1, message: "URGENT: Winter weather advisory for tomorrow. Drive safe.", createdAt: daysAgo(0), requiresAcknowledgment: true, isAcknowledged: false, type: 'banner' },
    { id: 2, message: "Certificate Expiring Soon: Bob Williams - First Aid", createdAt: daysAgo(2), targetUserId: 3, requiresAcknowledgment: false, isAcknowledged: false, type: 'general' },
    { id: 3, message: "New Site Assigned: River Valley Estates", createdAt: daysAgo(5), targetUserId: 5, requiresAcknowledgment: true, isAcknowledged: true, acknowledgedAt: daysAgo(4), type: 'general' }
];

// --- 6. COMPLAINTS ---
export const COMPLAINTS: Complaint[] = [
    { id: 'comp-1', userId: 2, siteId: 2, notes: "Client reported consultant was late without notice.", date: daysAgo(10), status: 'Open', managementNotes: '' },
    { id: 'comp-2', userId: 1, siteId: 1, notes: "Minor PPE violation reported by safety officer.", date: daysAgo(20), status: 'Resolved', managementNotes: 'Discussed with Alice. Warning issued.' }
];

// --- 7. INCENTIVES ---
export const INCENTIVES: Incentive[] = [
    { id: 'inc-1', userId: 4, description: 'Referral for Tech Hub Reno project', amount: 250.00, date: daysAgo(15), status: 'Paid', incentiveType: 'Lump Sum', category: 'Referral' },
    { id: 'inc-2', userId: 1, description: 'Upsold Safety Training package to ABC Const.', amount: 500.00, date: daysAgo(2), status: 'Pending', incentiveType: 'Lump Sum', category: 'Client Expansion' }
];

// --- 8. ACTION LOGS ---
export const ACTION_LOGS: ActionLog[] = [
    { id: 'log-1', userId: 1, userName: 'Alice Johnson', actionType: 'Report Filed', details: 'Report filed for ABC Construction', timestamp: new Date().toISOString(), siteId: 1 },
    { id: 'log-2', userId: 3, userName: 'Charlie Davis', actionType: 'Status Change', details: 'Approved hold request for Lakeside Towers', timestamp: daysAgo(1), siteId: 7 }
];

// --- 9. BULLETIN BOARD ---
export const BULLETIN_ITEMS: BulletinItem[] = [
    { 
        id: 'bull-1', 
        title: 'Holiday Schedule', 
        content: 'Office will be closed Dec 24-26. Please ensure all reports are filed by Dec 23.', 
        category: 'Company Update', 
        priority: 'High', 
        createdAt: daysAgo(2),
        createdBy: 3,
        acknowledgments: []
    },
    { 
        id: 'bull-2', 
        title: 'New Safety Boot Reimbursement Policy', 
        content: 'Coverage increased to $200 annually. Submit receipts to HR.', 
        category: 'General', 
        priority: 'Normal', 
        createdAt: daysAgo(10),
        createdBy: 3,
        acknowledgments: [{ userId: 1, timestamp: daysAgo(9) }]
    }
];
