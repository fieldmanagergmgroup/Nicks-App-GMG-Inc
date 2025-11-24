
import { Site } from '../types';
import { getBusinessDaysDiff, getStartOfBusinessWeek, getBusinessDaysRemainingInMonth, isBusinessDay } from './dateUtils';

export const isSiteDue = (site: Site, basisDate: Date = new Date()): boolean => {
    if (site.status === 'Not Active' || site.status === 'Completed') return false;
    
    // Handle On Hold Logic
    if (site.status === 'On Hold') {
        if (site.onHoldStart && site.onHoldEnd) {
            const todayStr = basisDate.toISOString().split('T')[0];
            const start = site.onHoldStart;
            const end = site.onHoldEnd;
            
            // If today is within the hold period (inclusive), it is NOT due
            if (todayStr >= start && todayStr <= end) {
                return false;
            }
        }
    }

    if (!site.lastVisited) return true; // Always due if never visited

    const lastVisitDate = new Date(site.lastVisited);
    // Reset hours for accurate day comparison
    lastVisitDate.setHours(0,0,0,0);
    const today = new Date(basisDate);
    today.setHours(0,0,0,0);

    // Business Day Logic Rule Set
    switch (site.frequency) {
        case 'Weekly': {
            // Due if not visited in the current week's business window (Mon-Fri)
            const startOfWeek = getStartOfBusinessWeek(today);
            return lastVisitDate < startOfWeek;
        }
        case 'Bi-Weekly': {
            // Due if > 10 business days passed (14-day window business days approx)
            const businessDaysPassed = getBusinessDaysDiff(lastVisitDate, today);
            return businessDaysPassed >= 10;
        }
        case 'Monthly': 
        case 'Shop Audit': {
            // Due if not visited in current month
            // AND (Last visit was previous month OR Business days remaining <= 5)
            const isSameMonth = lastVisitDate.getMonth() === today.getMonth() && lastVisitDate.getFullYear() === today.getFullYear();
            if (isSameMonth) return false; // Visited this month
            
            // Not visited this month. Is it due?
            // If we are in a new month, it is technically due, but we mark it "Due" primarily if urgency is high or just standard due.
            // Standard Due: If not visited this month, it is due.
            return true;
        }
        default: return false;
    }
};

// Generates the specific management alert text requested
export const getManagementAlert = (site: Site, basisDate: Date = new Date()): string | null => {
    if (site.status !== 'Active') return null;
    if (!site.lastVisited) return `${site.frequency} site due: This site has never been visited.`;

    const lastVisitDate = new Date(site.lastVisited);
    lastVisitDate.setHours(0,0,0,0);
    const today = new Date(basisDate);
    today.setHours(0,0,0,0);

    switch (site.frequency) {
        case 'Weekly': {
            // "Weekly site due: This site has not been visited during this week’s business-day window and requires a visit soon."
            const startOfWeek = getStartOfBusinessWeek(today);
            // If last visit was before this Monday, and today is a business day (Mon-Fri), it's potentially an issue if late in week.
            // Prompt says: "If a weekly site is not visited during the current week’s business days"
            // Alert triggers if we are in the week and it hasn't been done.
            if (lastVisitDate < startOfWeek) {
                 return `Weekly site due: ${site.clientName} has not been visited during this week’s business-day window and requires a visit soon.`;
            }
            return null;
        }
        case 'Bi-Weekly': {
            // "Bi-weekly site due: This site has not been visited within its bi-weekly business-day window and requires a visit soon."
            // 14-day window business days logic (10 business days)
            const businessDaysPassed = getBusinessDaysDiff(lastVisitDate, today);
            if (businessDaysPassed >= 10) {
                return `Bi-weekly site due: ${site.clientName} has not been visited within its bi-weekly business-day window and requires a visit soon.`;
            }
            return null;
        }
        case 'Monthly': {
            // "Monthly site due: This site is approaching or has exceeded its monthly business-day visit window."
            const isSameMonth = lastVisitDate.getMonth() === today.getMonth() && lastVisitDate.getFullYear() === today.getFullYear();
            
            if (!isSameMonth) {
                // Check if exceeded (last visit was previous month)
                // Check if approaching end (business days remaining <= 5)
                const businessDaysRemaining = getBusinessDaysRemainingInMonth(today);
                
                // If not visited this month, and (we are late in the month OR we completely missed previous months)
                // Simple logic: If not visited this month, warn management.
                // Refined by prompt: "approaching the end... or has exceeded"
                
                // Exceeded logic: It's a new month, haven't visited yet.
                // Approaching logic: It's the current month, haven't visited, and days remaining are low.
                
                // If it's day 1 of the month, are we "Approaching end"? No.
                // But if last visit was 2 months ago, we "Exceeded".
                
                // Let's use a simple heuristic: If not visited this month, and (BusinessDaysRemaining <= 7 OR DaysSinceLast > 30)
                const daysSince = (today.getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24);
                
                if (businessDaysRemaining <= 7 || daysSince > 35) {
                    return `Monthly site due: ${site.clientName} is approaching or has exceeded its monthly business-day visit window.`;
                }
            }
            return null;
        }
        case 'Shop Audit': {
             // "Shop Audit due: This location is approaching or has exceeded its monthly business-day audit window."
             // Same logic as Monthly
             const isSameMonth = lastVisitDate.getMonth() === today.getMonth() && lastVisitDate.getFullYear() === today.getFullYear();
             if (!isSameMonth) {
                 const businessDaysRemaining = getBusinessDaysRemainingInMonth(today);
                 const daysSince = (today.getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24);
                 if (businessDaysRemaining <= 7 || daysSince > 35) {
                    return `Shop Audit due: ${site.clientName} is approaching or has exceeded its monthly business-day audit window.`;
                 }
             }
             return null;
        }
        default:
            return null;
    }
};
