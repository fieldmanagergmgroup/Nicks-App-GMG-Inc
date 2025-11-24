
import React, { useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { AcademicCapIcon, ShieldExclamationIcon, CheckCircleIcon, ClockIcon, XIcon } from './icons';
import EmptyState from './common/EmptyState';

const TrainingView: React.FC = () => {
  const { announcements, users, user, acknowledgeAnnouncement } = useAppContext();

  // 1. Get Alerts specifically for the logged-in manager regarding certificates
  const trainingNotifications = useMemo(() => {
      if (!user) return [];
      // Filter announcements that contain keywords related to certificates
      // and are relevant to the user (or global management alerts)
      return announcements.filter(a => 
          (a.targetUserId === user.id || !a.targetUserId) &&
          (a.message.toLowerCase().includes('certificate') || a.message.toLowerCase().includes('training')) &&
          !a.isAcknowledged
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [announcements, user]);

  // 2. Get Overview Data for all consultants
  const consultantCerts = useMemo(() => {
      if (!users) return [];
      return users.filter(u => u.role === 'consultant').map(u => {
          const certs = u.certificates || [];
          
          const expired = certs.filter(c => {
             if(!c || !c.expiryDate) return false;
             // Check if expiry date is strictly in the past (yesterday or before)
             const expiry = new Date(c.expiryDate);
             const today = new Date();
             today.setHours(0,0,0,0);
             return expiry < today;
          });

          const expiring = certs.filter(c => {
             if(!c || !c.expiryDate) return false;
             const expiry = new Date(c.expiryDate);
             const today = new Date();
             today.setHours(0,0,0,0);
             
             const diffTime = expiry.getTime() - today.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             
             // Expiring if within next 35 days (covering the 1 month alert window) AND not already expired
             return diffDays >= 0 && diffDays <= 35;
          });
          
          return {
              user: u,
              total: certs.length,
              expired,
              expiring,
              validCount: certs.length - expired.length - expiring.length
          };
      }).sort((a, b) => {
          // Sort by urgency: most expired/expiring first
          const urgencyA = a.expired.length * 10 + a.expiring.length;
          const urgencyB = b.expired.length * 10 + b.expiring.length;
          return urgencyB - urgencyA;
      });
  }, [users]);

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">GM Group Consultant Training & Certifications</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Compliance oversight for professional designations and safety training requirements.
            </p>
        </div>

        {/* Notifications Section */}
        <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center mb-4">
                <ShieldExclamationIcon className="w-5 h-5 mr-2 text-brand-primary" />
                Active Compliance Alerts
            </h3>
            <div className="space-y-3">
                {trainingNotifications.length > 0 ? (
                    trainingNotifications.map(note => {
                        // Check if the alert signifies an expired status
                        const isExpired = note.message.toLowerCase().includes('expired');
                        
                        return (
                            <div 
                                key={note.id} 
                                className={`p-4 border-l-4 rounded-r-md shadow-sm flex items-start justify-between ${
                                    isExpired 
                                    ? 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-500' 
                                    : 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500'
                                }`}
                            >
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {isExpired 
                                            ? <ShieldExclamationIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            : <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                        }
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${isExpired ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                                            {note.message}
                                        </p>
                                        <p className={`text-xs mt-1 ${isExpired ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                            Posted: {new Date(note.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => acknowledgeAnnouncement(note.id)}
                                    className={`p-1 rounded-full hover:bg-black/10 transition-colors ${isExpired ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}
                                    title="Dismiss Alert"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })
                ) : (
                     <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <CheckCircleIcon className="w-10 h-10 text-green-500 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No immediate expiry warnings or compliance issues detected.</p>
                     </div>
                )}
            </div>
        </div>

        {/* Overview Section */}
        <div>
             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Certification Status Matrix</h3>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {consultantCerts.map(({ user, total, expired, expiring }) => (
                    <div key={user.id} className="bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 flex flex-col">
                        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">{user.name}</h4>
                                <span className="text-xs font-medium px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">{total} Certs</span>
                            </div>
                        </div>
                        
                        <div className="p-4 space-y-3 flex-1">
                            {expired.length > 0 && (
                                <div className="p-3 bg-red-50 rounded border border-red-100 dark:bg-red-900/20 dark:border-red-800">
                                    <p className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center mb-2">
                                        <ShieldExclamationIcon className="w-4 h-4 mr-1"/> {expired.length} EXPIRED
                                    </p>
                                    <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-1">
                                        {expired.map(c => <li key={c.id}><span className="font-medium">{c.name}</span> <span className="opacity-75">({c.expiryDate})</span></li>)}
                                    </ul>
                                </div>
                            )}
                            {expiring.length > 0 && (
                                <div className="p-3 bg-yellow-50 rounded border border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800">
                                    <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300 flex items-center mb-2">
                                        <ClockIcon className="w-4 h-4 mr-1"/> {expiring.length} Expiring Soon
                                    </p>
                                    <ul className="list-disc list-inside text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                                        {expiring.map(c => <li key={c.id}><span className="font-medium">{c.name}</span> <span className="opacity-75">({c.expiryDate})</span></li>)}
                                    </ul>
                                </div>
                            )}
                            {expired.length === 0 && expiring.length === 0 && (
                                <div className="h-full flex items-center justify-center p-4 bg-green-50 rounded border border-green-100 dark:bg-green-900/10 dark:border-green-900/30">
                                    <p className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center">
                                        <CheckCircleIcon className="w-5 h-5 mr-2"/> In Good Standing
                                    </p>
                                </div>
                            )}
                        </div>
                        {/* Link/Hint to User Management */}
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/30 border-t dark:border-gray-700 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Update records in User Management</p>
                        </div>
                    </div>
                ))}
                {consultantCerts.length === 0 && (
                     <div className="col-span-full">
                        <EmptyState Icon={AcademicCapIcon} title="No Consultants Found" message="Add consultants to view their certification status." />
                     </div>
                )}
             </div>
        </div>
    </div>
  );
};

export default TrainingView;
