
import { Site, User, Procedure, Incentive } from '../types';

function downloadCSV(csvContent: string, fileName: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const exportSitesToCSV = (sites: Site[], users: User[]) => {
    const headers = ['Client Name', 'Address', 'City', 'Frequency', 'Status', 'Assigned Consultant', 'Last Visited', 'Client Type', 'Scope of Work'];
    const userMap = new Map(users.map(u => [u.id, u.name]));
    
    const rows = sites.map(site => [
        `"${site.clientName.replace(/"/g, '""')}"`,
        `"${site.address.replace(/"/g, '""')}"`,
        `"${site.city ? site.city.replace(/"/g, '""') : ''}"`,
        site.frequency,
        site.status,
        userMap.get(site.assignedConsultantId) || 'Unassigned',
        site.lastVisited || 'N/A',
        `"${site.clientType.replace(/"/g, '""')}"`,
        `"${site.scopeOfWork.replace(/"/g, '""')}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `GMG_Sites_Export_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportProceduresToCSV = (procedures: Procedure[], sites: Site[], users: User[]) => {
    const headers = ['Description', 'Type', 'Site', 'Status', 'Created By', 'Created At', 'File'];
    const userMap = new Map(users.map(u => [u.id, u.name]));
    const siteMap = new Map(sites.map(s => [s.id, s.clientName]));

    const rows = procedures.map(proc => [
        `"${proc.description.replace(/"/g, '""')}"`,
        proc.type,
        siteMap.get(proc.siteId) || 'Unknown Site',
        proc.status,
        userMap.get(proc.consultantId) || 'Unknown',
        proc.createdAt,
        proc.fileUrl || 'No file'
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `GMG_Procedures_Export_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportIncentivesToCSV = (incentives: Incentive[], users: User[]) => {
    const headers = ['Date', 'Consultant', 'Type', 'Category', 'Amount', 'Status', 'Description', 'Notes'];
    const userMap = new Map(users.map(u => [u.id, u.name]));
    
    const rows = incentives.map(inv => [
        inv.date,
        userMap.get(inv.userId) || 'Unknown',
        inv.incentiveType,
        inv.category,
        inv.amount.toFixed(2),
        inv.status,
        `"${inv.description.replace(/"/g, '""')}"`,
        `"${(inv.notes || '').replace(/"/g, '""')}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `GMG_Incentives_History_${new Date().toISOString().split('T')[0]}.csv`);
};
