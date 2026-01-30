'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, Lightbulb } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';

// Define initial message manually to match structure
const initialMessages: any[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: `# Welcome to M&A AI Discovery

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

Just ask your question and I'll analyze the data for you!`
      }
    ],
  },
];

const suggestionChips = [
  "show all companies",
  "get statistics by segment",
  "find companies with revenue > 100M",
];

export default function AIDiscovery() {
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
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden bg-background rounded-xl border border-border shadow-sm flex flex-col relative">
          <ChatWindow
            endpoint="/api/chat"
            emoji="🤖"
            placeholder="Ask about companies, analysis, comparisons..."
            showIntermediateStepsToggle={true}
            initialMessages={initialMessages}
            emptyStateComponent={
              <div className="flex flex-col items-center justify-center h-full sm:p-8 p-4 text-center mt-12">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Try:</span>
                  {suggestionChips.map((chip, i) => (
                    <span
                      key={i}
                      className="bg-muted px-2 py-1 rounded-md border border-border"
                    >
                      &quot;{chip}&quot;
                    </span>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

