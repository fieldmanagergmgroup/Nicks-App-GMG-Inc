
import React, { useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAppContext } from './hooks/useAppContext';
import { ToastContainer } from './components/common/Toast';
import { Theme } from './types';
import ErrorBoundary from './components/common/ErrorBoundary';

const App: React.FC = () => {
  const { user, theme } = useAppContext();

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (themeValue: Theme) => {
        if (themeValue === 'dark') {
            root.classList.add('dark');
        } else if (themeValue === 'light') {
            root.classList.remove('dark');
        } else { // system
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }
}, [theme]);


  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans text-gray-800 bg-gray-100 dark:bg-gray-900 dark:text-white">
        {user ? <Dashboard /> : <Login />}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
};

export default App;