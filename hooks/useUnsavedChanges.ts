import React, { useState, useEffect } from 'react';

const useUnsavedChanges = (): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  return [isDirty, setIsDirty];
};

export default useUnsavedChanges;