
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BulletinCategory, BulletinPriority, UserRole, BulletinItem } from '../types';
import { formatDateString } from '../utils/formatDate';
import { 
    BulletinBoardIcon, 
    PlusCircleIcon, 
    TrashIcon, 
    CheckCircleIcon,
    MegaphoneIcon,
    ShieldExclamationIcon,
    PencilIcon
} from './icons';
import EmptyState from './common/EmptyState';
import Modal from './common/Modal';

// --- Banner Modal ---
const BroadcastBannerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { broadcastBanner } = useAppContext();
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setIsSubmitting(true);
        await broadcastBanner(message.trim());
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Send Broadcast Banner">
            <div className="space-y-6">
                <div className="p-4 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <MegaphoneIcon className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">High Priority Alert</h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <p>
                                    This will create a high-priority banner at the top of <strong>everyone's</strong> screen. Users will be required to confirm receipt to dismiss it.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="banner-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Message</label>
                        <div className="mt-1">
                            <textarea 
                                id="banner-message"
                                rows={3} 
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400"
                                placeholder="e.g. Site closed tomorrow due to severe weather."
                                required 
                                maxLength={120}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right dark:text-gray-400">{message.length}/120 characters</p>
                    </div>
                    
                    <div className="flex justify-end pt-4 space-x-3 border-t dark:border-gray-600">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 shadow-sm">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !message.trim()} className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">{isSubmitting ? 'Sending...' : 'Send Banner'}</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// --- Bulletin Item Modal (Create & Edit) ---
interface BulletinItemModalProps {
    onClose: () => void;
    initialItem?: BulletinItem;
}

const BulletinItemModal: React.FC<BulletinItemModalProps> = ({ onClose, initialItem }) => {
    const { addBulletinItem, updateBulletinItem } = useAppContext();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<BulletinCategory>('Company Update');
    const [priority, setPriority] = useState<BulletinPriority>('Normal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialItem) {
            setTitle(initialItem.title);
            setContent(initialItem.content);
            setCategory(initialItem.category);
            setPriority(initialItem.priority);
        }
    }, [initialItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;
        setIsSubmitting(true);
        
        if (initialItem) {
            await updateBulletinItem(initialItem.id, {
                title: title.trim(),
                content: content.trim(),
                category,
                priority
            });
        } else {
            await addBulletinItem({
                title: title.trim(),
                content: content.trim(),
                category,
                priority,
                createdBy: 0 // Context will override this with actual user ID
            });
        }
        
        setIsSubmitting(false);
        onClose();
    };

    const inputClasses = "mt-1 block w-full rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary sm:text-sm";
    const modalTitle = initialItem ? "Edit Notice" : "Post New Notice";

    return (
        <Modal isOpen={true} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} placeholder="e.g. Upcoming Ministry Blitz" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value as BulletinCategory)} className={inputClasses}>
                        <option value="Company Update">Company Update</option>
                        <option value="Health & Safety">Health & Safety</option>
                        <option value="General">General</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as BulletinPriority)} className={inputClasses}>
                        <option value="Normal">Normal</option>
                        <option value="High">High (Urgent)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                    <textarea rows={5} value={content} onChange={e => setContent(e.target.value)} className={inputClasses} placeholder="Details..." required />
                </div>
                <div className="flex justify-end pt-4 space-x-3 border-t dark:border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary disabled:opacity-50">{isSubmitting ? 'Saving...' : (initialItem ? 'Save Changes' : 'Post Notice')}</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Read Receipts Modal (Management Only) ---
