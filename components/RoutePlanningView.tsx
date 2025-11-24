
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { User, Weekday, RouteMode, Site, RouteOptimizationConfig } from '../types';
import { MapIcon, CurrencyDollarIcon, ClockIcon, CogIcon, ChevronDownIcon } from './icons';

const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Map bounding box for Southern Ontario
const ONTARIO_BOUNDS = {
  minLng: -83.0, // Windsor
  maxLng: -79.0, // East of Toronto
  minLat: 42.3,  // South of Windsor
  maxLat: 44.0,  // North of Vaughan
};

const SitePin: React.FC<{ site: Site; consultantColor: string }> = ({ site, consultantColor }) => {
  const { latitude, longitude } = site;
  const x = ((longitude - ONTARIO_BOUNDS.minLng) / (ONTARIO_BOUNDS.maxLng - ONTARIO_BOUNDS.minLng)) * 100;
  const y = 100 - ((latitude - ONTARIO_BOUNDS.minLat) / (ONTARIO_BOUNDS.maxLat - ONTARIO_BOUNDS.minLat)) * 100;

  if (x < 0 || x > 100 || y < 0 || y > 100) return null;

  return (
    <div
      className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full dark:border-gray-900"
      style={{ left: `${x}%`, top: `${y}%`, backgroundColor: consultantColor }}
      title={`${site.clientName}\n${site.address}`}
    ></div>
  );
};

const RouteSettings: React.FC = () => {
  const { routeConfig, updateRouteConfig } = useAppContext();
  const [formState, setFormState] = useState<RouteOptimizationConfig>(routeConfig);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setFormState(routeConfig);
  }, [routeConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleSave = () => {
    updateRouteConfig(formState);
    setIsOpen(false);
  };
  
  const inputClasses = "mt-1 block w-full rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-brand-primary focus:border-brand-primary sm:text-sm";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const adrnmentClasses = "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400";


  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full font-semibold text-left text-gray-800 dark:text-gray-100">
        <div className="flex items-center">
            <CogIcon className="w-5 h-5 mr-2" />
            Route Optimization Settings
        </div>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-4 pt-4 border-t dark:border-gray-600 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="travelTimeRate" className={labelClasses}>Time Rate ($/hr)</label>
                <div className="relative mt-1"><input type="number" name="travelTimeRate" id="travelTimeRate" value={formState.travelTimeRate} onChange={handleChange} className={`${inputClasses}`} placeholder="25.00" /></div>
              </div>
              <div>
                <label htmlFor="distanceRate" className={labelClasses}>Distance Rate ($/km)</label>
                <div className="relative mt-1"><input type="number" name="distanceRate" id="distanceRate" value={formState.distanceRate} onChange={handleChange} className={`${inputClasses}`} placeholder="0.55" step="0.01" /></div>
              </div>
              <div>
                <label htmlFor="perSiteRate" className={labelClasses}>Per Site Rate ($/visit)</label>
                <div className="relative mt-1"><input type="number" name="perSiteRate" id="perSiteRate" value={formState.perSiteRate} onChange={handleChange} className={`${inputClasses}`} placeholder="50.00" /></div>
              </div>
              <div>
                <label htmlFor="avgSpeedKmh" className={labelClasses}>Average Speed (km/h)</label>
                 <div className="relative mt-1"><input type="number" name="avgSpeedKmh" id="avgSpeedKmh" value={formState.avgSpeedKmh} onChange={handleChange} className={`${inputClasses}`} placeholder="60" /></div>
              </div>
            </div>
            <div className="flex justify-end">
                <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-brand-primary hover:bg-brand-secondary">Save Settings</button>
            </div>
        </div>
      )}
    </div>
  );
};


interface RoutePlanningViewProps {
  isConsultantView?: boolean;
}

