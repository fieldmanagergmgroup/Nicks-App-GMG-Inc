
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Theme } from '../types';
import ToggleSwitch from './common/ToggleSwitch';
import { RefreshIcon } from './icons';

const SettingsView: React.FC = () => {
    const { user, updateUser, theme, setTheme, addToast, resetAppData } = useAppContext();
    
    // Profile State
    const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    const [profileErrors, setProfileErrors] = useState<{name?: string, email?: string}>({});
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name, email: user.email, phone: user.phone || '' });
        }
    }, [user]);

    // Notification State (Simulated)
    const [notifications, setNotifications] = useState({
        approvals: true,
        announcements: true,
        complaints: false,
    });
    
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const validateProfile = () => {
        const newErrors: {name?: string, email?: string} = {};
        if (!profileData.name.trim()) newErrors.name = 'Name is required.';
        if (!profileData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
            newErrors.email = 'Email is invalid.';
        }
        setProfileErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProfileSave = async () => {
        if (user && user.role === 'management' && validateProfile()) {
            setIsSubmittingProfile(true);
            await updateUser(user.id, profileData);
            setIsSubmittingProfile(false);
        }
    };
    
    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications(prev => ({...prev, [key]: !prev[key]}));
        addToast("Notification settings saved (simulation).", "info");
    };

    const inputClasses = "mt-1 block w-full rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:bg-gray-200 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    if (!user) return null;
    
    const isConsultant = user.role === 'consultant';

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage your personal information, appearance preferences, and notifications.
                </p>
            </div>

            {/* Profile Settings */}
            <div className="p-4 bg-white border rounded-lg shadow-sm sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">My Profile</h3>
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="name" className={labelClasses}>Full Name</label>
                        <input type="text" name="name" id="name" value={profileData.name} onChange={handleProfileChange} disabled={isConsultant} className={`${inputClasses} ${profileErrors.name ? 'border-red-500' : ''}`} />
                        {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className={labelClasses}>Email Address</label>
                        <input type="email" name="email" id="email" value={profileData.email} onChange={handleProfileChange} disabled={isConsultant} className={`${inputClasses} ${profileErrors.email ? 'border-red-500' : ''}`} />
                         {profileErrors.email && <p className="mt-1 text-xs text-red-500">{profileErrors.email}</p>}
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="phone" className={labelClasses}>Phone Number</label>
                        <input type="tel" name="phone" id="phone" value={profileData.phone} onChange={handleProfileChange} disabled={isConsultant} className={inputClasses} />
                    </div>
                </div>
                <div className="flex items-center justify-end pt-5 mt-5 border-t dark:border-gray-600">
                    {isConsultant && (
                        <p className="mr-auto text-xs text-gray-500 dark:text-gray-400">
                            Please contact management to update your profile details.
                        </p>
                    )}
                    <button onClick={handleProfileSave} disabled={isConsultant || isSubmittingProfile} className="px-4 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isSubmittingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </div>

            {/* Appearance Settings */}
            <div className="p-4 bg-white border rounded-lg shadow-sm sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Appearance</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose how the application looks.</p>
                <div className="mt-4 space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-4">
                    {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
                        <label key={themeOption} className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors w-full ${ theme === themeOption ? 'bg-brand-primary/10 border-brand-primary dark:bg-brand-primary/20' : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600' }`}>
                            <input type="radio" name="theme-option" value={themeOption} checked={theme === themeOption} onChange={() => setTheme(themeOption)} className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary" />
                            <span className="ml-3 text-sm font-medium text-gray-900 capitalize dark:text-gray-100">{themeOption}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            {/* Notification Settings */}
            <div className="p-4 bg-white border rounded-lg shadow-sm sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Notification Preferences</h3>
                 <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select which alerts you would like to receive.</p>
                <div className="mt-4 space-y-4 divide-y dark:divide-gray-600">
                    <div className="flex items-center justify-between pt-4 first:pt-0">
                        <div>
                            <p className={labelClasses}>Pending Approvals</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Notify me when a submitted report or flagged procedure (SWP/JHA) requires review.</p>
                        </div>
                        <ToggleSwitch checked={notifications.approvals} onChange={() => handleNotificationChange('approvals')} />
                    </div>
                     <div className="flex items-center justify-between pt-4">
                        <div>
                            <p className={labelClasses}>New Announcements</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Show an alert for new company-wide announcements.</p>
                        </div>
                        <ToggleSwitch checked={notifications.announcements} onChange={() => handleNotificationChange('announcements')} />
                    </div>
                    {!isConsultant && (
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className={labelClasses}>New Complaints</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Notify me when a complaint is filed against a consultant.</p>
                            </div>
                            <ToggleSwitch checked={notifications.complaints} onChange={() => handleNotificationChange('complaints')} />
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone - Reset App */}
            {/* Only visible if function is available, mainly for debugging/demo purposes */}
            {resetAppData && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm sm:p-6 dark:bg-red-900/10 dark:border-red-800">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Reset Application Data</h3>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                        If the application is experiencing issues or you wish to restart the demo, you can reset all data to the initial state. 
                        <strong> This action cannot be undone.</strong>
                    </p>
                    <div className="mt-4">
                         <button onClick={resetAppData} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <RefreshIcon className="w-4 h-4 mr-2" />
                            Reset All Data
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
