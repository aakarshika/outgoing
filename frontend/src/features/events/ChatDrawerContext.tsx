import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ChatParams {
  title: string;
  mode: 'group' | 'direct' | 'private';
  eventId?: number;
  conversationId?: number;
  targetUsername?: string;
}

interface ChatDrawerContextType {
  isOpen: boolean;
  params: ChatParams | null;
  openChat: (params: ChatParams) => void;
  closeChat: () => void;
}

const ChatDrawerContext = createContext<ChatDrawerContextType | undefined>(undefined);

export function ChatDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [params, setParams] = useState<ChatParams | null>(null);

  const openChat = (newParams: ChatParams) => {
    console.debug('[ChatDrawerContext] openChat called', {
      previousIsOpen: isOpen,
      nextParams: newParams,
    });
    setParams(newParams);
    setIsOpen(true);
  };

  const closeChat = () => {
    console.debug('[ChatDrawerContext] closeChat called', {
      previousIsOpen: isOpen,
      params,
    });
    setIsOpen(false);
  };

  return (
    <ChatDrawerContext.Provider value={{ isOpen, params, openChat, closeChat }}>
      {children}
    </ChatDrawerContext.Provider>
  );
}

export function useChatDrawer() {
  const context = useContext(ChatDrawerContext);
  if (context === undefined) {
    throw new Error('useChatDrawer must be used within a ChatDrawerProvider');
  }
  return context;
}
