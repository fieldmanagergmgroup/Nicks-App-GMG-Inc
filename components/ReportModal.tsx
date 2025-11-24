
import React, { useState, useEffect, useMemo } from 'react';
import { Site, ReportStatus, ProcedureType, DeliveredItems, Report, ReportDocument } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './common/Modal';
import { FlagIcon, PauseIcon, TrashIcon, XCircleIcon, DocumentTextIcon, UploadIcon } from './icons';

interface ReportModalProps {
  site: Site;
  onClose: () => void;
  initialStatus?: ReportStatus;
  isManagementNote?: boolean;
  existingReport?: Report;
}

const safetyItemsList: { key: keyof DeliveredItems; label: string }[] = [
    { key: 'greenBooks', label: 'Green Book' },
    { key: 'safetyBoard', label: 'Safety Board' },
    { key: 'fireExtinguisher', label: 'Fire Extinguisher' },
    { key: 'eyeWashStation', label: 'Eye Wash Station' },
    { key: 'firstAidKitSmall', label: 'First Aid Kit (Small)' },
    { key: 'firstAidKitLarge', label: 'First Aid Kit (Large)' },
    { key: 'inspectionTags', label: 'Inspection Tags' },
    { key: 'specificProcedure', label: 'Workplace Specific Procedure' },
];

