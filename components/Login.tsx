
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';

const Login: React.FC = () => {
  const { login, users } = useAppContext();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 mx-4 space-y-8 bg-white rounded-lg shadow-xl sm:p-8 dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-secondary dark:text-gray-100">GM Group Inc. Route Planner</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please select your user profile to log in.</p>
        </div>
        <div className="space-y-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => login(user.id)}
              className="w-full px-4 py-3 text-lg font-semibold text-white transition-colors duration-300 rounded-md bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Login as {user.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-center text-gray-500 dark:text-gray-500">
            This is a demo application. No password is required.
        </p>
      </div>
    </div>
  );
};

export default Login;
