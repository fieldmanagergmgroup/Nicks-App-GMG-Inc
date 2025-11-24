import React from 'react';

export const DirectionsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-5.122-4.128-9.25-9.25-9.25S1 6.878 1 12s4.128 9.25 9.25 9.25 9.25-4.128 9.25-9.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-7.5m0 0l-4.5 4.5m4.5-4.5l4.5 4.5" />
    </svg>
);