
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import ConsultantView from './ConsultantView';
import { User } from '../types';

const ConsultantSchedulesView: React.FC = () => {
  const { users } = useAppContext();
  const [selectedConsultant, setSelectedConsultant] = useState<User | null>(null);

  const consultants = useMemo(() => users.filter(u => u.role === 'consultant' || u.role === 'management'), [users]);
  
  return (
    <div className="space-y-6">
        <div className="p-4 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Select a Consultant to View Their Schedule</h3>
            <div className="flex flex-wrap gap-2 mt-3">
                {consultants.map(c => (
                    <button 
                        key={c.id}
                        onClick={() => setSelectedConsultant(c)}
                        className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${selectedConsultant?.id === c.id ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white dark:bg-gray-800 dark:text-gray-200 text-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>
        </div>

        {selectedConsultant ? (
            <div className="p-2 -mx-2 bg-white border rounded-lg sm:p-4 sm:mx-0 dark:bg-gray-800 dark:border-gray-700">
                <ConsultantView 
                    key={selectedConsultant.id} // Add key to force re-mount on consultant change
                    consultantId={selectedConsultant.id} 
                    isReadOnly={true} 
                />
            </div>
        ) : (
            <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-md dark:bg-gray-800/50">
                <p>Please select a consultant to see their weekly plan.</p>
            </div>
        )}
    </div>
  );
};

export default ConsultantSchedulesView;
