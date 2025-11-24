
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Incentive, IncentiveStatus, IncentiveType, IncentiveCategory, User } from '../types';
import { TrendingUpIcon, CurrencyDollarIcon, PlusCircleIcon, CheckCircleIcon, ClockIcon, DocumentDownloadIcon, ChartBarIcon, FunnelIcon } from './icons';
import EmptyState from './common/EmptyState';
import Modal from './common/Modal';
import { formatDateString } from '../utils/formatDate';
import { exportIncentivesToCSV } from '../utils/csvExport';

// --- Helper Components ---

const IncentiveStatCard: React.FC<{ title: string; value: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; }> = ({ title, value, icon: Icon, color }) => {
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
        </div>
    );
};

const IncentiveModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { users, addIncentive } = useAppContext();
    const [userId, setUserId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [status, setStatus] = useState<IncentiveStatus>('Pending');
    const [incentiveType, setIncentiveType] = useState<IncentiveType>('Lump Sum');
    const [category, setCategory] = useState<IncentiveCategory>('New Client');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !amount || !description) return;

        setIsSubmitting(true);
        await addIncentive({
            userId: parseInt(userId),
            amount: parseFloat(amount),
            description,
            status,
            incentiveType,
            category,
            date: new Date().toISOString().split('T')[0],
            notes
        });
        setIsSubmitting(false);
        onClose();
    };

    const inputClasses = "mt-1 block w-full rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary text-sm";

    return (
        <Modal isOpen={true} onClose={onClose} title="Log Business Growth Incentive">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Consultant / Manager</label>
                        <select value={userId} onChange={e => setUserId(e.target.value)} className={inputClasses} required>
                            <option value="">-- Select Recipient --</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Incentive Type</label>
                        <select value={incentiveType} onChange={e => setIncentiveType(e.target.value as IncentiveType)} className={inputClasses}>
                            <option value="Lump Sum">Lump Sum</option>
                            <option value="Percentage">Percentage</option>
                            <option value="Recurring">Recurring</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as IncentiveCategory)} className={inputClasses}>
                            <option value="New Client">New Client</option>
                            <option value="Client Expansion">Client Expansion</option>
                            <option value="Referral">Referral</option>
                            <option value="Performance">Performance</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount ($)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={inputClasses} placeholder="0.00" min="0" step="0.01" required />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputClasses} placeholder="e.g. Acquired new client Acme Corp" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as IncentiveStatus)} className={inputClasses}>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputClasses} />
                    </div>
                </div>
                <div className="flex justify-end pt-4 space-x-3 border-t dark:border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Log Incentive'}</button>
                </div>
            </form>
        </Modal>
    );
};