const RoutePlanningView: React.FC<RoutePlanningViewProps> = ({ isConsultantView = false }) => {
  const { user, users, weeklyPlans, generateRouteSuggestions, routeSuggestions, clearRouteSuggestions } = useAppContext();
  
  const [selectedConsultantForManager, setSelectedConsultantForManager] = useState<User | null>(null);
  const selectedConsultant = isConsultantView ? user : selectedConsultantForManager;
  const setSelectedConsultant = isConsultantView ? () => {} : setSelectedConsultantForManager;
  
  const [selectedDay, setSelectedDay] = useState<Weekday>(WEEKDAYS[0]);

  const consultants = useMemo(() => {
    if (isConsultantView && user) {
        return [user];
    }
    return users.filter(u => u.role === 'consultant' || u.role === 'management');
  }, [users, isConsultantView, user]);

  const consultantColors = useMemo(() => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
    return new Map(consultants.map((c, i) => [c.id, colors[i % colors.length]]));
  }, [consultants]);

  const sitesForSelectedDay = useMemo(() => {
    if (!selectedConsultant) return [];
    return weeklyPlans[selectedConsultant.id]?.planned[selectedDay] || [];
  }, [selectedConsultant, selectedDay, weeklyPlans]);
  
  const allPlannedSites = useMemo(() => {
    if (!selectedConsultant) return [];
    return Object.values(weeklyPlans[selectedConsultant.id]?.planned || {}).flat();
  }, [selectedConsultant, weeklyPlans]);


  useEffect(() => {
    // Clear suggestions when consultant or day changes
    clearRouteSuggestions();
  }, [selectedConsultant, selectedDay, clearRouteSuggestions]);

  const handleGenerateRoute = (mode: RouteMode) => {
    if (selectedConsultant) {
      generateRouteSuggestions(selectedConsultant.id, selectedDay, mode);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Controls & Route Details */}
      <div className="space-y-6 lg:col-span-1">
        <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          {isConsultantView ? (
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">1. Select Day</h3>
          ) : (
            <>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">1. Select Consultant & Day</h3>
              <select
                value={selectedConsultant?.id || ''}
                onChange={(e) => setSelectedConsultant(users.find(c => c.id === parseInt(e.target.value)) || null)}
                className="w-full p-2 mt-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
              >
                <option value="">-- Select a Consultant --</option>
                {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {WEEKDAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md border-2 transition-colors ${selectedDay === day ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white dark:bg-gray-800 text-brand-secondary border-gray-200 dark:border-gray-600 hover:border-brand-primary'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        
        {selectedConsultant && (
            <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">2. Generate Route</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Optimize for {sitesForSelectedDay.length} sites planned on {selectedDay}.</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => handleGenerateRoute('fastest')} disabled={sitesForSelectedDay.length === 0} className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Fastest Route</button>
                    <button onClick={() => handleGenerateRoute('balanced')} disabled={sitesForSelectedDay.length === 0} className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-md bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Balanced</button>
                </div>
            </div>
        )}

        {routeSuggestions && (
          <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Suggested Route</h3>
            <p className="text-sm font-semibold capitalize text-brand-primary">{routeSuggestions.mode} Mode</p>
            
            <div className="mt-4 space-y-2">
                <div className="flex justify-between p-2 text-sm bg-gray-100 rounded-md dark:bg-gray-700"><span><ClockIcon className="inline w-4 h-4 mr-1"/>Est. Time:</span> <span className="font-bold">{routeSuggestions.totalTime} hrs</span></div>
                <div className="flex justify-between p-2 text-sm bg-gray-100 rounded-md dark:bg-gray-700"><span><MapIcon className="inline w-4 h-4 mr-1"/>Distance:</span> <span className="font-bold">{routeSuggestions.totalDistance} km</span></div>
                {!isConsultantView && (
                    <div className="flex justify-between p-2 text-sm bg-gray-100 rounded-md dark:bg-gray-700"><span><CurrencyDollarIcon className="inline w-4 h-4 mr-1"/>Est. Pay:</span> <span className="font-bold">${routeSuggestions.estimatedPay.total}</span></div>
                )}
            </div>
            {routeSuggestions.warnings.length > 0 && <div className="p-2 mt-2 text-xs text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/30 dark:text-red-300 dark:border-red-500/30">{routeSuggestions.warnings.join(' ')}</div>}
            
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-2">
                <ol className="space-y-2 list-decimal list-inside">
                    {routeSuggestions.orderedSites.map(site => (
                        <li key={site.id} className="p-2 text-xs border-l-4 rounded-r-md bg-gray-50 dark:bg-gray-900/50" style={{ borderColor: consultantColors.get(site.assignedConsultantId) || '#ccc' }}>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{site.clientName}</p>
                            <p className="text-gray-500 dark:text-gray-400">{site.address}</p>
                        </li>
                    ))}
                </ol>
            </div>
          </div>
        )}
         {!isConsultantView && <RouteSettings />}
      </div>

      {/* Right Column: Map */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-24">
            <div className="p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Ontario Site Map</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedConsultant ? `Showing all planned sites for ${selectedConsultant.name}` : 'Select a consultant to see their sites.'}
                </p>
                <div className="relative mt-4 overflow-hidden bg-gray-100 border-2 border-gray-200 rounded-md aspect-video dark:bg-gray-900/50 dark:border-gray-700">
                    {/* Placeholder Map Background */}
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    {/* Site Pins */}
                    {allPlannedSites.map(site => (
                         <SitePin key={site.id} site={site} consultantColor={consultantColors.get(site.assignedConsultantId) || '#ccc'} />
                    ))}
                    
                    {/* Route Line */}
                    {routeSuggestions && (
                         <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'scale(1, -1) translate(0, -100%)' /* Invert Y axis for correct lat/lng plotting */ }}>
                            <polyline
                                points={
                                    routeSuggestions.orderedSites.map(site => 
                                        `${((site.longitude - ONTARIO_BOUNDS.minLng) / (ONTARIO_BOUNDS.maxLng - ONTARIO_BOUNDS.minLng)) * 100},${((site.latitude - ONTARIO_BOUNDS.minLat) / (ONTARIO_BOUNDS.maxLat - ONTARIO_BOUNDS.minLat)) * 100}`
                                    ).join(' ')
                                }
                                className="fill-none stroke-brand-primary/50"
                                strokeWidth="0.8"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                        </svg>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanningView;