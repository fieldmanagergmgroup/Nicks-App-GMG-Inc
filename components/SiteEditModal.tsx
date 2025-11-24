
import React, { useState, useEffect } from 'react';
import { Site, Contact, VisitFrequency, SiteStatus } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { PlusCircleIcon, TrashIcon } from './icons';
import Modal from './common/Modal';
import useUnsavedChanges from '../hooks/useUnsavedChanges';

interface SiteEditModalProps {
  site?: Site;
  onClose: () => void;
}

const BLANK_SITE: Omit<Site, 'id'> = {
  clientName: '',
  address: '',
  city: '',
  frequency: 'Weekly',
  assignedConsultantId: 0,
  status: 'Active',
  clientType: '',
  scopeOfWork: '',
  contacts: [],
  latitude: 0,
  longitude: 0,
  initialVisitRequestor: '',
};

type FormErrors = {
    clientName?: string;
    address?: string;
    city?: string;
    clientType?: string;
    contacts?: { name?: string; role?: string; info?: string }[];
};


const SiteEditModal: React.FC<SiteEditModalProps> = ({ site, onClose }) => {
  const { sites, addSite, updateSite } = useAppContext();
  const [formData, setFormData] = useState<Omit<Site, 'id'>>(BLANK_SITE);
  const [linkToSiteId, setLinkToSiteId] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isDirty, setIsDirty] = useUnsavedChanges();

  useEffect(() => {
    if (site) {
      setFormData(site);
      if (site.siteGroupId) {
          const anotherSiteInGroup = sites.find(s => s.siteGroupId === site.siteGroupId && s.id !== site.id);
          setLinkToSiteId(anotherSiteInGroup ? anotherSiteInGroup.id.toString() : '');
      } else {
          setLinkToSiteId('');
      }
    } else {
      setFormData(BLANK_SITE);
      setLinkToSiteId('');
    }
    setIsDirty(false); // Reset dirty state on open
  }, [site, sites, setIsDirty]);

  const isEditing = !!site;
  
  const validate = () => {
    const newErrors: FormErrors = {};
    if (!formData.clientName.trim()) newErrors.clientName = 'Client Name is required.';
    if (!formData.address.trim()) newErrors.address = 'Address is required.';
    if (!formData.city?.trim()) newErrors.city = 'City is required.';
    if (!formData.clientType.trim()) newErrors.clientType = 'Client Type is required.';
    
    const contactErrors: { name?: string; role?: string; info?: string }[] = [];
    formData.contacts.forEach(contact => {
        const errors: { name?: string; role?: string; info?: string } = {};
        if (!contact.name.trim()) errors.name = 'Required';
        if (!contact.role.trim()) errors.role = 'Required';
        if (!contact.info.trim()) errors.info = 'Required';
        if (Object.keys(errors).length > 0) contactErrors.push(errors);
    });

    if (contactErrors.length > 0) newErrors.contacts = contactErrors;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };
  
  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData(prev => ({ ...prev, contacts: newContacts }));
    setIsDirty(true);
  };

  const addContact = () => {
    setFormData(prev => ({ ...prev, contacts: [...prev.contacts, { role: '', name: '', info: '' }] }));
    setIsDirty(true);
  };

  const removeContact = (index: number) => {
    setFormData(prev => ({ ...prev, contacts: prev.contacts.filter((_, i) => i !== index) }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    if (isEditing) {
      const selectedLinkSiteId = linkToSiteId ? parseInt(linkToSiteId, 10) : null;
      await updateSite(site.id, { ...formData, linkToSiteId: selectedLinkSiteId });
    } else {
      const success = await addSite(formData);
      if (!success) {
          setIsSubmitting(false);
          return;
      }
    }
    setIsSubmitting(false);
    setIsDirty(false);
    onClose();
  };
  
  const title = isEditing ? 'Edit Site' : 'Add New Site';
  const inputClasses = "block w-full text-sm rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-brand-primary focus:border-brand-primary";
  
  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
        <form onSubmit={handleSubmit} className="space-y-6">
            
            <fieldset className="p-4 pt-2 border rounded-md dark:border-gray-600">
                <legend className="px-2 text-sm font-medium text-gray-600 dark:text-gray-300">Site Information</legend>
                <div className="grid grid-cols-6 gap-4 mt-2">
                    <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</label>
                        <input type="text" name="clientName" id="clientName" value={formData.clientName} onChange={handleChange} className={`${inputClasses} mt-1 ${errors.clientName ? 'border-red-500' : ''}`} required />
                        {errors.clientName && <p className="mt-1 text-xs text-red-500">{errors.clientName}</p>}
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                        <label htmlFor="clientType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Type</label>
                        <input type="text" name="clientType" id="clientType" value={formData.clientType} onChange={handleChange} className={`${inputClasses} mt-1 ${errors.clientType ? 'border-red-500' : ''}`} />
                        {errors.clientType && <p className="mt-1 text-xs text-red-500">{errors.clientType}</p>}
                    </div>
                    <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className={`${inputClasses} mt-1 ${errors.address ? 'border-red-500' : ''}`} required />
                        {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                        <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} className={`${inputClasses} mt-1 ${errors.city ? 'border-red-500' : ''}`} required />
                        {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                    </div>
                </div>
            </fieldset>

            <fieldset className="p-4 pt-2 border rounded-md dark:border-gray-600">
                <legend className="px-2 text-sm font-medium text-gray-600 dark:text-gray-300">Scheduling & Status</legend>
                <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                    <div>
                        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                        <select name="frequency" id="frequency" value={formData.frequency} onChange={handleChange} className={`${inputClasses} mt-1`}>
                            {(['Weekly', 'Bi-Weekly', 'Monthly', 'Shop Audit'] as VisitFrequency[]).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className={`${inputClasses} mt-1`}>
                            {(['Active', 'Not Active', 'On Hold', 'Completed'] as SiteStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {isEditing && (
                    <div className="sm:col-span-2">
                        <label htmlFor="linkToSiteId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link to another site (for shared locations)</label>
                        <select id="linkToSiteId" value={linkToSiteId} onChange={e => {setLinkToSiteId(e.target.value); setIsDirty(true);}} className={`${inputClasses} mt-1`}>
                            <option value="">-- Do not link --</option>
                            {sites.filter(s => s.id !== site?.id).map(s => (
                                <option key={s.id} value={s.id}>{s.clientName} at {s.address}</option>
                            ))}
                        </select>
                    </div>
                    )}
                </div>
            </fieldset>

            <fieldset className="p-4 pt-2 border rounded-md dark:border-gray-600">
                <legend className="px-2 text-sm font-medium text-gray-600 dark:text-gray-300">Operational Details</legend>
                 <div className="mt-2">
                    <label htmlFor="scopeOfWork" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scope of Work</label>
                    <textarea name="scopeOfWork" id="scopeOfWork" value={formData.scopeOfWork} onChange={handleChange} rows={3} className={`${inputClasses} mt-1`} />
                </div>
                <div className="mt-4">
                     <label htmlFor="initialVisitRequestor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Initial Service Requestor (Management Internal Note)
                    </label>
                    <input
                        type="text"
                        name="initialVisitRequestor"
                        id="initialVisitRequestor"
                        value={formData.initialVisitRequestor || ''}
                        onChange={handleChange}
                        className={`${inputClasses} mt-1`}
                        placeholder="e.g. John Smith (CEO) called on Oct 12, 2023"
                    />
                </div>
            </fieldset>
            
            <fieldset className="p-4 pt-2 border rounded-md dark:border-gray-600">
                <legend className="px-2 text-sm font-medium text-gray-600 dark:text-gray-300">Site Contacts</legend>
                <div className="mt-2 space-y-3">
                    {formData.contacts.map((contact, index) => (
                        <div key={index} className="grid items-start grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-10">
                            <div className="sm:col-span-2">
                                <label htmlFor={`contact-role-${index}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
                                <input type="text" id={`contact-role-${index}`} placeholder="e.g., Site Super" value={contact.role} onChange={e => handleContactChange(index, 'role', e.target.value)} className={`${inputClasses} mt-1`} />
                            </div>
                             <div className="sm:col-span-3">
                                <label htmlFor={`contact-name-${index}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                                <input type="text" id={`contact-name-${index}`} placeholder="John Doe" value={contact.name} onChange={e => handleContactChange(index, 'name', e.target.value)} className={`${inputClasses} mt-1`} />
                            </div>
                            <div className="sm:col-span-4">
                                <label htmlFor={`contact-info-${index}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">Email / Phone</label>
                                <input type="text" id={`contact-info-${index}`} placeholder="john.doe@example.com" value={contact.info} onChange={e => handleContactChange(index, 'info', e.target.value)} className={`${inputClasses} mt-1`} />
                            </div>
                            <div className="flex items-end h-full sm:col-span-1">
                                <button
                                    type="button"
                                    onClick={() => removeContact(index)}
                                    className="w-full p-2 mt-1 text-gray-500 rounded-md hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
                                    aria-label={`Remove contact ${contact.name}`}
                                >
                                    <TrashIcon className="w-5 h-5 mx-auto" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addContact} className="flex items-center px-3 py-1 text-sm font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        <PlusCircleIcon className="w-5 h-5 mr-2"/>
                        Add Contact
                    </button>
                </div>
            </fieldset>

            <div className="flex justify-end pt-2 space-x-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Site')}
                </button>
            </div>
        </form>
    </Modal>
  );
};

export default SiteEditModal;
