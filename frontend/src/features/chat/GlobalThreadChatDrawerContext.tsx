import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type OpenGlobalThreadParams = {
  threadKey: string;
  title?: string;
  subtitle?: string;
};

type GlobalThreadChatDrawerContextValue = {
  /** Open the global thread drawer without changing the route (e.g. from profile Message). */
  openThread: (params: OpenGlobalThreadParams) => void;
  /** Close overlay if open; does not navigate (drawer also closes via URL when on `/allchats/t/...`). */
  closeThreadOverlay: () => void;
  overlay: OpenGlobalThreadParams | null;
  setOverlay: (v: OpenGlobalThreadParams | null) => void;
};

const GlobalThreadChatDrawerContext = createContext<GlobalThreadChatDrawerContextValue | null>(
  null,
);

export function GlobalThreadChatDrawerProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<OpenGlobalThreadParams | null>(null);

  const openThread = useCallback((params: OpenGlobalThreadParams) => {
    setOverlay(params);
  }, []);

  const closeThreadOverlay = useCallback(() => {
    setOverlay(null);
  }, []);

  const value = useMemo(
    () => ({
      openThread,
      closeThreadOverlay,
      overlay,
      setOverlay,
    }),
    [openThread, closeThreadOverlay, overlay],
  );

  return (
    <GlobalThreadChatDrawerContext.Provider value={value}>
      {children}
    </GlobalThreadChatDrawerContext.Provider>
  );
}

export function useGlobalThreadChatDrawer() {
  const ctx = useContext(GlobalThreadChatDrawerContext);
  if (!ctx) {
    throw new Error('useGlobalThreadChatDrawer must be used within GlobalThreadChatDrawerProvider');
  }
  return ctx;
}
