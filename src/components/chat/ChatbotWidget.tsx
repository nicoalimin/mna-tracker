'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, Send, X, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useChat } from '@ai-sdk/react';
// import { UIMessage } from 'ai'; // Import if needed, but useChat handles generic types

const STORAGE_KEY = 'mna-chatbot-state-v2';

// Define initial message manually to match structure
const initialMessages: any[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: `Hi! I'm your M&A assistant. I can help you navigate the app.

For company search and analysis, click ↗ to open AI Discovery.

Your data is pulled from Supabase - import companies via Master Data.`,
  },
];

interface ChatbotState {
  isOpen: boolean;
  isMinimized: boolean;
}

const saveChatState = (state: ChatbotState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save chatbot state to localStorage:', error);
  }
};

const loadChatState = (): ChatbotState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load chatbot state from localStorage:', error);
    return null;
  }
};

export function ChatbotWidget() {
  const router = useRouter();

  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // useChat hook
  // Casting to any to avoid type mismatches with different SDK versions
  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, setMessages, stop } = useChat({
    api: '/api/chat',
    initialMessages: initialMessages,
    onError: (error) => {
      console.error('Chat error:', error);
    },
  } as any) as any;

  // Load widget UI state
  useEffect(() => {
    const initialState = loadChatState();
    if (initialState) {
      setIsOpen(initialState.isOpen);
      setIsMinimized(initialState.isMinimized);
    }
  }, []);

  // Save widget UI state
  useEffect(() => {
    const state: ChatbotState = { isOpen, isMinimized };
    saveChatState(state);
  }, [isOpen, isMinimized]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // handleSubmit(e as any); // handled by form
    }
  };

  const handleExpand = () => {
    setIsOpen(false);
    router.push('/ai-discovery');
  };

  const handleClear = useCallback(() => {
    setMessages(initialMessages);
    setInput('');
    stop();
  }, [setMessages, setInput, stop]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  // Render content safely handling both string content and parts
  const renderContent = (message: any) => {
    if (message.parts) {
      return message.parts.map((part: any, i: number) => {
        if (part.type === 'text') {
          return <MarkdownRenderer key={`${message.id}-part-${i}`} content={part.text} className="text-sm" />;
        }
        return null;
      });
    }
    return <MarkdownRenderer content={message.content} className="text-sm" />;
  };

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 z-50 shadow-2xl border-purple-200 dark:border-purple-800/50 overflow-hidden transition-all duration-200 flex flex-col",
      isMinimized ? "w-80 h-14" : "w-96 h-[500px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-medium">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
            onClick={handleExpand}
            title="Open full AI Discovery"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
            onClick={handleClear}
            title="Clear conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                      message.role === 'assistant'
                        ? "bg-gradient-to-br from-purple-500 to-purple-600"
                        : "bg-primary"
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-xs text-primary-foreground font-medium">You</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2 text-sm",
                      message.role === 'assistant'
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                    )}
                  >
                    {renderContent(message)}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3 bg-background/95 backdrop-blur-sm">
            <form
              className="flex gap-2"
              onSubmit={handleSubmit}
            >
              <Input
                value={input}
                onChange={handleInputChange}
                // onKeyDown={handleKeyDown} 
                placeholder="Ask me anything..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </Card>
  );
}
