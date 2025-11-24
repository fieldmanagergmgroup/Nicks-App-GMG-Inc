
import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Weekday, VisitActivity, Site } from '../types';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { LocationMarkerIcon, CheckCircleIcon, ClockIcon } from './icons';
import EmptyState from './common/EmptyState';

const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const ConsultantTrackingView: React.FC = () => {
    const { users, weeklyPlans, visitActivities, reports, sites } = useAppContext();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute to refresh the "Shift" status
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const isShiftHours = useMemo(() => {
        const hour = currentTime.getHours();
        // 7:00 AM to 5:00 PM (17:00)
        return hour >= 7 && hour < 17;
    }, [currentTime]);

    const currentWeekday = useMemo(() => {
        const day = currentTime.getDay();
        return WEEKDAYS[day > 0 ? day - 1 : 6] || 'Monday'; // Default fallback if weekend
    }, [currentTime]);

    const consultants = useMemo(() => users.filter(u => u.role === 'consultant'), [users]);

    const trackingData = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        return consultants.map(consultant => {
            // 1. Get Today's Plan
            const plan = weeklyPlans[consultant.id];
            const plannedSites: Site[] = plan?.planned[currentWeekday] || [];
            
            // 2. Get Today's Activities (from background tracker)
            const todayActivities = visitActivities.filter(a => 
                a.consultantId === consultant.id && a.date === todayStr
            );

            // 3. Get Today's Completed Reports (Absolute Truth)
            const todayReports = reports.filter(r => 
                r.consultantId === consultant.id && r.visitDate === todayStr
            );
            const completedSiteIds = new Set(todayReports.map(r => r.siteId));

            // 4. Merge Plan with Status
            const timeline = plannedSites.map((site, index) => {
                const isCompleted = completedSiteIds.has(site.id);
                const activity = todayActivities.find(a => a.siteId === site.id);
                
                let status: 'pending' | 'in_progress' | 'completed' = 'pending';
                if (isCompleted) {
                    status = 'completed';
                } else if (activity) {
                    // If activity exists but report not filed, it's likely in progress
                    status = 'in_progress';
                }

                return {
                    site,
                    status,
                    lastActiveAt: activity?.lastActivityAt,
                    index
                };
            });

            // 5. Derive Current Status Label
            let statusLabel = "Not started today";
            let statusColor = "bg-gray-100 text-gray-500 border-gray-200";
            
            const activeSite = timeline.find(t => t.status === 'in_progress');
            const lastCompletedIndex = timeline.map(t => t.status).lastIndexOf('completed');
            const totalSites = timeline.length;
            const completedCount = timeline.filter(t => t.status === 'completed').length;

            if (totalSites === 0) {
                statusLabel = "No scheduled visits";
                statusColor = "bg-gray-100 text-gray-400 border-gray-200";
            } else if (completedCount === totalSites) {
                statusLabel = "All visits completed";
                statusColor = "bg-green-100 text-green-800 border-green-200";
            } else if (activeSite) {
                statusLabel = `On site: ${activeSite.site.clientName}`;
                statusColor = "bg-blue-100 text-blue-800 border-blue-200 animate-pulse";
            } else if (lastCompletedIndex >= 0 && lastCompletedIndex < totalSites - 1) {
                // If last one completed wasn't the final one, they are likely en route to next
                const nextSite = timeline[lastCompletedIndex + 1];
                statusLabel = `En route to: ${nextSite.site.clientName}`;
                statusColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
            } else if (completedCount > 0 && !activeSite) {
                 // Fallback logic if lastCompleted was the last one but totalSites mismatches (rare)
                 statusLabel = "Between sites";
                 statusColor = "bg-yellow-50 text-yellow-700 border-yellow-100";
            }

            // Determine Latest Activity Time for Sorting
            const latestTimestamp = todayActivities.length > 0 
                ? todayActivities.sort((a,b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())[0].lastActivityAt
                : null;

            return {
                consultant,
                timeline,
                statusLabel,
                statusColor,
                latestTimestamp,
                progress: totalSites > 0 ? (completedCount / totalSites) * 100 : 0,
                completedCount,
                totalSites
            };
        }).sort((a, b) => {
            // Sort by active/recent first
            if (a.latestTimestamp && !b.latestTimestamp) return -1;
            if (!a.latestTimestamp && b.latestTimestamp) return 1;
            if (a.latestTimestamp && b.latestTimestamp) {
                return new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime();
            }
            return a.consultant.name.localeCompare(b.consultant.name);
        });

    }, [consultants, weeklyPlans, visitActivities, reports, currentWeekday]);

    if (!isShiftHours) {
        return (
            <EmptyState 
                Icon={ClockIcon} 
                title="Outside Monitoring Hours" 
                message="Consultant tracking is active between 7:00 AM and 5:00 PM." 
            />
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Consultant Live Tracking</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Real-time status based on app activity. (7:00 AM - 5:00 PM)
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {trackingData.map(({ consultant, timeline, statusLabel, statusColor, progress, completedCount, totalSites }) => (
                    <div key={consultant.id} className="bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                        {/* Header Row */}
                        <div className="p-4 border-b dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                        <UserCircleIcon className="w-10 h-10" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{consultant.name}</h3>
                                    <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                                        {statusLabel}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            {totalSites > 0 && (
                                <div className="w-full sm:w-1/3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500 dark:text-gray-400">Daily Progress</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{completedCount}/{totalSites} Sites</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                        <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Timeline Row */}
                        {totalSites > 0 ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 overflow-x-auto">
                                <div className="flex space-x-4 min-w-max">
                                    {timeline.map((item, idx) => (
                                        <div key={item.site.id} className="flex flex-col items-center w-32 relative group">
                                            {/* Connector Line */}
                                            {idx < totalSites - 1 && (
                                                <div className={`absolute top-3 left-1/2 w-full h-0.5 ${item.status === 'completed' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} z-0`}></div>
                                            )}
                                            
                                            {/* Node Dot */}
                                            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 
                                                ${item.status === 'completed' ? 'bg-green-500 border-green-500' : 
                                                  item.status === 'in_progress' ? 'bg-blue-500 border-blue-500 animate-pulse' : 
                                                  'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600'}`}>
                                                {item.status === 'completed' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                                {item.status === 'in_progress' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>

                                            {/* Site Details */}
                                            <div className="mt-2 text-center">
                                                <p className={`text-xs font-semibold truncate w-full px-1 ${item.status === 'in_progress' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {item.site.clientName}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full">
                                                    {item.site.city}
                                                </p>
                                                {item.lastActiveAt && (
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Last active: {new Date(item.lastActiveAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500 italic">
                                No route planned for {currentWeekday}.
                            </div>
                        )}
                    </div>
                ))}
                
                {trackingData.length === 0 && (
                    <EmptyState Icon={UserCircleIcon} title="No Consultants" message="No consultants found in the system." />
                )}
            </div>
        </div>
    );
};

export default ConsultantTrackingView;
