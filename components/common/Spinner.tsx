import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="w-12 h-12 border-4 border-t-4 rounded-full border-brand-primary/20 border-t-brand-primary animate-spin" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
