
import React, { useState } from 'react';
import { Site, Report } from '../types';
import { OfficeBuildingIcon, UserGroupIcon, BriefcaseIcon, PencilIcon, ClockIcon, DocumentTextIcon } from './icons';
import { useAppContext } from '../hooks/useAppContext';
import { formatDateString } from '../utils/formatDate';
import ReportPrintModal from './ReportPrintModal';

interface SiteProfileDetailsProps {
    site: Site;
    onEdit?: () => void;
}

const SiteProfileDetails: React.FC<SiteProfileDetailsProps> = ({ site, onEdit }) => {
    const { user, users, reports } = useAppContext();
    const [viewingReport, setViewingReport] = useState<Report | null>(null);

    const visitHistory = reports
        .filter(r => r.siteId === site.id)
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-4 text-sm dark:text-gray-300">
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="flex items-center font-semibold text-gray-700 dark:text-gray-200">
                        <OfficeBuildingIcon className="w-5 h-5 mr-2 text-gray-400" />
                        Client Type
                    </h4>
                    <p className="mt-1 ml-7 text-gray-600 dark:text-gray-400">{site.clientType}</p>
                </div>
                {user?.role === 'management' && onEdit && (
                     <button onClick={onEdit} className="flex items-center px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        <PencilIcon className="w-4 h-4 mr-1"/>
                        Edit Site
                    </button>
                )}
            </div>
            <div>
                <h4 className="flex items-center font-semibold text-gray-700 dark:text-gray-200">
                    <BriefcaseIcon className="w-5 h-5 mr-2 text-gray-400" />
                    Scope of Work
                </h4>
                <p className="mt-1 ml-7 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{site.scopeOfWork}</p>
            </div>
            <div>
                <h4 className="flex items-center font-semibold text-gray-700 dark:text-gray-200">
                    <UserGroupIcon className="w-5 h-5 mr-2 text-gray-400" />
                    Site Contacts
                </h4>
                <ul className="mt-1 ml-7 space-y-1 text-gray-600 dark:text-gray-400">
                    {site.contacts.map((contact, index) => (
                        <li key={index}>
                           <span className="font-medium">{contact.role}:</span> {contact.name} ({contact.info})
                        </li>
                    ))}
                    {site.contacts.length === 0 && <li className="italic">No contacts listed.</li>}
                </ul>
            </div>
            <div>
                <h4 className="flex items-center font-semibold text-gray-700 dark:text-gray-200">
                    <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
                    Recent Visit History
                </h4>
                <ul className="mt-2 ml-7 space-y-2">
                    {visitHistory.map(report => {
                        const consultant = users.find(u => u.id === report.consultantId);
                        return (
                            <li key={report.id} className="p-2 text-xs border-l-2 border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 mr-2">
                                        <p className="font-semibold text-gray-600 dark:text-gray-300">{formatDateString(report.visitDate)} - <span className="font-bold">{report.status}</span> {consultant && `(by ${consultant.name})`}</p>
                                        {report.notes && <p className="italic text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">"{report.notes}"</p>}
                                    </div>
                                    <button
                                        onClick={() => setViewingReport(report)}
                                        className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white border border-gray-300 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <DocumentTextIcon className="w-3 h-3 mr-1"/> View
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                     {visitHistory.length === 0 && <li className="text-xs italic text-gray-500 dark:text-gray-400">No recent visit history found.</li>}
                </ul>
            </div>
            {viewingReport && (
                <ReportPrintModal
                    report={viewingReport}
                    site={site}
                    consultant={users.find(u => u.id === viewingReport.consultantId)}
                    onClose={() => setViewingReport(null)}
                />
            )}
        </div>
    );
};

export default SiteProfileDetails;
