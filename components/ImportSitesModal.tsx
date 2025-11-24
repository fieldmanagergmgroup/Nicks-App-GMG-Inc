
import React, { useState, useCallback } from 'react';
import { Site, Contact, VisitFrequency, SiteStatus, User } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './common/Modal';
import { UploadIcon, DocumentDownloadIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface ImportSitesModalProps {
  onClose: () => void;
}

const CSV_TEMPLATE = `Client Name,Address,City,Frequency,Status,Client Type,Scope of Work,Contacts
ConstructCo,"123 Builder Lane",Toronto,Weekly,Active,"General Contractor","High-rise condo building.","Site Super:Frank Murphy:frank.m@construct.co;PM:David Lee:dlee@commerkings.com"
BuildRight Inc.,"101 Crane Ave, Unit 5",Brampton,Bi-Weekly,On Hold,Framers,"Wood-frame construction.",
`;

const ImportSitesModal: React.FC<ImportSitesModalProps> = ({ onClose }) => {
    const { addSites, users, addToast } = useAppContext();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setError('Please select a valid .csv file.');
        }
    };
    
    const downloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "gmg_sites_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parseContacts = (contactsString: string): Contact[] => {
        if (!contactsString) return [];
        try {
            return contactsString.split(';').map(part => {
                const [role, name, info] = part.split(':');
                return { role: role?.trim() || '', name: name?.trim() || '', info: info?.trim() || '' };
            }).filter(c => c.name && c.role);
        } catch {
            return [];
        }
    };

    // Robust State Machine CSV Parser
    // Handles quoted fields containing newlines and commas correctly
    const parseCSV = (text: string): string[][] => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentField = '';
        let insideQuotes = false;
        
        // Remove Byte Order Mark if present (common in Excel exports)
        const cleanText = text.replace(/^\uFEFF/, '');

        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            const nextChar = cleanText[i + 1];
            
            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    // Escaped quote ("") inside a quoted field
                    currentField += '"';
                    i++; // Skip the next quote
                } else {
                    // Toggle quote state
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                // End of field
                currentRow.push(currentField.trim());
                currentField = '';
            } else if ((char === '\r' || char === '\n') && !insideQuotes) {
                // End of row
                // Handle CRLF (\r\n)
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
                
                currentRow.push(currentField.trim());
                
                // Only add row if it has data (ignore empty lines at end of file)
                if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                     rows.push(currentRow);
                }
                
                currentRow = [];
                currentField = '';
            } else {
                // Standard character
                currentField += char;
            }
        }
        
        // Push the very last row if the file doesn't end with a newline
        if (currentField || currentRow.length > 0) {
             currentRow.push(currentField.trim());
             if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                 rows.push(currentRow);
             }
        }
        
        return rows;
    };

    const handleImport = useCallback(async () => {
        if (!file) {
            setError('Please select a file to import.');
            return;
        }
        setIsProcessing(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) {
                setError("File is empty or could not be read.");
                setIsProcessing(false);
                return;
            }

            try {
                const rows = parseCSV(text);
                
                if (rows.length < 2) {
                     setError("File appears to have no data rows (only header or empty).");
                     setIsProcessing(false);
                     return;
                }

                // Assume Row 0 is Header, Data starts at Row 1
                const dataRows = rows.slice(1); 
                const newSites: Omit<Site, 'id'>[] = [];

                for (const columns of dataRows) {
                    // We expect roughly 8 columns based on template:
                    // Name, Address, City, Freq, Status, Type, Scope, Contacts
                    // If a row is completely malformed (less than 2 columns), skip it.
                    if (columns.length < 2) continue; 
                    
                    // Safety check for undefined columns
                    const clientName = columns[0] || '';
                    const address = columns[1] || '';
                    const city = columns[2] || '';
                    const frequency = columns[3] || 'Weekly';
                    const status = columns[4] || 'Active';
                    const clientType = columns[5] || 'Unknown';
                    const scopeOfWork = columns[6] || '';
                    const contactsStr = columns[7] || '';
                    
                    if (!clientName || !address) {
                        continue; // Skip rows without essential identifiers
                    }

                    newSites.push({
                        clientName,
                        address,
                        city: city,
                        frequency: (frequency as VisitFrequency) || 'Weekly',
                        status: (status as SiteStatus) || 'Active',
                        clientType: clientType,
                        scopeOfWork: scopeOfWork,
                        contacts: parseContacts(contactsStr),
                        assignedConsultantId: 0, // Default to unassigned
                        latitude: 0, // Placeholder
                        longitude: 0, // Placeholder
                    });
                }
                
                if (newSites.length > 0) {
                    const result = await addSites(newSites);
                    addToast(`Import complete. Found ${newSites.length} rows. Added ${result.added}, Skipped ${result.skipped} duplicates.`, 'success');
                } else {
                    addToast("No valid new sites found in the file.", 'info');
                }
            } catch (err) {
                console.error(err);
                setError("Failed to parse CSV. Please ensure the file format matches the template.");
            }
            
            setIsProcessing(false);
            onClose();
        };

        reader.onerror = () => {
             setError("Error reading the file.");
             setIsProcessing(false);
        }

        reader.readAsText(file);

    }, [file, addSites, onClose, addToast]);

    return (
        <Modal isOpen={true} onClose={onClose} title="Import Client Sites from CSV">
            <div className="space-y-6">
                <div className="p-4 space-y-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Instructions</h3>
                    <ol className="text-sm list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Open your client list in Microsoft Word, Excel, or Google Sheets.</li>
                        <li>Organize your data into columns matching our template.</li>
                        <li>From your spreadsheet program, use <strong>"Save As"</strong> or <strong>"Download"</strong> and choose the <strong>CSV (Comma-Separated Values)</strong> format.</li>
                        <li>Upload the generated CSV file below.</li>
                    </ol>
                    <button onClick={downloadTemplate} className="inline-flex items-center px-3 py-1 text-sm font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        <DocumentDownloadIcon className="w-4 h-4 mr-2"/>
                        Download CSV Template
                    </button>
                </div>

                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Upload CSV File
                    </label>
                    <div className="flex items-center mt-2 space-x-4">
                        <label htmlFor="file-upload" className="flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                           <UploadIcon className="w-5 h-5 mr-2" />
                           <span>Choose File</span>
                        </label>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv" />
                        {file && <span className="text-sm text-gray-600 dark:text-gray-400">{file.name}</span>}
                    </div>
                     {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>
                
                 {file && (
                    <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Ready to import <strong>{file.name}</strong>. The system will carefully parse complex fields (like addresses with commas or multi-line scopes of work) and check for duplicates.
                        </p>
                    </div>
                )}


                <div className="flex justify-end pt-4 space-x-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleImport} 
                        disabled={!file || isProcessing}
                        className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Import Sites'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ImportSitesModal;
