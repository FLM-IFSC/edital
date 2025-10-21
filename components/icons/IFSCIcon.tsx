import React from 'react';

const IFSCIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    >
    <rect x="4" y="4" width="4" height="16" rx="1"></rect>
    <rect x="10" y="4" width="4" height="16" rx="1"></rect>
    <rect x="16" y="4" width="4" height="16" rx="1"></rect>
</svg>
);

export default React.memo(IFSCIcon);