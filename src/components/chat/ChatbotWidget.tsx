'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, Send, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  redirectToDiscovery?: boolean;
}

// Simple response handler - redirects complex queries to AI Discovery
const getResponse = (query: string): { response: string; redirectToDiscovery?: boolean } => {
  const lowerQuery = query.toLowerCase();

  // HELP
  if (lowerQuery.includes('help') || lowerQuery.includes('what can you') || lowerQuery === 'hi' || lowerQuery === 'hello') {
    return {
      response: `I'm your M&A assistant! I can help you navigate the app.

**Quick Links:**
- Dashboard - Overview of your data
- Master Data - Import and manage companies
- AI Discovery - Search and analyze companies

For detailed company search and analysis, click the expand button (↗) above to open AI Discovery.`,
    };
  }

  // Company-related queries - redirect to AI Discovery
  const discoveryKeywords = ['find', 'show', 'list', 'discover', 'search', 'companies', 'company',
    'technology', 'healthcare', 'financial', 'analyze', 'compare', 'data'];

  if (discoveryKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return {
      response: `To search and browse companies from your Supabase database, please use the full **AI Discovery** page.

Click the expand button (↗) above to open AI Discovery!`,
      redirectToDiscovery: true,
    };
  }

  // Default
  return {
    response: `I'm here to help! You can:

- Ask for **help** to see what I can do
- Open **AI Discovery** (click ↗) to search companies

Your data is stored in Supabase. Import companies through the Master Data page.`,
  };
};

export function ChatbotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your M&A assistant. I can help you navigate the app.

For company search and analysis, click ↗ to open AI Discovery.

Your data is pulled from Supabase - import companies via Master Data.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const { response, redirectToDiscovery } = getResponse(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        redirectToDiscovery,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExpand = () => {
    setIsOpen(false);
    router.push('/ai-discovery');
  };

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

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 z-50 shadow-2xl border-purple-200 dark:border-purple-800/50 overflow-hidden transition-all duration-200",
      isMinimized ? "w-80 h-14" : "w-96 h-[500px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white">
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
          <ScrollArea className="flex-1 h-[380px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
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
                    {message.role === 'assistant' ? (
                      <MarkdownRenderer content={message.content} className="text-sm" />
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
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
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 text-sm"
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
