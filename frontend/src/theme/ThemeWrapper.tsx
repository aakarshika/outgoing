import { ReactNode, useEffect } from 'react';
import { GlobalThemes } from './ThemeRegistry';

interface ThemeWrapperProps {
    themeName?: string;
    children: ReactNode;
}

export const ThemeWrapper = ({ themeName, children }: ThemeWrapperProps) => {
    useEffect(() => {
        if (!themeName || !GlobalThemes[themeName]) {
            return;
        }

        const theme = GlobalThemes[themeName];
        const root = document.documentElement;

        // Track styles to remove on cleanup
        const appliedStyles: string[] = [];

        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(key, value);
            appliedStyles.push(key);
        });

        return () => {
            appliedStyles.forEach((key) => {
                root.style.removeProperty(key);
            });
        };
    }, [themeName]);

    return <>{children}</>;
};
