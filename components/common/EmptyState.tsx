import React from 'react';

interface EmptyStateProps {
  Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  message: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, message, children }) => {
  return (
    <div className="w-full px-4 py-12 text-center bg-gray-100 border-2 border-dashed rounded-lg sm:py-16 dark:bg-gray-800/50 dark:border-gray-700">
      {Icon && <Icon className="w-12 h-12 mx-auto text-gray-400" />}
      <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default EmptyState;
