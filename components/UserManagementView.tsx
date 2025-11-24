
import React, { useState, Fragment, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { User, UserRole, Certificate } from '../types';
import { UserAddIcon, ChevronDownIcon, AcademicCapIcon, PlusCircleIcon, TrashIcon, PencilIcon } from './icons';

// Certificate Configuration Rules
const CERT_TYPES = [
    { id: 'wah', label: 'Working at Heights', expiryYears: 3, hasRefresher: true },
    { id: 'supervisor', label: "Supervisors' Health and Safety Awareness in 5 Steps", expiryYears: 0 }, // 0 = No Expiry
    { id: 'worker', label: "Workers' Health and Safety Awareness in 4 Steps", expiryYears: 0 },
    { id: 'whmis', label: 'WHMIS 2015 Instruction', expiryYears: 1 },
    { id: 'firstaid', label: 'First Aid Training', expiryYears: 3, hasDetails: true, detailLabel: 'Type (e.g., Standard, CPR, AED)' },
    { id: 'other', label: 'Other / Custom', expiryYears: 0, isCustom: true }
];

const UserManagementView: React.FC = () => {
  const { users, updateUser, addUser, addCertificate, updateCertificate, deleteCertificate } = useAppContext();
  const [expandedUser, setExpandedUser] = useState<User | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('consultant');
  const [addUserErrors, setAddUserErrors] = useState<{name?: string, email?: string}>({});
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [editData, setEditData] = useState({ name: '', email: '', phone: '' });
  const [editErrors, setEditErrors] = useState<{name?: string, email?: string}>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Certificate State
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  
  // Cert Form State
  const [certTypeSelection, setCertTypeSelection] = useState<string>('wah');
  const [certCustomName, setCertCustomName] = useState('');
  const [certIsRefresher, setCertIsRefresher] = useState(false);
  const [certDetails, setCertDetails] = useState(''); // For First Aid Type
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certNotes, setCertNotes] = useState('');

  const toggleExpand = (user: User) => {
    if (expandedUser?.id === user.id) {
      setExpandedUser(null);
      resetCertForm();
    } else {
      setExpandedUser(user);
      setEditData({ name: user.name, email: user.email, phone: user.phone || '' });
      setEditErrors({});
      resetCertForm();
    }
  };

  const handleRoleChange = (userId: number, role: UserRole) => {
    updateUser(userId, { role });
  };
  
  const validateAddUser = () => {
    const newErrors: {name?: string, email?: string} = {};
    if (!newUserName.trim()) newErrors.name = 'Name is required.';
    if (!newUserEmail.trim()) {
        newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(newUserEmail)) {
        newErrors.email = 'Email is invalid.';
    }
    setAddUserErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddNewUser = async () => {
    if (validateAddUser()) {
        setIsSubmittingAdd(true);
        await addUser(newUserName.trim(), newUserEmail.trim(), newUserRole);
        setIsSubmittingAdd(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole('consultant');
        setIsAdding(false);
    }
  };

  const validateEditUser = () => {
    const newErrors: {name?: string, email?: string} = {};
    if (!editData.name.trim()) newErrors.name = 'Name is required.';
    if (!editData.email.trim()) {
        newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(editData.email)) {
        newErrors.email = 'Email is invalid.';
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async (userId: number) => {
    if (validateEditUser()) {
        setIsSubmittingEdit(true);
        await updateUser(userId, { name: editData.name.trim(), email: editData.email.trim(), phone: editData.phone.trim() });
        setIsSubmittingEdit(false);
        setExpandedUser(null);
    }
  };

  // --- Certificate Logic ---

  const resetCertForm = () => {
      setIsAddingCert(false);
      setEditingCertId(null);
      setCertTypeSelection('wah');
      setCertCustomName('');
      setCertIsRefresher(false);
      setCertDetails('');
      setCertIssueDate('');
      setCertExpiryDate('');
      setCertNotes('');
  };

  const handleAddCertClick = () => {
      resetCertForm();
      setIsAddingCert(true);
  };

  const handleEditCertClick = (cert: Certificate) => {
      // When editing, we treat it as a "Custom" type to preserve the exact name string
      // unless we want to build complex parsing logic. Keeping it simple/robust:
      setEditingCertId(cert.id);
      setCertTypeSelection('other'); // Treat existing as custom string for editing
      setCertCustomName(cert.name);
      setCertIssueDate(cert.issueDate);
      setCertExpiryDate(cert.expiryDate || '');
      setCertNotes(cert.notes || '');
      setIsAddingCert(true);
  };

  // Auto-calculate expiry when Issue Date or Type changes
  useEffect(() => {
      if (editingCertId) return; // Don't auto-calc on edit mode to prevent overwriting existing data
      if (!certIssueDate) return;

      const selectedType = CERT_TYPES.find(t => t.id === certTypeSelection);
      if (selectedType && selectedType.expiryYears > 0) {
          const issue = new Date(certIssueDate);
          const expiry = new Date(issue);
          expiry.setFullYear(issue.getFullYear() + selectedType.expiryYears);
          setCertExpiryDate(expiry.toISOString().split('T')[0]);
      } else if (selectedType && selectedType.expiryYears === 0) {
          setCertExpiryDate(''); // Clear expiry for non-expiring certs
      }
  }, [certIssueDate, certTypeSelection, editingCertId]);

  const handleSaveCert = async (userId: number) => {
      let finalName = '';

      if (certTypeSelection === 'other') {
          finalName = certCustomName.trim();
      } else {
          const typeConfig = CERT_TYPES.find(t => t.id === certTypeSelection);
          if (!typeConfig) return;
          
          finalName = typeConfig.label;
          
          if (typeConfig.hasRefresher && certIsRefresher) {
              finalName += ' (Refresher)';
          }
          if (typeConfig.hasDetails && certDetails.trim()) {
              finalName += ` - ${certDetails.trim()}`;
          }
      }

      if (!finalName || !certIssueDate) {
          alert("Certificate Name and Issue Date are required.");
          return;
      }
      
      const payload = {
          name: finalName,
          issueDate: certIssueDate,
          expiryDate: certExpiryDate,
          notes: certNotes
      };

      if (editingCertId) {
          await updateCertificate(userId, editingCertId, payload);
      } else {
          await addCertificate(userId, payload);
      }
      resetCertForm();
  };

  const handleDeleteCert = async (userId: number, certId: string) => {
      if(window.confirm("Delete this certificate?")) {
          await deleteCertificate(userId, certId);
      }
  };

  const getCertStatus = (expiryDate?: string) => {
      if (!expiryDate) return { label: 'No Expiry', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
      const today = new Date();
      today.setHours(0,0,0,0);
      const expiry = new Date(expiryDate);
      
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { label: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
      if (diffDays <= 30) return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
      return { label: 'Valid', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  };
  
  const inputClasses = "w-full px-3 py-2 text-sm rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-brand-primary focus:border-brand-primary";
  const selectClasses = "block w-full p-2 text-sm rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-brand-primary focus:border-brand-primary";

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <button
                onClick={() => setIsAdding(prev => !prev)}
                className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition-colors rounded-md bg-green-600 hover:bg-green-700"
            >
                <UserAddIcon className="w-5 h-5 mr-2" />
                {isAdding ? 'Cancel' : 'Add New User'}
            </button>
        </div>
        {isAdding && (
            <div className="p-4 space-y-3 bg-gray-50 rounded-lg dark:bg-gray-800 border dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">New User Profile</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <input type="text" placeholder="Full Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} className={`${inputClasses} ${addUserErrors.name ? 'border-red-500' : ''}`} />
                        {addUserErrors.name && <p className="mt-1 text-xs text-red-500">{addUserErrors.name}</p>}
                    </div>
                    <div>
                        <input type="email" placeholder="Email Address" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className={`${inputClasses} ${addUserErrors.email ? 'border-red-500' : ''}`} />
                         {addUserErrors.email && <p className="mt-1 text-xs text-red-500">{addUserErrors.email}</p>}
                    </div>
                     <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)} className={`${selectClasses} sm:col-span-2`}>
                        <option value="consultant">Consultant</option>
                        <option value="management">Management</option>
                    </select>
                </div>
                <div className="flex justify-end">
                     <button onClick={handleAddNewUser} disabled={isSubmittingAdd} className="px-4 py-2 text-sm font-semibold text-white rounded-md bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSubmittingAdd ? 'Saving...' : 'Save User'}
                    </button>
                </div>
            </div>
        )}
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border dark:border-gray-700">
            {/* Mobile Card View */}
            <div className="space-y-4 sm:hidden p-2">
                {users.map(user => (
                    <div key={user.id} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                        <div className="flex justify-between items-start">
                             <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</div>
                            </div>
                             <button onClick={() => toggleExpand(user)} className="p-2 -mr-2 -mt-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedUser?.id === user.id ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        <div className="mt-2 pt-2 border-t dark:border-gray-600">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
                            <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)} className={`${selectClasses} mt-1`}>
                                <option value="consultant">Consultant</option>
                                <option value="management">Management</option>
                            </select>
                        </div>
                         {expandedUser?.id === user.id && (
                             <div className="mt-3 space-y-4">
                                {/* Edit Profile */}
                                <div className="p-3 space-y-3 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">Edit Profile</h4>
                                    <div>
                                        <label htmlFor={`edit-name-${user.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                                        <input id={`edit-name-${user.id}`} type="text" value={editData.name} onChange={(e) => setEditData(prev => ({...prev, name: e.target.value}))} className={`${inputClasses} ${editErrors.name ? 'border-red-500' : ''}`} />
                                    </div>
                                    <div>
                                        <label htmlFor={`edit-email-${user.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                                        <input id={`edit-email-${user.id}`} type="email" value={editData.email} onChange={(e) => setEditData(prev => ({...prev, email: e.target.value}))} className={`${inputClasses} ${editErrors.email ? 'border-red-500' : ''}`} />
                                    </div>
                                    <div>
                                        <label htmlFor={`edit-phone-${user.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                                        <input id={`edit-phone-${user.id}`} type="tel" value={editData.phone} onChange={(e) => setEditData(prev => ({...prev, phone: e.target.value}))} className={inputClasses} />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => toggleExpand(user)} className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200">Cancel</button>
                                        <button onClick={() => handleSaveChanges(user.id)} disabled={isSubmittingEdit} className="px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{isSubmittingEdit ? 'Saving...' : 'Save Changes'}</button>
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <table className="hidden min-w-full divide-y divide-gray-200 sm:table dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Profile</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Role</th>
                        <th className="w-px px-6 py-3"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {users.map(user => (
                        <Fragment key={user.id}>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)} className={selectClasses}>
                                        <option value="consultant">Consultant</option>
                                        <option value="management">Management</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <button onClick={() => toggleExpand(user)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedUser?.id === user.id ? 'rotate-180' : ''}`} />
                                    </button>
                                </td>
                            </tr>
                            {expandedUser?.id === user.id && (
                                <tr>
                                    <td colSpan={3} className="p-0">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Edit Profile Section */}
                                                <div className="p-4 space-y-3 bg-white border rounded-lg dark:bg-gray-900/50 dark:border-gray-700 h-fit">
                                                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 pb-2 border-b dark:border-gray-700">Edit Profile</h4>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div>
                                                            <label htmlFor="edit-name" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                                                            <input id="edit-name" type="text" value={editData.name} onChange={(e) => setEditData(prev => ({...prev, name: e.target.value}))} className={`${inputClasses} ${editErrors.name ? 'border-red-500' : ''}`} />
                                                            {editErrors.name && <p className="mt-1 text-xs text-red-500">{editErrors.name}</p>}
                                                        </div>
                                                        <div>
                                                            <label htmlFor="edit-email" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                                                            <input id="edit-email" type="email" value={editData.email} onChange={(e) => setEditData(prev => ({...prev, email: e.target.value}))} className={`${inputClasses} ${editErrors.email ? 'border-red-500' : ''}`} />
                                                            {editErrors.email && <p className="mt-1 text-xs text-red-500">{editErrors.email}</p>}
                                                        </div>
                                                         <div>
                                                            <label htmlFor="edit-phone" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                                                            <input id="edit-phone" type="tel" value={editData.phone} onChange={(e) => setEditData(prev => ({...prev, phone: e.target.value}))} className={inputClasses} />
                                                        </div>
                                                        <div className="flex justify-end space-x-2 pt-2">
                                                            <button onClick={() => toggleExpand(user)} className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
                                                            <button onClick={() => handleSaveChanges(user.id)} disabled={isSubmittingEdit} className="px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{isSubmittingEdit ? 'Saving...' : 'Save Changes'}</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Certificates Section */}
                                                {user.role === 'consultant' && (
                                                    <div className="p-4 space-y-3 bg-white border rounded-lg dark:bg-gray-900/50 dark:border-gray-700">
                                                        <div className="flex justify-between items-center pb-2 border-b dark:border-gray-700">
                                                            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center">
                                                                <AcademicCapIcon className="w-4 h-4 mr-2" />
                                                                Training Certificates
                                                            </h4>
                                                            {!isAddingCert && (
                                                                <button onClick={handleAddCertClick} className="text-xs flex items-center text-brand-primary hover:text-brand-secondary">
                                                                    <PlusCircleIcon className="w-4 h-4 mr-1" /> Add Cert
                                                                </button>
                                                            )}
                                                        </div>
                                                        
                                                        {isAddingCert ? (
                                                            <div className="bg-gray-50 p-3 rounded border dark:bg-gray-800 dark:border-gray-600">
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    {/* Certificate Type Select */}
                                                                    <div>
                                                                        <label className="block text-xs text-gray-500 mb-1">Certificate Type</label>
                                                                        {!editingCertId ? (
                                                                            <select 
                                                                                value={certTypeSelection} 
                                                                                onChange={(e) => setCertTypeSelection(e.target.value)}
                                                                                className={inputClasses}
                                                                            >
                                                                                {CERT_TYPES.map(ct => (
                                                                                    <option key={ct.id} value={ct.id}>{ct.label}</option>
                                                                                ))}
                                                                            </select>
                                                                        ) : (
                                                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                                                                {certTypeSelection === 'other' ? 'Editing Existing Record' : CERT_TYPES.find(t => t.id === certTypeSelection)?.label}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Specific Fields based on Type */}
                                                                    {certTypeSelection === 'other' ? (
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500">Certificate Name</label>
                                                                            <input type="text" value={certCustomName} onChange={e => setCertCustomName(e.target.value)} className={inputClasses} placeholder="Certificate Name" />
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {CERT_TYPES.find(t => t.id === certTypeSelection)?.hasRefresher && (
                                                                                <div className="flex items-center mt-1">
                                                                                    <input type="checkbox" id="isRefresher" checked={certIsRefresher} onChange={e => setCertIsRefresher(e.target.checked)} className="rounded border-gray-300 text-brand-primary shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50" />
                                                                                    <label htmlFor="isRefresher" className="ml-2 text-sm text-gray-700 dark:text-gray-300">This is Refresher Training</label>
                                                                                </div>
                                                                            )}
                                                                            {CERT_TYPES.find(t => t.id === certTypeSelection)?.hasDetails && (
                                                                                <div>
                                                                                    <label className="block text-xs text-gray-500">{CERT_TYPES.find(t => t.id === certTypeSelection)?.detailLabel}</label>
                                                                                    <input type="text" value={certDetails} onChange={e => setCertDetails(e.target.value)} className={inputClasses} placeholder="Details..." />
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}

                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500">Issue Date</label>
                                                                            <input type="date" value={certIssueDate} onChange={e => setCertIssueDate(e.target.value)} className={inputClasses} />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500">Expiry Date</label>
                                                                            <input type="date" value={certExpiryDate} onChange={e => setCertExpiryDate(e.target.value)} className={inputClasses} placeholder={CERT_TYPES.find(t => t.id === certTypeSelection)?.expiryYears === 0 ? "No Expiry" : "Optional"} />
                                                                            {certTypeSelection !== 'other' && CERT_TYPES.find(t => t.id === certTypeSelection)?.expiryYears !== 0 && (
                                                                                <span className="text-[10px] text-gray-400">Auto-calcs to {CERT_TYPES.find(t => t.id === certTypeSelection)?.expiryYears} years</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-gray-500">Notes</label>
                                                                        <input type="text" value={certNotes} onChange={e => setCertNotes(e.target.value)} className={inputClasses} placeholder="Optional notes" />
                                                                    </div>
                                                                    <div className="flex justify-end space-x-2 mt-2">
                                                                        <button onClick={resetCertForm} className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">Cancel</button>
                                                                        <button onClick={() => handleSaveCert(user.id)} className="px-2 py-1 text-xs text-white bg-brand-primary rounded hover:bg-brand-secondary">{editingCertId ? 'Update' : 'Add'}</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {(!user.certificates || user.certificates.length === 0) && (
                                                                    <p className="text-xs text-gray-500 italic">No certificates recorded.</p>
                                                                )}
                                                                {user.certificates?.map(cert => {
                                                                    const status = getCertStatus(cert.expiryDate);
                                                                    return (
                                                                        <div key={cert.id} className="flex items-center justify-between p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                                                                            <div className="flex-1 min-w-0 mr-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate" title={cert.name}>{cert.name}</span>
                                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ml-2 ${status.color}`}>{status.label}</span>
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                    Issued: {cert.issueDate} {cert.expiryDate && `| Expires: ${cert.expiryDate}`}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex space-x-1">
                                                                                <button onClick={() => handleEditCertClick(cert)} className="p-1 text-blue-500 hover:bg-blue-50 rounded dark:hover:bg-gray-700">
                                                                                    <PencilIcon className="w-4 h-4" />
                                                                                </button>
                                                                                <button onClick={() => handleDeleteCert(user.id, cert.id)} className="p-1 text-red-500 hover:bg-red-50 rounded dark:hover:bg-gray-700">
                                                                                    <TrashIcon className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default UserManagementView;
