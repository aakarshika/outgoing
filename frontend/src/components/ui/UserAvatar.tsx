import React from 'react';
import { Media } from './media';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    src?: string | null;
    username?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    showBorder?: boolean;
    borderGradient?: boolean;
}

const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-24 w-24 text-xl',
    '2xl': 'h-32 w-32 text-2xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
    src,
    username,
    size = 'md',
    className,
    showBorder = false,
    borderGradient = false,
}) => {
    const initials = username
        ? username
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '?';

    const containerClasses = cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        sizeClasses[size],
        !src && 'bg-primary/10 text-primary',
        showBorder && !borderGradient && 'border-2 border-background ring-2 ring-border',
        className
    );

    const renderContent = () => {
        if (src) {
            return (
                <Media
                    src={src}
                    alt={username || 'User avatar'}
                    className="h-full w-full object-cover"
                />
            );
        }
        return <span>{initials}</span>;
    };

    if (borderGradient) {
        return (
            <div
                className={cn(
                    'rounded-full p-[3px] bg-gradient-to-tr from-primary via-primary/60 to-background shadow-md',
                    sizeClasses[size],
                    className
                )}
            >
                <div className="h-full w-full rounded-full bg-card border-[2px] border-background flex items-center justify-center overflow-hidden relative">
                    {renderContent()}
                </div>
            </div>
        );
    }

    return <div className={containerClasses}>{renderContent()}</div>;
};
