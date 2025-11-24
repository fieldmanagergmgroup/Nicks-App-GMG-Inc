
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { LogoutIcon, SunIcon, MoonIcon } from './icons';

const Header: React.FC = () => {
  const { user, logout, theme, setTheme } = useAppContext();
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-30 border-b border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-2xl font-bold text-white">
          <span className="text-white tracking-wider">GMG</span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
           <button
            onClick={toggleTheme}
            className="p-2 text-gray-300 transition-colors rounded-full hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          </button>
          <div className="hidden px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-md sm:block">
            v4-fix
          </div>
          <div className="text-right text-white">
            <p className="font-semibold truncate">{user?.name}</p>
            <p className="hidden text-xs text-gray-400 sm:block">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex-shrink-0 p-2 text-gray-300 transition-colors rounded-full hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            aria-label="Logout"
          >
            <LogoutIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
