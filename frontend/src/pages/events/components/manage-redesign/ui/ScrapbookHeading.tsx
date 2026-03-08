import React from 'react';

interface ScrapbookHeadingProps {
    title: string;
    icon?: React.ReactNode;
    level?: 1 | 2 | 3 | 4;
    className?: string;
    rotation?: number;
}

export const ScrapbookHeading: React.FC<ScrapbookHeadingProps> = ({
    title,
    icon,
    level = 4,
    className = '',
    rotation = -0.5,
}) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements;

    const sizeClasses = {
        1: 'text-3xl',
        2: 'text-2xl',
        3: 'text-xl',
        4: 'text-lg',
    };

    return (
        <div
            className={`flex items-center gap-2 mb-4 ${className}`}
            style={{ transform: `rotate(${rotation}deg)` }}
        >
            {icon && <span className="text-gray-800">{icon}</span>}
            <Component
                className={`font-bold text-gray-900 ${sizeClasses[level]}`}
                style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
                {title}
            </Component>
            {level <= 2 && (
                <div className="flex-grow border-b-2 border-dashed border-gray-400 opacity-50 ml-2 mt-2"></div>
            )}
        </div>
    );
};
