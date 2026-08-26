"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  activeTool?: string;
};

interface CopilotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openCopilot: (context?: any) => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  productContext: any;
  setProductContext: (ctx: any) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearHistory: () => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [productContext, setProductContext] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore messages and open state from sessionStorage on mount
  useEffect(() => {
    try {
      const savedMessages = sessionStorage.getItem('buildstack_copilot_messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      const savedOpen = sessionStorage.getItem('buildstack_copilot_open');
      if (savedOpen === 'true') {
        setIsOpen(true);
      }
    } catch (e) {
      console.error('Failed to load copilot state from session', e);
    }
    setIsHydrated(true);
  }, []);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      sessionStorage.setItem('buildstack_copilot_messages', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save copilot messages to session', e);
    }
  }, [messages, isHydrated]);

  // Persist open state to sessionStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      sessionStorage.setItem('buildstack_copilot_open', isOpen ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save copilot open state to session', e);
    }
  }, [isOpen, isHydrated]);

  // Automatically clear active product context when navigating away from a single product page
  useEffect(() => {
    if (!pathname || pathname === '/catalog' || !pathname.startsWith('/catalog/')) {
      setProductContext(null);
    }
  }, [pathname]);

  const openCopilot = (ctx?: any) => {
    if (ctx) setProductContext(ctx);
    setIsOpen(true);
  };

  const closeCopilot = () => setIsOpen(false);
  const toggleCopilot = () => setIsOpen((prev) => !prev);
  
  const clearHistory = () => {
    setMessages([]);
    try {
      sessionStorage.removeItem('buildstack_copilot_messages');
    } catch (e) {}
  };

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        setIsOpen,
        openCopilot,
        closeCopilot,
        toggleCopilot,
        productContext,
        setProductContext,
        messages,
        setMessages,
        clearHistory,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
}
