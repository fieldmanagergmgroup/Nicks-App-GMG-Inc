
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './common/Modal';
import { Site, User, VisitFrequency } from '../types';
import { FunnelIcon, CheckCircleIcon, UserIcon, ArrowUturnLeftIcon, UserGroupIcon } from './icons';

interface SiteDistributionModalProps {
  onClose: () => void;
}

const SiteDistributionModal: React.FC<SiteDistributionModalProps> = ({ onClose }) => {
  const { sites, users, reassignSites } = useAppContext();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<VisitFrequency | 'all'>('all');
  // sourceFilter: 'unassigned' | 'all' | userId (as string)
  const [sourceFilter, setSourceFilter] = useState<string>('unassigned');
  
  // Selection
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<number>>(new Set());

  const consultants = useMemo(() => users.filter(u => u.role === 'consultant'), [users]);
  
  // Get unique cities for filter
  const cities = useMemo(() => Array.from(new Set(sites.map(s => s.city).filter(Boolean))).sort(), [sites]);

  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      const isActive = site.status === 'Active';
      if (!isActive) return false; // Only distribute active sites

      // Source Filter Logic
      if (sourceFilter === 'unassigned') {
          if (site.assignedConsultantId !== 0) return false;
      } else if (sourceFilter !== 'all') {
          // Specific Consultant ID
          if (site.assignedConsultantId !== parseInt(sourceFilter)) return false;
      }

      // City Filter
      if (cityFilter !== 'all' && site.city !== cityFilter) return false;

      // Frequency Filter
      if (frequencyFilter !== 'all' && site.frequency !== frequencyFilter) return false;

      // Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          site.clientName.toLowerCase().includes(q) ||
          site.address.toLowerCase().includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
        // Sort by owner first if viewing 'all', then by client name
        if (sourceFilter === 'all' && a.assignedConsultantId !== b.assignedConsultantId) {
            return a.assignedConsultantId - b.assignedConsultantId;
        }
        return a.clientName.localeCompare(b.clientName);
    });
  }, [sites, sourceFilter, cityFilter, frequencyFilter, searchQuery]);

  const handleSelectAll = () => {
    if (selectedSiteIds.size === filteredSites.length) {
      setSelectedSiteIds(new Set());
    } else {
      setSelectedSiteIds(new Set(filteredSites.map(s => s.id)));
    }
  };

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedSiteIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSiteIds(newSet);
  };

  const handleMove = async (targetConsultantId: number) => {
    if (selectedSiteIds.size === 0) return;
    
    // 0 = Unassigned Pool
    await reassignSites(Array.from(selectedSiteIds), targetConsultantId);
    setSelectedSiteIds(new Set()); // Clear selection after assignment
  };

  // Prepare target list including Unassigned Pool
  const targets = useMemo(() => {
      const poolCount = sites.filter(s => s.assignedConsultantId === 0 && s.status === 'Active').length;
      
      const poolTarget = {
          id: 0,
          name: 'Unassigned Pool',
          type: 'pool',
          count: poolCount,
          initials: 'UP'
      };

      const consultantTargets = consultants.map(c => ({
          id: c.id,
          name: c.name,
          type: 'consultant',
          count: sites.filter(s => s.assignedConsultantId === c.id && s.status === 'Active').length,
          initials: c.name.charAt(0)
      }));

      return [poolTarget, ...consultantTargets];
  }, [consultants, sites]);


  return (
    <Modal isOpen={true} onClose={onClose} title="Advanced Site Distribution Control" zIndexClass="z-[60]" maxWidthClass="max-w-[95vw] lg:max-w-7xl">
      <div className="flex flex-col h-[85vh] -mx-4 -my-4 sm:-mx-6 sm:-my-6">
        
        {/* Toolbar */}
        <div className="flex flex-col gap-2 p-3 bg-gray-50 border-b dark:bg-gray-800 dark:border-gray-700 lg:flex-row lg:items-end flex-shrink-0 text-sm">
           {/* Source Filter */}
           <div className="flex flex-col w-full sm:w-auto lg:w-1/5">
               <label className="mb-1 text-xs font-bold text-gray-500 uppercase dark:text-gray-400">Source</label>
               <select 
                  value={sourceFilter} 
                  onChange={(e) => { setSourceFilter(e.target.value); setSelectedSiteIds(new Set()); }}
                  className="block w-full py-1.5 pl-2 pr-8 text-xs border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-brand-primary focus:outline-none focus:ring-brand-primary"
               >
                  <option value="unassigned">Unassigned Pool</option>
                  <option value="all">All Active Sites</option>
                  <optgroup label="Specific Consultant Lists">
                      {consultants.map(c => <option key={c.id} value={c.id.toString()}>{c.name}'s List</option>)}
                  </optgroup>
               </select>
           </div>

           {/* City Filter */}
           <div className="flex flex-col w-full sm:w-auto lg:w-1/6">
               <label className="mb-1 text-xs font-bold text-gray-500 uppercase dark:text-gray-400">City</label>
               <select 
                  value={cityFilter} 
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="block w-full py-1.5 pl-2 pr-8 text-xs border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-brand-primary focus:outline-none focus:ring-brand-primary"
               >
                  <option value="all">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
           </div>

           {/* Frequency Filter */}
           <div className="flex flex-col w-full sm:w-auto lg:w-1/6">
               <label className="mb-1 text-xs font-bold text-gray-500 uppercase dark:text-gray-400">Frequency</label>
               <select 
                  value={frequencyFilter} 
                  onChange={(e) => setFrequencyFilter(e.target.value as VisitFrequency | 'all')}
                  className="block w-full py-1.5 pl-2 pr-8 text-xs border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-brand-primary focus:outline-none focus:ring-brand-primary"
               >
                  <option value="all">All Frequencies</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Shop Audit">Shop Audit</option>
               </select>
           </div>

            {/* Search */}
           <div className="flex flex-col flex-1 w-full">
              <label className="mb-1 text-xs font-bold text-gray-500 uppercase dark:text-gray-400">Search</label>
              <div className="relative">
                  <input 
                     type="text" 
                     placeholder="Search sites..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full py-1.5 pl-8 pr-3 text-xs border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                      <FunnelIcon className="w-4 h-4 text-gray-400" />
                  </div>
              </div>
           </div>
        </div>

        {/* Main Content Area - Side by Side on MD+ */}
        <div className="flex flex-col flex-1 overflow-hidden md:flex-row">
          
          {/* LEFT: Source Site List */}
          <div className="flex flex-col flex-1 min-w-0 bg-white border-b border-r-0 md:border-b-0 md:border-r dark:border-gray-700 dark:bg-gray-900 min-h-0">
             <div className="flex items-center justify-between p-2 px-3 bg-gray-100 border-b dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                    Source List <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">({filteredSites.length})</span>
                </h3>
                <button 
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-brand-primary hover:text-brand-secondary"
                >
                  {selectedSiteIds.size === filteredSites.length && filteredSites.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
             </div>
             <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                {filteredSites.length > 0 ? filteredSites.map(site => {
                   const isSelected = selectedSiteIds.has(site.id);
                   const currentOwner = users.find(u => u.id === site.assignedConsultantId);
                   return (
                     <div 
                        key={site.id} 
                        onClick={() => toggleSelection(site.id)}
                        className={`p-2 rounded-md border cursor-pointer transition-all flex items-start group ${isSelected ? 'bg-brand-primary/5 border-brand-primary shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-primary/50 dark:hover:border-brand-primary/50'}`}
                     >
                        <div className={`w-4 h-4 mt-0.5 mr-2 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-gray-300 dark:border-gray-500 group-hover:border-brand-primary'}`}>
                           {isSelected && <CheckCircleIcon className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start gap-1">
                              <span className="text-xs font-bold text-gray-800 truncate dark:text-gray-100 leading-tight">{site.clientName}</span>
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                  {site.frequency}
                              </span>
                           </div>
                           <div className="text-[10px] text-gray-500 truncate dark:text-gray-400 mt-0.5">{site.address}, {site.city}</div>
                           
                           {/* Only show owner tag if viewing "All Active" to avoid redundancy */}
                           {sourceFilter === 'all' && (
                               <div className={`mt-1 inline-flex items-center px-1 py-0 rounded text-[9px] font-medium border ${currentOwner ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'}`}>
                                   {currentOwner ? currentOwner.name : 'Unassigned'}
                               </div>
                           )}
                        </div>
                     </div>
                   );
                }) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 opacity-60">
                    <FunnelIcon className="w-8 h-8 mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs">No sites match.</p>
                  </div>
                )}
             </div>
          </div>

          {/* RIGHT: Target Destinations */}
          <div className="flex flex-col w-full flex-1 md:w-1/2 lg:w-[45%] bg-gray-50 dark:bg-gray-800/50 min-h-0">
             <div className="p-2 px-3 border-b bg-gray-100 dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                    Target Destination
                </h3>
             </div>
             <div className="flex-1 p-2 overflow-y-auto">
                {/* Unified Grid for Targets including Unassigned Pool */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {targets.map(target => {
                        const isPool = target.type === 'pool';
                        return (
                            <div 
                                key={target.id} 
                                className={`p-2 transition-shadow bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 hover:shadow-md flex flex-col justify-between ${isPool ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' : 'border-gray-200'}`}
                            >
                                <div className="flex items-center mb-2">
                                    <div className={`flex items-center justify-center w-7 h-7 mr-2 text-[10px] font-bold rounded-full flex-shrink-0 ${isPool ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100' : 'text-white bg-brand-secondary'}`}>
                                        {isPool ? <ArrowUturnLeftIcon className="w-4 h-4"/> : target.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-xs font-bold truncate ${isPool ? 'text-amber-900 dark:text-amber-100' : 'text-gray-900 dark:text-gray-100'}`}>{target.name}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400">Load: <span className="font-mono font-bold">{target.count}</span></div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleMove(target.id)}
                                    disabled={selectedSiteIds.size === 0}
                                    className={`flex items-center justify-center w-full px-2 py-1.5 text-xs font-bold transition-colors rounded shadow-sm disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed ${isPool ? 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50 dark:bg-gray-800 dark:text-amber-300 dark:border-amber-900/50 dark:hover:bg-gray-700' : 'text-white bg-brand-primary hover:bg-brand-secondary'}`}
                                >
                                    {isPool ? 'Move Here' : 'Assign'} ({selectedSiteIds.size || 0})
                                </button>
                            </div>
                        );
                    })}
                </div>
             </div>
          </div>

        </div>
        
        {/* Footer Info */}
        <div className="flex items-center justify-between p-2 px-3 text-xs text-gray-500 bg-white border-t dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 flex-shrink-0">
            <span className="font-medium">
                {selectedSiteIds.size} sites selected.
            </span>
            <div className="flex space-x-2">
                <button onClick={() => setSelectedSiteIds(new Set())} disabled={selectedSiteIds.size === 0} className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1">
                    Clear
                </button>
                <button onClick={onClose} className="px-3 py-1 font-medium text-gray-800 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                    Done
                </button>
            </div>
        </div>

      </div>
    </Modal>
  );
};

export default SiteDistributionModal;
