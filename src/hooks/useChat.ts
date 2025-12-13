'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChatMessage } from '@/types/game';

interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  showChat: boolean;
  toggleChat: () => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (sendFn: (message: string) => void) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const toggleChat = useCallback(() => {
    setShowChat((prev) => !prev);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(
    (sendFn: (message: string) => void) => {
      if (!input.trim()) return;
      sendFn(input);
      setInput('');
    },
    [input]
  );

  // Keyboard shortcuts for chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyT' && !showChat) {
        e.preventDefault();
        setShowChat(true);
      }
      if (e.code === 'Escape' && showChat) {
        setShowChat(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChat]);

  // ✅ Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    messages,
    input,
    setInput,
    showChat,
    toggleChat,
    addMessage,
    sendMessage,
  }), [messages, input, setInput, showChat, toggleChat, addMessage, sendMessage]);
}
