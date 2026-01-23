'use client';

import { useState, useRef, useEffect } from 'react';
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

// Helper function to search companies from Supabase
const searchCompanies = async (query: string): Promise<{ response: string; companies?: CompanyResult[] }> => {
  const lowerQuery = query.toLowerCase();

  // Check for segment-based search keywords
  const segmentKeywords: Record<string, string[]> = {
    'Technology': ['technology', 'tech', 'software', 'saas', 'cloud'],
    'Healthcare': ['healthcare', 'health', 'medical', 'pharma'],
    'Financial': ['financial', 'fintech', 'banking', 'finance'],
    'Industrial': ['industrial', 'manufacturing', 'automation'],
    'Consumer': ['consumer', 'retail', 'commerce'],
    'Energy': ['energy', 'power', 'utilities', 'renewable'],
  };

  let segmentFilter: string | null = null;
  for (const [segment, keywords] of Object.entries(segmentKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      segmentFilter = segment;
      break;
    }
  }

  // Search in database
  let query_builder = supabase
    .from('companies')
    .select(`
      id,
      target,
      segment,
      revenue_2021_usd_mn,
      revenue_2022_usd_mn,
      revenue_2023_usd_mn,
      revenue_2024_usd_mn,
      ebitda_2021_usd_mn,
      ebitda_2022_usd_mn,
      ebitda_2023_usd_mn,
      ebitda_2024_usd_mn,
      ev_2024
    `)
    .limit(10);

  if (segmentFilter) {
    query_builder = query_builder.ilike('segment', `%${segmentFilter}%`);
  }

  const { data: companies, error } = await query_builder;

  if (error) {
    console.error('Error searching companies:', error);
    return {
      response: 'Sorry, there was an error searching for companies. Please try again.',
    };
  }

  if (!companies || companies.length === 0) {
    return {
      response: segmentFilter
        ? `No companies found in the **${segmentFilter}** segment. Try a different search or import data first.`
        : 'No companies found matching your search. Try searching by segment like "technology companies" or "healthcare companies".',
    };
  }

  return {
    response: `I found **${companies.length} companies** matching your search:`,
    companies: companies,
  };
};

// Get response based on query - fetches from Supabase for company searches
const getResponse = async (query: string): Promise<{ response: string; companies?: CompanyResult[] }> => {
  const lowerQuery = query.toLowerCase();

  // Help command
  if (lowerQuery.includes('help') || lowerQuery === 'hi' || lowerQuery === 'hello') {
    return {
      response: `I can help you discover and analyze companies from your database.

**Company Discovery**
Search by segment:
- "Find technology companies"
- "Show healthcare companies"
- "Search financial companies"

**Browse All**
- "Show all companies"
- "List companies"

Your data is pulled directly from Supabase. Import companies through the Master Data page to see them here.`,
    };
  }

  // Show all companies
  if (lowerQuery.includes('all') || lowerQuery.includes('list') || lowerQuery.includes('show')) {
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        id,
        target,
        segment,
        revenue_2021_usd_mn,
        revenue_2022_usd_mn,
        revenue_2023_usd_mn,
        revenue_2024_usd_mn,
        ebitda_2021_usd_mn,
        ebitda_2022_usd_mn,
        ebitda_2023_usd_mn,
        ebitda_2024_usd_mn,
        ev_2024
      `)
      .limit(20);

    if (error) {
      return { response: 'Error fetching companies. Please try again.' };
    }

    if (!companies || companies.length === 0) {
      return { response: 'No companies in the database yet. Import data through the Master Data page.' };
    }

    return {
      response: `Here are **${companies.length} companies** from your database:`,
      companies: companies,
    };
  }

  // Default: try to search companies
  return searchCompanies(query);
};

const initialMessage: Message = {
  id: '1',
  role: 'assistant',
  content: `Hello! I'm your M&A discovery assistant. I can help you find companies from your Supabase database.

**Try searching:**
- "Show all companies"
- "Find technology companies"
- "Search healthcare companies"

Data is pulled directly from Supabase. Import companies through the Master Data page to see them here.`,
};

const suggestionChips = [
  "show all companies",
  "technology companies",
  "healthcare companies",
];

export default function AIDiscovery() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedCompanies, setAddedCompanies] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { response, companies } = await getResponse(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        companies,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
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
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
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
