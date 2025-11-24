
import React from 'react';
import Modal from './common/Modal';
import { Report, Site, User, DeliveredItems } from '../types';
import { formatDateString } from '../utils/formatDate';

interface ReportPrintModalProps {
    report: Report;
    site: Site;
    consultant: User | undefined;
    onClose: () => void;
}

const itemKeyToLabel = (key: string): string => {
    const labels: Record<string, string> = {
        greenBooks: 'Green Books',
        safetyBoard: 'Safety Boards',
        fireExtinguisher: 'Fire Extinguishers',
        eyeWashStation: 'Eye Wash Stations',
        firstAidKitSmall: 'First Aid Kits (Small)',
        firstAidKitLarge: 'First Aid Kits (Large)',
        inspectionTags: 'Inspection Tags',
        specificProcedure: 'Workplace Specific Procedures',
    };
    return labels[key] || key;
};

const ReportPrintModal: React.FC<ReportPrintModalProps> = ({ report, site, consultant, onClose }) => {
    const handlePrint = () => {
        const printContent = document.getElementById('printable-report-area');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore React state/events after body nuke
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Print Report Preview" maxWidthClass="max-w-4xl">
            <div className="flex justify-end mb-4 space-x-2 no-print">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Close</button>
                <button onClick={handlePrint} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700">Print Report</button>
            </div>

            <div id="printable-report-area" className="p-8 bg-white text-black">
                {/* Print Styles injected only for this view */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-report-area, #printable-report-area * {
                            visibility: visible;
                        }
                        #printable-report-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>

                <div className="mb-6 border-b-2 border-gray-800 pb-4">
                    <h1 className="text-2xl font-bold uppercase">Site Visit Report</h1>
                    <p className="text-sm text-gray-600">GM Group Inc.</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="font-bold text-gray-700 uppercase text-xs mb-1">Client & Site</h3>
                        <p className="text-lg font-bold">{site.clientName}</p>
                        <p>{site.address}, {site.city}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-gray-700 uppercase text-xs mb-1">Visit Details</h3>
                        <p><span className="font-semibold">Date:</span> {formatDateString(report.visitDate)}</p>
                        <p><span className="font-semibold">Consultant:</span> {consultant?.name || 'Unknown'}</p>
                        <p><span className="font-semibold">Status:</span> {report.status}</p>
                        <p><span className="font-semibold">Report ID:</span> {report.id}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold text-gray-700 border-b border-gray-300 mb-2 pb-1">Visit Notes</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {report.notes || "No notes recorded for this visit."}
                    </p>
                </div>

                {report.managementNotes && (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-700 border-b border-gray-300 mb-2 pb-1">Changes / Internal Updates</h3>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {report.managementNotes}
                        </p>
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="font-bold text-gray-700 border-b border-gray-300 mb-2 pb-1">Procedures</h3>
                    {report.proceduresCreated.length > 0 ? (
                        <ul className="list-disc list-inside text-sm">
                            {report.proceduresCreated.map((proc, idx) => (
                                <li key={idx}>{proc}</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm italic text-gray-500">No new procedures generated.</p>}
                </div>

                {report.deliveredItems && Object.keys(report.deliveredItems).length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-700 border-b border-gray-300 mb-2 pb-1">Safety Equipment Delivered</h3>
                        <ul className="grid grid-cols-2 gap-2 text-sm">
                            {(Object.entries(report.deliveredItems) as [keyof DeliveredItems, number][]).map(([key, value]) => (
                                <li key={key}>
                                    <span className="font-semibold">{itemKeyToLabel(key)}:</span> {value}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-12 pt-4 border-t text-xs text-center text-gray-500">
                    <p>Generated by GM Group Inc. Route Planner System</p>
                    <p>{new Date().toLocaleString()}</p>
                </div>
            </div>
        </Modal>
    );
};

export default ReportPrintModal;
