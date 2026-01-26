'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bot,
  Send,
  Lightbulb,
  User,
  Plus,
  Check,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  companies?: CompanyResult[];
}

interface CompanyResult {
  id: string;
  target: string | null;
  segment: string | null;
  revenue_2021_usd_mn: number | null;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;
  ebitda_2021_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;
  ev_2024: number | null;
  added?: boolean;
}

// Values in database are in USD Millions
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  return `$${value.toFixed(1)}M`;
};

// LocalStorage key for AI Discovery chat history
const AI_DISCOVERY_STORAGE_KEY = 'mna-ai-discovery-history';

// Save chat history to localStorage
const saveChatHistory = (messages: Message[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AI_DISCOVERY_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save AI Discovery chat history to localStorage:', error);
  }
};

// Load chat history from localStorage
const loadChatHistory = (): Message[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AI_DISCOVERY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load AI Discovery chat history from localStorage:', error);
    return null;
  }
};

// Clear chat history from localStorage
const clearChatHistory = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AI_DISCOVERY_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear AI Discovery chat history from localStorage:', error);
  }
};

// Generate a unique session ID for conversation history
const getSessionId = () => {
  if (typeof window === 'undefined') return 'default';
  let sessionId = sessionStorage.getItem('chat-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('chat-session-id', sessionId);
  }
  return sessionId;
};

// Reset the session ID to start a fresh conversation with the API
const resetSessionId = () => {
  if (typeof window === 'undefined') return;
  const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  sessionStorage.setItem('chat-session-id', newSessionId);
};

// Call the AI agent API
const callAgentAPI = async (message: string): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sessionId: getSessionId(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get response from AI agent');
  }

  const data = await response.json();
  return data.response;
};

const initialMessage: Message = {
  id: '1',
  role: 'assistant',
  content: `# Welcome to M&A AI Discovery

I'm your intelligent M&A assistant powered by AI. I can help you explore and analyze company data from your database.

## What I can do:

1. **Query companies** - Search by segment, geography, financials
2. **Get statistics** - Summaries, averages, breakdowns by segment/geography  
3. **Company details** - Detailed profiles with historical financials
4. **Web search** - Market benchmarks, industry comparisons, external data

## Example questions:

- "Show me all technology companies"
- "What are the top companies by 2024 revenue?"
- "Find companies in Japan with EBITDA > 50M"
- "Get statistics by segment"
- "Tell me about [company name]"
- "What are typical EBITDA multiples in this industry?"

Just ask your question and I'll analyze the data for you!`,
};

const suggestionChips = [
  "show all companies",
  "get statistics by segment",
  "find companies with revenue > 100M",
];

export default function AIDiscovery() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedCompanies, setAddedCompanies] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = loadChatHistory();
    if (savedHistory && savedHistory.length > 0) {
      setMessages(savedHistory);
    }
    setIsInitialized(true);
  }, []);

  // Save chat history to localStorage whenever messages change (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      saveChatHistory(messages);
    }
  }, [messages, isInitialized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear chat history handler
  const handleClearHistory = useCallback(() => {
    clearChatHistory();
    resetSessionId(); // Reset session ID so API starts fresh conversation
    setMessages([initialMessage]);
    setInput('');
    setIsTyping(false);
    toast.success('Chat history cleared');
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Call the AI agent API
      const response = await callAgentAPI(currentInput);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, there was an error processing your request: ${(error as Error).message}. Please try again.`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (chip: string) => {
    setInput(chip);
  };

  const handleAddToWatchlist = async (company: CompanyResult) => {
    try {
      // Update company watchlist status
      const { error } = await supabase
        .from('companies')
        .update({ watchlist_status: 'Active' })
        .eq('id', company.id);

      if (error) throw error;

      setAddedCompanies(prev => new Set([...prev, company.id]));
      toast.success(`${company.target || 'Company'} added to watchlist`);
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add company to watchlist');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Discovery</h1>
              <p className="text-muted-foreground">
                Discover targets, analyze companies, compare synergies, and track pipeline
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden bg-muted/30 min-h-0">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6 max-w-5xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center",
                      message.role === 'assistant'
                        ? "bg-gradient-to-br from-purple-500 to-purple-600"
                        : "bg-primary"
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <Bot className="h-5 w-5 text-white" />
                    ) : (
                      <User className="h-5 w-5 text-primary-foreground" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={cn(
                      "flex-1 rounded-2xl px-5 py-4",
                      message.role === 'assistant'
                        ? "bg-card border shadow-sm"
                        : "bg-primary text-primary-foreground ml-auto max-w-[70%]"
                    )}
                  >
                    <MarkdownRenderer
                      content={message.content}
                      className={cn(
                        message.role === 'user' && "prose-invert [&_*]:text-primary-foreground"
                      )}
                    />

                    {/* Company Table Results */}
                    {message.companies && message.companies.length > 0 && (
                      <div className="mt-4 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Company</TableHead>
                              <TableHead>Segment</TableHead>
                              <TableHead className="text-right">Rev 2022</TableHead>
                              <TableHead className="text-right">Rev 2023</TableHead>
                              <TableHead className="text-right">Rev 2024</TableHead>
                              <TableHead className="text-right">EBITDA 2024</TableHead>
                              <TableHead className="text-right">EV 2024</TableHead>
                              <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {message.companies.map((company) => {
                              const isAdded = addedCompanies.has(company.id);
                              return (
                                <TableRow key={company.id}>
                                  <TableCell className="font-medium">{company.target || 'Unknown'}</TableCell>
                                  <TableCell className="text-muted-foreground">{company.segment || '-'}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.revenue_2022_usd_mn)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.revenue_2023_usd_mn)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.revenue_2024_usd_mn)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.ebitda_2024_usd_mn)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.ev_2024)}</TableCell>
                                  <TableCell className="text-center">
                                    {isAdded ? (
                                      <Button size="sm" variant="ghost" disabled className="text-green-600">
                                        <Check className="h-4 w-4 mr-1" />
                                        Added
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddToWatchlist(company)}
                                        className="hover:bg-primary hover:text-primary-foreground"
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Watchlist
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-card border shadow-sm rounded-2xl px-5 py-4">
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

          {/* Input Area */}
          <div className="border-t bg-card p-4 flex-shrink-0">
            <div className="max-w-5xl mx-auto space-y-3">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about companies, analysis, comparisons, or pipeline performance..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>Try:</span>
                {suggestionChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleChipClick(chip)}
                    className="text-primary hover:underline"
                  >
                    &quot;{chip}&quot;{i < suggestionChips.length - 1 ? ',' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
