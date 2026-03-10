import React from 'react';

interface EnclosingBoxProps {
  children: React.ReactNode;
  className?: string;
  background?: string;
  rotation?: number;
}

export const EnclosingBox: React.FC<EnclosingBoxProps> = ({
  children,
  className = '',
  background = 'bg-transparent',
  rotation = 0,
}) => {
  return (
    <div
      className={`p-4 mb-6 ${background} ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </div>
  );
};