const GrowthIncentivesView: React.FC = () => {
    const { incentives, users, updateIncentive } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Filtering State
    const [filterUser, setFilterUser] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredIncentives = useMemo(() => {
        return incentives.filter(inc => {
            const userMatch = filterUser === 'all' || inc.userId === parseInt(filterUser);
            const typeMatch = filterType === 'all' || inc.incentiveType === filterType;
            const statusMatch = filterStatus === 'all' || inc.status === filterStatus;
            return userMatch && typeMatch && statusMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [incentives, filterUser, filterType, filterStatus]);

    const stats = useMemo(() => {
        const totalPaid = incentives.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
        const totalPending = incentives.filter(i => i.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
        
        const userTotals = incentives.reduce((acc, curr) => {
            acc[curr.userId] = (acc[curr.userId] || 0) + curr.amount;
            return acc;
        }, {} as Record<number, number>);
        
        let topUserId = -1;
        let maxAmount = -1;
        
        Object.entries(userTotals).forEach(([uid, amt]) => {
            const amount = amt as number;
            if (amount > maxAmount) {
                maxAmount = amount;
                topUserId = parseInt(uid);
            }
        });
        
        const topPerformer = topUserId !== -1 ? users.find(u => u.id === topUserId)?.name : 'N/A';

        // Monthly breakdown for chart
        const monthlyData = new Array(6).fill(0).map((_, i) => {
             const d = new Date();
             d.setMonth(d.getMonth() - (5-i)); // Go back 5 months to current
             return { month: d.toLocaleString('default', { month: 'short' }), amount: 0, fullDate: d };
        });

        incentives.filter(i => i.status === 'Paid').forEach(inc => {
            const incDate = new Date(inc.date);
            const monthIndex = monthlyData.findIndex(m => m.fullDate.getMonth() === incDate.getMonth() && m.fullDate.getFullYear() === incDate.getFullYear());
            if (monthIndex !== -1) {
                monthlyData[monthIndex].amount += inc.amount;
            }
        });

        return { totalPaid, totalPending, topPerformer, monthlyData };
    }, [incentives, users]);

    const maxMonthlyAmount = Math.max(...stats.monthlyData.map(d => d.amount), 1);

    const statusStyles = {
        'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        'Approved': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        'Paid': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };

    const handleStatusChange = (id: string, newStatus: IncentiveStatus) => {
        updateIncentive(id, { status: newStatus });
    };
    
    const filterSelectClass = "block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 text-sm focus:ring-brand-primary focus:border-brand-primary p-2 border";

    return (
        <div className="space-y-6">
            {isModalOpen && <IncentiveModal onClose={() => setIsModalOpen(false)} />}
            
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Business Growth Incentives</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Track payments and bonuses for consultants who acquire new clients or expand business.
                </p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <IncentiveStatCard title="Total Paid (All Time)" value={`$${stats.totalPaid.toLocaleString()}`} icon={CurrencyDollarIcon} color="text-green-600" />
                <IncentiveStatCard title="Pending Payouts" value={`$${stats.totalPending.toLocaleString()}`} icon={ClockIcon} color="text-yellow-600" />
                <IncentiveStatCard title="Top Performer" value={stats.topPerformer || 'N/A'} icon={TrendingUpIcon} color="text-blue-600" />
            </div>

             {/* Chart & Controls Container */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Payout Chart */}
                <div className="p-4 bg-white border rounded-lg shadow-sm lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-100">
                        <ChartBarIcon className="w-5 h-5 mr-2 text-gray-500" />
                        Payout History (Last 6 Months)
                    </h3>
                    <div className="flex items-end h-48 mt-6 space-x-4 sm:space-x-8">
                        {stats.monthlyData.map((data, index) => (
                             <div key={index} className="relative flex flex-col items-center flex-1 h-full group">
                                <div className="relative flex items-end flex-grow w-full">
                                     <div 
                                        className="w-full transition-all duration-500 rounded-t-md bg-brand-primary/80 group-hover:bg-brand-primary" 
                                        style={{ height: `${(data.amount / maxMonthlyAmount) * 100}%`, minHeight: data.amount > 0 ? '4px' : '0' }}
                                     ></div>
                                      {data.amount > 0 && (
                                        <div className="absolute w-full -mt-6 text-xs font-bold text-center text-gray-700 opacity-0 bottom-full dark:text-gray-300 group-hover:opacity-100">
                                            ${data.amount}
                                        </div>
                                      )}
                                </div>
                                <div className="pt-2 text-xs font-medium text-gray-500 border-t border-gray-200 dark:border-gray-600 w-full text-center dark:text-gray-400">
                                    {data.month}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Actions Panel */}
                <div className="p-4 space-y-4 bg-gray-50 border rounded-lg dark:bg-gray-800/50 dark:border-gray-700">
                     <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Actions</h3>
                     <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 transition-colors">
                        <PlusCircleIcon className="w-5 h-5 mr-2" /> Log New Incentive
                    </button>
                    <button onClick={() => exportIncentivesToCSV(incentives, users)} className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                        <DocumentDownloadIcon className="w-5 h-5 mr-2" /> Export History (CSV)
                    </button>
                     <div className="pt-4 mt-2 border-t dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Note: Regularly review pending items to ensure timely payouts for consultants.
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed History Table */}
            <div className="bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Incentive History</h3>
                         <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative">
                                <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className={filterSelectClass}>
                                    <option value="all">All Users</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                             <div className="relative">
                                <select value={filterType} onChange={e => setFilterType(e.target.value)} className={filterSelectClass}>
                                    <option value="all">All Types</option>
                                    <option value="Lump Sum">Lump Sum</option>
                                    <option value="Percentage">Percentage</option>
                                    <option value="Recurring">Recurring</option>
                                </select>
                            </div>
                             <div className="relative">
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={filterSelectClass}>
                                    <option value="all">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Paid">Paid</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                {filteredIncentives.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Date</th>
                                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Consultant</th>
                                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Details</th>
                                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Type / Category</th>
                                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">Amount</th>
                                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-400">Status</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                {filteredIncentives.map((incentive) => {
                                    const user = users.find(u => u.id === incentive.userId);
                                    return (
                                        <tr key={incentive.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatDateString(incentive.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {user?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="max-w-xs truncate" title={incentive.description}>{incentive.description}</div>
                                                {incentive.notes && <div className="text-xs italic text-gray-400 truncate max-w-xs">{incentive.notes}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{incentive.incentiveType}</span>
                                                    <span className="text-xs">{incentive.category}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900 dark:text-gray-100">
                                                ${incentive.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                 <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[incentive.status]}`}>
                                                    {incentive.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {incentive.status === 'Pending' && (
                                                        <button onClick={() => handleStatusChange(incentive.id, 'Approved')} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Approve">
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {incentive.status !== 'Paid' && (
                                                        <button onClick={() => handleStatusChange(incentive.id, 'Paid')} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" title="Mark Paid">
                                                            <CurrencyDollarIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8">
                        <EmptyState Icon={FunnelIcon} title="No Incentives Found" message="Try adjusting the filters or log a new incentive." />
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrowthIncentivesView;
