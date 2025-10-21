
import React from 'react';

const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    width="24"
    height="24"
  >
    <path
      fillRule="evenodd"
      d="M9 4.5a.75.75 0 01.75.75v3.546l3-3a.75.75 0 011.06 1.06l-3 3h3.546a.75.75 0 010 1.5H10.81l3 3a.75.75 0 01-1.06 1.06l-3-3v3.546a.75.75 0 01-1.5 0v-3.546l-3 3a.75.75 0 01-1.06-1.06l3-3H4.75a.75.75 0 010-1.5h3.546l-3-3a.75.75 0 011.06-1.06l3 3V5.25A.75.75 0 019 4.5z"
      clipRule="evenodd"
    />
    <path d="M15.75 11.25a.75.75 0 01.75-.75h3.546l-3-3a.75.75 0 011.06-1.06l3 3V5.25a.75.75 0 011.5 0v3.546l3 3a.75.75 0 11-1.06 1.06l-3-3h-3.546a.75.75 0 01-.75-.75z" />
  </svg>
);

export default BotIcon;