const ReportModal: React.FC<ReportModalProps> = ({ site, onClose, initialStatus = 'Visit Complete', isManagementNote = false, existingReport }) => {
  const { addReport, updateReport, requestSiteHold } = useAppContext();
  const [status, setStatus] = useState<ReportStatus>(existingReport ? existingReport.status : initialStatus);
  
  // Initialize to empty string if not editing, forcing user selection.
  const [visitDate, setVisitDate] = useState(existingReport ? existingReport.visitDate : '');
  const [notes, setNotes] = useState(existingReport ? existingReport.notes : '');
  const [managementNotes, setManagementNotes] = useState(existingReport ? existingReport.managementNotes : '');
  const [proceduresCreated, setProceduresCreated] = useState<ProcedureType[]>(existingReport ? existingReport.proceduresCreated : []);
  
  // Multiple Documents
  const [documents, setDocuments] = useState<ReportDocument[]>(existingReport ? existingReport.documents : []);
  
  // Initialize checkboxes based on content presence if editing
  const [noChanges, setNoChanges] = useState(existingReport ? !existingReport.managementNotes : false); 
  const [noNotes, setNoNotes] = useState(existingReport ? !existingReport.notes : false); 

  const [deliveredItems, setDeliveredItems] = useState<Partial<DeliveredItems>>(existingReport?.deliveredItems || {});
  
  // New State for "None" options
  const [noneProcedure, setNoneProcedure] = useState(existingReport ? existingReport.proceduresCreated.length === 0 : false);
  const [noItemsDelivered, setNoItemsDelivered] = useState(existingReport ? (!existingReport.deliveredItems || Object.keys(existingReport.deliveredItems).length === 0) : false);
  
  // No Document State
  const [noDocument, setNoDocument] = useState(existingReport ? existingReport.documents.length === 0 : false);

  // Hold Logic
  const [holdReason, setHoldReason] = useState('');
  const [holdStartDate, setHoldStartDate] = useState('');
  const [holdEndDate, setHoldEndDate] = useState('');
  const [holdDuration, setHoldDuration] = useState<'1week' | '2weeks' | 'custom'>('1week');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingReport) return; // Don't override if editing
    setStatus(initialStatus);
    setNoChanges(false); 
    setNoNotes(false);
    setNoDocument(false);
  }, [initialStatus, isManagementNote, existingReport]);

  // Initialize hold dates if "On Hold" selected
  useEffect(() => {
      if (status === 'On Hold') {
          if (!holdStartDate) {
            const today = new Date();
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7) || 7);
            setHoldStartDate(nextMonday.toISOString().split('T')[0]);
            
            const end = new Date(nextMonday);
            end.setDate(nextMonday.getDate() + 6); // 1 week default
            setHoldEndDate(end.toISOString().split('T')[0]);
          }
      }
  }, [status, holdStartDate]);
  
  // Auto-update end date when duration preset changes
  useEffect(() => {
      if (status === 'On Hold' && holdStartDate && holdDuration !== 'custom') {
          const start = new Date(holdStartDate);
          const end = new Date(start);
          if (holdDuration === '1week') {
              end.setDate(start.getDate() + 6);
          } else if (holdDuration === '2weeks') {
              end.setDate(start.getDate() + 13);
          }
          setHoldEndDate(end.toISOString().split('T')[0]);
      }
  }, [holdDuration, holdStartDate, status]);

  const handleProcedureChange = (procedure: ProcedureType) => {
    if (noneProcedure) setNoneProcedure(false);
    setProceduresCreated(prev => 
      prev.includes(procedure) 
        ? prev.filter(p => p !== procedure)
        : [...prev, procedure]
    );
  };

  const handleNoneProcedureChange = () => {
      const newValue = !noneProcedure;
      setNoneProcedure(newValue);
      if (newValue) {
          setProceduresCreated([]);
      }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const newDoc: ReportDocument = {
                    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    type: file.type,
                    data: result,
                    uploadedAt: new Date().toISOString()
                };
                setDocuments(prev => [...prev, newDoc]);
            };
            reader.readAsDataURL(file);
        });
    }
    // Clear input to allow re-uploading same file if needed
    e.target.value = '';
  };

  const removeDocument = (docId: string) => {
      setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const handleNoChangesToggle = () => {
    const isNowChecked = !noChanges;
    setNoChanges(isNowChecked);
    if (isNowChecked) {
      setManagementNotes('');
    }
  };

  const handleNoNotesToggle = () => {
    const isNowChecked = !noNotes;
    setNoNotes(isNowChecked);
    if (isNowChecked) {
      setNotes('');
    }
  };

  const handleItemChange = (item: keyof DeliveredItems, value: string) => {
    if (noItemsDelivered) setNoItemsDelivered(false);
    const quantity = parseInt(value, 10);
    setDeliveredItems(prev => {
        const newItems = { ...prev };
        if (isNaN(quantity) || quantity <= 0) {
            delete newItems[item];
        } else {
            newItems[item] = quantity;
        }
        return newItems;
    });
  };

  const handleNoItemsDeliveredChange = () => {
      const newValue = !noItemsDelivered;
      setNoItemsDelivered(newValue);
      if (newValue) {
          setDeliveredItems({});
      }
  };
  
  const handleNoDocumentChange = () => {
      setNoDocument(!noDocument);
  };

  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
        if ('showPicker' in HTMLInputElement.prototype) {
            e.currentTarget.showPicker();
        }
    } catch (err) {
        // Ignore if not supported
    }
  };

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    if (!visitDate) return true;
    
    if (status === 'On Hold') {
        if (!holdReason.trim()) return true;
        if (!holdStartDate || !holdEndDate) return true;
        if (holdStartDate > holdEndDate) return true;
        return false;
    }

    if (!noNotes && !notes.trim()) return true;

    if (status === 'Revisit Waived') {
        return false;
    }

    if (status === 'Visit Complete' || status === 'Site Not Active' || status === 'Project Finished') {
        if (proceduresCreated.length === 0 && !noneProcedure) return true;
        if (Object.keys(deliveredItems).length === 0 && !noItemsDelivered) return true;
        if (documents.length === 0 && !noDocument) return true;
        if (!noChanges && !managementNotes.trim()) return true;
    }
    
    return false;
  }, [status, notes, noNotes, noChanges, managementNotes, isSubmitting, holdReason, holdStartDate, holdEndDate, visitDate, proceduresCreated, noneProcedure, deliveredItems, noItemsDelivered, documents, noDocument]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;
    
    setIsSubmitting(true);

    if (status === 'On Hold') {
         await requestSiteHold(site.id, holdReason, holdStartDate, holdEndDate);
    }

    const itemsToSubmit = Object.keys(deliveredItems).length > 0 ? deliveredItems : undefined;
    const documentsToSubmit = noDocument ? [] : documents;

    const reportPayload = {
        siteId: site.id,
        visitDate, 
        status, 
        notes: notes,
        managementNotes: managementNotes.trim(),
        proceduresCreated,
        documents: documentsToSubmit,
        deliveredItems: itemsToSubmit
    };

    if (existingReport) {
         await updateReport(existingReport.id, reportPayload);
    } else {
         await addReport(reportPayload);
    }

    setIsSubmitting(false);
    onClose();
  };
  
  const inputClasses = "mt-1 block w-full rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary sm:text-sm";
  const isRevisitWaived = status === 'Revisit Waived';
  const isHold = status === 'On Hold';
  const isStandardVisit = !isRevisitWaived && !isHold;

  return (
    <Modal isOpen={true} onClose={onClose} title={existingReport ? "Edit Report" : (isRevisitWaived ? "Waive Potential Revisit" : "File Visit Report")}>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: auto;
            height: auto;
            color: transparent;
            background: transparent;
        }
      `}</style>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Status Selection */}
        <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-700/50">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status <span className="text-red-500">*</span></label>
             <div className="grid grid-cols-2 gap-3">
                {(['Visit Complete', 'Site Not Active', 'On Hold', 'Client Cancelled', 'Project Finished', 'Revisit Waived'] as ReportStatus[])
                    .filter(s => isRevisitWaived ? s === 'Revisit Waived' : s !== 'Revisit Waived')
                    .map(s => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                            status === s 
                            ? 'bg-brand-primary text-white border-brand-primary' 
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
             {isRevisitWaived && (
                <div className="mt-3 flex items-start p-2 bg-yellow-50 border border-yellow-200 rounded dark:bg-yellow-900/20 dark:border-yellow-800">
                    <XCircleIcon className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Waiving a revisit requires <strong>management approval</strong>.
                    </p>
                </div>
            )}
        </div>

        {/* On Hold Configuration */}
        {isHold && (
            <div className="p-4 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 rounded-md space-y-4">
                 <h4 className="flex items-center font-bold text-amber-800 dark:text-amber-200">
                    <PauseIcon className="w-5 h-5 mr-2" />
                    Hold Configuration
                 </h4>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Hold <span className="text-red-500">*</span></label>
                    <input type="text" value={holdReason} onChange={e => setHoldReason(e.target.value)} className={inputClasses} placeholder="e.g. Client renovation, shutdown" required />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration Preset</label>
                    <div className="flex gap-3 mt-1">
                         <label className="flex items-center"><input type="radio" name="duration" checked={holdDuration === '1week'} onChange={() => setHoldDuration('1week')} className="mr-2" /> 1 Week</label>
                         <label className="flex items-center"><input type="radio" name="duration" checked={holdDuration === '2weeks'} onChange={() => setHoldDuration('2weeks')} className="mr-2" /> 2 Weeks</label>
                         <label className="flex items-center"><input type="radio" name="duration" checked={holdDuration === 'custom'} onChange={() => setHoldDuration('custom')} className="mr-2" /> Custom</label>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date <span className="text-red-500">*</span></label>
                        <input type="date" value={holdStartDate} onClick={handleDateClick} onChange={e => { setHoldStartDate(e.target.value); setHoldDuration('custom'); }} className={`${inputClasses} cursor-pointer`} required />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date <span className="text-red-500">*</span></label>
                        <input type="date" value={holdEndDate} onClick={handleDateClick} onChange={e => { setHoldEndDate(e.target.value); setHoldDuration('custom'); }} className={`${inputClasses} cursor-pointer`} required />
                    </div>
                 </div>
            </div>
        )}

        {/* Report Details */}
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {isRevisitWaived ? 'Date Waived' : 'Visit Date'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <input type="date" required value={visitDate} onClick={handleDateClick} onChange={(e) => setVisitDate(e.target.value)} className={`${inputClasses} cursor-pointer`} />
            </div>
        </div>

        {/* Visit Notes / Observations - Boxed Layout */}
        <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
                <label className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200">
                    <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-600" />
                    {isRevisitWaived ? 'Reason for Waiving Revisit' : 'Visit Notes / Observations'} <span className="text-red-500 text-xs ml-1">(Required unless box checked)</span>
                </label>
                <div className="flex items-center">
                    <input id="no-notes" type="checkbox" checked={noNotes} onChange={handleNoNotesToggle} className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                    <label htmlFor="no-notes" className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400">{isRevisitWaived ? 'No reason' : 'No observations'}</label>
                </div>
            </div>
            <textarea 
                rows={3} 
                className={`${inputClasses} ${noNotes ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-white dark:bg-gray-700'}`} 
                placeholder="Describe work progress, safety observations, etc." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                disabled={noNotes}
            ></textarea>
        </div>

        {/* Standard Visit Fields */}
        {isStandardVisit && (
            <>
                {/* Management Note Section */}
                <div className="p-4 border rounded-md bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200">
                            <FlagIcon className="w-4 h-4 mr-2 text-yellow-600" />
                             Changes / Management Updates <span className="text-red-500 text-xs ml-1">(Required unless box checked)</span>
                        </label>
                        <div className="flex items-center">
                            <input id="no-changes" type="checkbox" checked={noChanges} onChange={handleNoChangesToggle} className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                            <label htmlFor="no-changes" className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400">No changes</label>
                        </div>
                    </div>
                    <textarea rows={2} className={`${inputClasses} ${noChanges ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-white dark:bg-gray-700'}`} placeholder="Address change, new contact, hazards, etc." value={managementNotes} onChange={(e) => setManagementNotes(e.target.value)} disabled={noChanges}></textarea>
                </div>

                {/* Procedures */}
                <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Procedures Generated <span className="text-red-500">*</span>
                    </span>
                    <div className="flex flex-wrap gap-4">
                        <label className="inline-flex items-center">
                            <input type="checkbox" className="form-checkbox text-brand-primary" checked={proceduresCreated.includes('SWP')} onChange={() => handleProcedureChange('SWP')} />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">SWP</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input type="checkbox" className="form-checkbox text-brand-primary" checked={proceduresCreated.includes('JHA')} onChange={() => handleProcedureChange('JHA')} />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">JHA</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input type="checkbox" className="form-checkbox text-gray-500" checked={noneProcedure} onChange={handleNoneProcedureChange} />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">None / Not Required</span>
                        </label>
                    </div>
                </div>

                {/* Delivered Items */}
                <div className="p-3 border rounded-md dark:border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Items Delivered <span className="text-red-500">*</span></span>
                        <label className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <input type="checkbox" className="form-checkbox text-gray-500 w-3.5 h-3.5 mr-1" checked={noItemsDelivered} onChange={handleNoItemsDeliveredChange} />
                            No Items Delivered
                        </label>
                    </div>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${noItemsDelivered ? 'opacity-50 pointer-events-none' : ''}`}>
                        {safetyItemsList.map(item => (
                            <div key={item.key} className="flex items-center justify-between">
                                <label htmlFor={`item-${item.key}`} className="text-xs text-gray-600 dark:text-gray-400">{item.label}</label>
                                <input type="number" id={`item-${item.key}`} min="0" placeholder="0" className="w-16 p-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-right" value={deliveredItems[item.key] || ''} onChange={(e) => handleItemChange(item.key, e.target.value)} disabled={noItemsDelivered} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Document Upload */}
                <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200">
                            <UploadIcon className="w-4 h-4 mr-2 text-brand-primary" />
                            Upload Document(s) <span className="text-red-500 text-xs ml-1">(Required unless box checked)</span>
                        </label>
                        <div className="flex items-center">
                            <input id="no-document" type="checkbox" checked={noDocument} onChange={handleNoDocumentChange} className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                            <label htmlFor="no-document" className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400">No documentation required / Not applicable</label>
                        </div>
                    </div>
                    
                    <div className={noDocument ? 'opacity-50 pointer-events-none' : ''}>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Observation Report, Safety Talk, etc.</p>
                        
                        {/* Attached Documents List */}
                        {documents.length > 0 && (
                            <ul className="mt-2 mb-3 space-y-2">
                                {documents.map((doc) => (
                                    <li key={doc.id} className="flex items-center justify-between p-2 text-sm bg-gray-50 rounded-md border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600">
                                        <div className="flex items-center truncate min-w-0">
                                            <DocumentTextIcon className="w-4 h-4 mr-2 text-brand-primary flex-shrink-0" />
                                            <a 
                                                href={doc.data} 
                                                download={doc.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="truncate text-brand-primary hover:underline cursor-pointer font-medium dark:text-blue-400"
                                                title="View/Download Document"
                                            >
                                                {doc.name}
                                            </a>
                                        </div>
                                        <button type="button" onClick={() => removeDocument(doc.id)} className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="mt-1 flex items-center">
                            <label className="cursor-pointer flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                <UploadIcon className="h-5 w-5 mr-2 text-gray-400" />
                                Click to Attach Files
                                <input type="file" className="sr-only" multiple onChange={handleFileChange} disabled={noDocument} />
                            </label>
                        </div>
                    </div>
                </div>
            </>
        )}

        <div className="flex justify-end pt-4 space-x-4 border-t dark:border-gray-700">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button type="submit" disabled={isSubmitDisabled} className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
            {isSubmitting ? 'Submitting...' : (existingReport ? 'Update Report' : 'Submit Report')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportModal;
