import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface BackgroundContextType {
    backgroundComponent: React.ReactNode;
    setBackgroundComponent: (component: React.ReactNode) => void;
    resetBackground: () => void;
}

const DefaultBackground = () => (
    <div
        className="fixed inset-0"
        style={{
            zIndex: -1, pointerEvents: 'none',
            backgroundColor: '#fefcf2ff'
        }}
    />
);

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [backgroundComponent, setComponent] = useState<React.ReactNode>(<DefaultBackground />);
    const lastPathRef = useRef(location.pathname);

    const setBackgroundComponent = useCallback((component: React.ReactNode) => {
        setComponent(component);
        lastPathRef.current = location.pathname;
    }, [location.pathname]);

    const resetBackground = useCallback(() => {
        setComponent(<DefaultBackground />);
    }, []);

    useEffect(() => {
        if (lastPathRef.current !== location.pathname) {
            setComponent(<DefaultBackground />);
            lastPathRef.current = location.pathname;
        }
    }, [location.pathname]);

    const value = useMemo(
        () => ({ backgroundComponent, setBackgroundComponent, resetBackground }),
        [backgroundComponent, setBackgroundComponent, resetBackground]
    );

    return (
        <BackgroundContext.Provider value={value}>
            {children}
        </BackgroundContext.Provider>
    );
};

export const useBackground = () => {
    const context = useContext(BackgroundContext);
    if (context === undefined) {
        throw new Error('useBackground must be used within a BackgroundProvider');
    }
    return context;
};
