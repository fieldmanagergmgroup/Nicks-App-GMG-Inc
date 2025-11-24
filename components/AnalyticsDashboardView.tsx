import React, { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Site, User, Report, VisitFrequency, SiteStatus } from '../types';
import EmptyState from './common/EmptyState';
import { ChartPieIcon, ClipboardListCheckIcon, ShieldExclamationIcon, CheckBadgeIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import { getWeekRange } from '../utils/dateUtils';

// --- Helper Components ---

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; trend?: number; note?: string; color: string; }> = ({ title, value, icon: Icon, trend, note, color }) => {
    const trendColor = trend && trend >= 0 ? 'text-green-600' : 'text-red-600';
    return (
        <div className="flex flex-col p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
                    <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${color}/20`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
            {trend !== undefined && (
                 <div className="flex items-center mt-2 text-xs">
                    <span className={`flex items-center font-semibold ${trendColor}`}>
                        {trend >= 0 ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
                        {Math.abs(trend)}%
                    </span>
                    <span className="ml-1 text-gray-500 dark:text-gray-400">vs last week</span>
                </div>
            )}
            {note && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note}</p>}
        </div>
    );
};

const cityCoordinates: Record<string, { x: number; y: number; name: string }> = {
  Toronto: { x: 60, y: 50, name: 'Toronto' }, Mississauga: { x: 45, y: 55, name: 'Mississauga' }, Brampton: { x: 40, y: 45, name: 'Brampton' }, Vaughan: { x: 55, y: 40, name: 'Vaughan' }, Markham: { x: 70, y: 42, name: 'Markham' }, Scarborough: { x: 75, y: 50, name: 'Scarborough' }, Etobicoke: { x: 50, y: 60, name: 'Etobicoke' }, Hamilton: { x: 20, y: 80, name: 'Hamilton' }, Guelph: { x: 15, y: 40, name: 'Guelph' }, Niagara: { x: 30, y: 95, name: 'Niagara' }, Sarnia: { x: 5, y: 70, name: 'Sarnia' }, Windsor: { x: 10, y: 95, name: 'Windsor' }, Waterloo: { x: 20, y: 35, name: 'Waterloo' },
};
const statusColors: Record<SiteStatus, string> = { 'Active': 'fill-green-500', 'On Hold': 'fill-yellow-500', 'Not Active': 'fill-red-500', 'Completed': 'fill-gray-500' };

const SiteMapView: React.FC<{ sites: Site[]; users: User[] }> = ({ sites, users }) => {
    const [filterConsultantId, setFilterConsultantId] = useState<number | 'all'>('all');
    const consultants = useMemo(() => users.filter(u => u.role === 'consultant'), [users]);
    const filteredSites = useMemo(() => sites.filter(s => filterConsultantId === 'all' || s.assignedConsultantId === filterConsultantId), [sites, filterConsultantId]);

    return (
        <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Site Distribution Map</h3>
            <select value={filterConsultantId} onChange={(e) => setFilterConsultantId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="w-full p-2 mt-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                <option value="all">All Consultants</option>
                {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="relative mt-4 bg-gray-100 rounded-md aspect-square dark:bg-gray-700/50">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {Object.values(cityCoordinates).map(city => (
                        <text key={city.name} x={city.x} y={city.y} fontSize="3" className="font-semibold fill-gray-400 dark:fill-gray-500" textAnchor="middle">{city.name}</text>
                    ))}
                    {filteredSites.map(site => {
                        const coords = site.city ? cityCoordinates[site.city] : null;
                        if (!coords) return null;
                        const jitterX = (Math.random() - 0.5) * 4;
                        const jitterY = (Math.random() - 0.5) * 4;
                        return (
                            <circle key={site.id} cx={coords.x + jitterX} cy={coords.y + jitterY} r="1.5" className={`${statusColors[site.status] || 'fill-gray-400'} transition-opacity opacity-80 hover:opacity-100`}>
                                <title>{`${site.clientName}\nStatus: ${site.status}`}</title>
                            </circle>
                        )
                    })}
                </svg>
            </div>
        </div>
    );
};

// --- Main Component ---

const AnalyticsDashboardView: React.FC = () => {
  const { sites, users, reports, procedures } = useAppContext();
  const consultants = useMemo(() => users.filter(u => u.role === 'consultant' || u.role === 'management'), [users]);
  
  const { weeklyData, lastWeeklyData } = useMemo(() => {
    const now = new Date();
    const { start: weekStart, end: weekEnd } = getWeekRange(now);
    
    const lastWeekDate = new Date(now.getTime());
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const { start: lastWeekStart, end: lastWeekEnd } = getWeekRange(lastWeekDate);
    
    const filterDataForWeek = (start: Date, end: Date) => {
        const weeklyReports = reports.filter(r => {
            const visitDate = new Date(r.visitDate);
            return visitDate >= start && visitDate <= end;
        });
        const sitesNeedingAttention = new Set(weeklyReports.filter(r => r.status === 'Site Not Active' || r.status === 'Client Cancelled').map(r => r.siteId));
        const weeklyProcedures = procedures.filter(p => {
            const createdDate = new Date(p.createdAt);
            return createdDate >= start && createdDate <= end;
        });
        return {
            reports: weeklyReports,
            attentionCount: sitesNeedingAttention.size,
            procedures: weeklyProcedures,
        };
    };

    return {
        weeklyData: filterDataForWeek(weekStart, weekEnd),
        lastWeeklyData: filterDataForWeek(lastWeekStart, lastWeekEnd)
    };
  }, [reports, procedures]);

  const stats = useMemo(() => {
    const activeSitesCount = sites.filter(s => s.status === 'Active').length;
    const completionRate = activeSitesCount > 0 ? (new Set(weeklyData.reports.map(r => r.siteId)).size / activeSitesCount) * 100 : 0;
    const lastCompletionRate = activeSitesCount > 0 ? (new Set(lastWeeklyData.reports.map(r => r.siteId)).size / activeSitesCount) * 100 : 0;
    const calcTrend = (current: number, previous: number) => previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0);

    return {
      totalVisits: { value: weeklyData.reports.length, trend: calcTrend(weeklyData.reports.length, lastWeeklyData.reports.length) },
      completionRate: { value: completionRate, trend: calcTrend(completionRate, lastCompletionRate) },
      attentionSites: { value: weeklyData.attentionCount, trend: calcTrend(weeklyData.attentionCount, lastWeeklyData.attentionCount) },
      pendingReviews: { value: reports.filter(r => r.reviewStatus === 'pending').length },
    };
  }, [sites, reports, weeklyData, lastWeeklyData]);

  const consultantPerformance = useMemo(() => {
    return consultants.map(consultant => {
        const consultantReports = weeklyData.reports.filter(r => r.consultantId === consultant.id);
        const reportSiteIds = new Set(consultantReports.map(r => r.siteId));
        const visitedSites = sites.filter(s => reportSiteIds.has(s.id));
        const visitMix = visitedSites.reduce<Record<string, number>>((acc, site) => {
            acc[site.frequency] = (acc[site.frequency] || 0) + 1;
            return acc;
        }, {});
        const totalVisits = consultantReports.length;
        const mixPercentages = totalVisits > 0 ? Object.entries(visitMix).map(([freq, count]) => ({ freq: freq as VisitFrequency, percent: (Number(count) / totalVisits) * 100 })) : [];

        return {
            ...consultant,
            totalVisits,
            proceduresCount: weeklyData.procedures.filter(p => p.consultantId === consultant.id).length,
            mix: mixPercentages,
        };
    }).sort((a,b) => b.totalVisits - a.totalVisits);
  }, [consultants, weeklyData, sites]);

  const dailyVisitDistribution = useMemo(() => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const counts = Array(7).fill(0);
      weeklyData.reports.forEach(r => {
          const dayIndex = new Date(r.visitDate).getUTCDay(); // UTC day to be consistent
          const adjustedIndex = (dayIndex === 0) ? 6 : dayIndex - 1; // Mon = 0, Sun = 6
          counts[adjustedIndex]++;
      });
      return days.map((day, i) => ({ name: day, visits: counts[i] }));
  }, [weeklyData.reports]);
  const maxDailyVisits = Math.max(...dailyVisitDistribution.map(d => d.visits), 1);

  if (sites.length === 0) {
    return <EmptyState Icon={ChartPieIcon} title="Not Enough Data" message="Start adding and managing sites to see analytics." />;
  }
  
  const frequencyColors: Record<VisitFrequency, string> = { 'Weekly': 'bg-blue-500', 'Bi-Weekly': 'bg-purple-500', 'Monthly': 'bg-indigo-500', 'Shop Audit': 'bg-yellow-500' };

  return (
    <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Visits This Week" value={stats.totalVisits.value.toString()} icon={ChartPieIcon} trend={stats.totalVisits.trend} color="text-sky-500" />
            <StatCard title="Visit Completion Rate" value={`${stats.completionRate.value.toFixed(0)}%`} icon={ClipboardListCheckIcon} trend={stats.completionRate.trend} note={`${new Set(weeklyData.reports.map(r => r.siteId)).size} of ${sites.filter(s => s.status === 'Active').length} active sites`} color="text-green-500" />
            <StatCard title="Sites Needing Attention" value={stats.attentionSites.value.toString()} icon={ShieldExclamationIcon} trend={stats.attentionSites.trend} note="Not Active or Cancelled" color="text-amber-500" />
            <StatCard title="Pending Reviews" value={stats.pendingReviews.value.toString()} icon={CheckBadgeIcon} note="Reports needing approval" color="text-red-500" />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Consultant Leaderboard */}
            <div className="space-y-4 lg:col-span-2">
                 <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                     <h3 className="font-semibold text-gray-800 dark:text-gray-100">Consultant Performance This Week</h3>
                     <div className="mt-4 space-y-3">
                        {consultantPerformance.map(c => (
                            <div key={c.id} className="p-3 space-y-2 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{c.name}</p>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{c.totalVisits} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">visits</span></p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.proceduresCount} procedures</p>
                                    </div>
                                </div>
                                {c.totalVisits > 0 && <div className="flex w-full h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                                    {c.mix.map(m => <div key={m.freq} className={frequencyColors[m.freq]} style={{ width: `${m.percent}%`}} title={`${m.freq}: ${m.percent.toFixed(0)}%`}></div>)}
                                </div>}
                            </div>
                        ))}
                     </div>
                 </div>
                 <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Daily Visit Distribution</h3>
                    <div className="flex items-end h-40 mt-4 space-x-1 sm:space-x-2">
                        {dailyVisitDistribution.map(day => (
                            <div key={day.name} className="relative flex flex-col items-center flex-1 h-full">
                                <div className="flex-grow w-full bg-gray-200 rounded-t-md dark:bg-gray-700" title={`${day.visits} visits`}>
                                    <div className="w-full bg-brand-primary rounded-t-md" style={{ height: `${(day.visits / maxDailyVisits) * 100}%` }}></div>
                                </div>
                                <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{day.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Site Map */}
            <div className="lg:col-span-1">
                 <SiteMapView sites={sites} users={users} />
            </div>
        </div>
    </div>
  );
};

export default AnalyticsDashboardView;