const ReadReceiptsModal: React.FC<{ item: any; onClose: () => void; users: any[] }> = ({ item, onClose, users }) => {
    const readers = item.acknowledgments.map((ack: any) => ({
        user: users.find(u => u.id === ack.userId),
        timestamp: ack.timestamp
    }));

    return (
        <Modal isOpen={true} onClose={onClose} title="Read Receipts">
            <div className="space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-100">{item.title}</h4>
                <div className="overflow-hidden border rounded-lg dark:border-gray-600">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Name</th>
                                <th className="px-4 py-2 text-xs font-medium text-right text-gray-500 uppercase dark:text-gray-400">Read At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {readers.length > 0 ? (
                                readers.map((r: any, i: number) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{r.user?.name || 'Unknown User'}</td>
                                        <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">{new Date(r.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-4 py-4 text-sm text-center text-gray-500 dark:text-gray-400">No acknowledgments yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">Close</button>
                </div>
            </div>
        </Modal>
    );
};


const BulletinBoardView: React.FC = () => {
    const { user, users, bulletinItems, deleteBulletinItem, acknowledgeBulletinItem } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BulletinItem | undefined>(undefined);
    const [viewingReceiptsItem, setViewingReceiptsItem] = useState<any | null>(null);

    const isManagement = user?.role === 'management';

    const sortedItems = useMemo(() => {
        return [...bulletinItems].sort((a, b) => {
            // High priority first, then date
            if (a.priority === 'High' && b.priority !== 'High') return -1;
            if (a.priority !== 'High' && b.priority === 'High') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [bulletinItems]);

    const handleCreate = () => {
        setEditingItem(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (item: BulletinItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const getCategoryColor = (cat: BulletinCategory) => {
        switch(cat) {
            case 'Health & Safety': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'Company Update': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
        }
    };

    const getPriorityIcon = (priority: BulletinPriority) => {
        if (priority === 'High') return <ShieldExclamationIcon className="w-5 h-5 text-red-500" />;
        return <MegaphoneIcon className="w-5 h-5 text-gray-400" />;
    };
    
    const formatFullDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {isModalOpen && <BulletinItemModal onClose={() => setIsModalOpen(false)} initialItem={editingItem} />}
            {isBannerModalOpen && <BroadcastBannerModal onClose={() => setIsBannerModalOpen(false)} />}
            {viewingReceiptsItem && <ReadReceiptsModal item={viewingReceiptsItem} users={users} onClose={() => setViewingReceiptsItem(null)} />}

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Bulletin Board</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Official company updates and health & safety notices.
                    </p>
                </div>
                {isManagement && (
                    <div className="flex space-x-3">
                         <button 
                            onClick={() => setIsBannerModalOpen(true)} 
                            className="flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors rounded-md bg-red-600 hover:bg-red-700 shadow-sm"
                        >
                            <MegaphoneIcon className="w-5 h-5 mr-2" />
                            Send Banner Alert
                        </button>
                        <button 
                            onClick={handleCreate} 
                            className="flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-secondary shadow-sm"
                        >
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Post Notice
                        </button>
                    </div>
                )}
            </div>

            {sortedItems.length > 0 ? (
                <div className="grid gap-6">
                    {sortedItems.map(item => {
                        const isRead = item.acknowledgments.some(ack => ack.userId === user?.id);
                        const readCount = item.acknowledgments.length;
                        const author = users.find(u => u.id === item.createdBy)?.name || 'Management';

                        return (
                            <div 
                                key={item.id} 
                                className={`relative p-6 bg-white border-l-4 rounded-r-lg shadow-sm dark:bg-gray-800 ${item.priority === 'High' ? 'border-red-500' : 'border-brand-primary'} ${!isRead && !isManagement ? 'ring-2 ring-offset-2 ring-brand-accent' : ''}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getPriorityIcon(item.priority)}
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getCategoryColor(item.category)}`}>
                                                {item.category}
                                            </span>
                                            {item.priority === 'High' && <span className="text-xs font-bold text-red-600 uppercase">Urgent</span>}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{item.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Posted by <span className="font-medium">{author}</span> on {formatFullDateTime(item.createdAt)}
                                        </p>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                                        {isManagement ? (
                                            <>
                                                <button onClick={() => setViewingReceiptsItem(item)} className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 whitespace-nowrap">
                                                    Seen by {readCount}
                                                </button>
                                                <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="Edit Notice">
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => deleteBulletinItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove Notice">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            isRead ? (
                                                <div className="flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full dark:bg-green-900/20 dark:text-green-300 border border-green-100 dark:border-green-800 whitespace-nowrap">
                                                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                    Acknowledged
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => acknowledgeBulletinItem(item.id)}
                                                    className="flex items-center px-4 py-2 text-sm font-bold text-white transition-colors bg-green-600 rounded-md hover:bg-green-700 shadow-sm whitespace-nowrap"
                                                >
                                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                                    Mark as Read
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-4 prose prose-sm text-gray-700 dark:text-gray-300 max-w-none whitespace-pre-wrap">
                                    {item.content}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState 
                    Icon={BulletinBoardIcon} 
                    title="Bulletin Board Empty" 
                    message="No notices have been posted yet." 
                />
            )}
        </div>
    );
};

export default BulletinBoardView;
