import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatParams {
  title: string;
  mode: 'group' | 'private';
  eventId?: number;
  conversationId?: number;
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
    setParams(newParams);
    setIsOpen(true);
  };

  const closeChat = () => {
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
