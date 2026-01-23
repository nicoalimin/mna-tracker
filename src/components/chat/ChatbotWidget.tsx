"use client";

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

// Get mock response based on keywords - same logic as AIDiscovery but adapted for widget
const getMockResponse = (query: string): { response: string; redirectToDiscovery?: boolean } => {
  const lowerQuery = query.toLowerCase();

  // DEEP DIVE ANALYSIS
  if (lowerQuery.includes('analyze') || lowerQuery.includes('deep dive') || lowerQuery.includes('review') ||
    lowerQuery.includes('assessment') || (lowerQuery.includes('evaluate') && !lowerQuery.includes('pipeline'))) {

    if (lowerQuery.includes('chiptech') || lowerQuery.includes('chip tech')) {
      return {
        response: `## 🔬 Deep Dive: ChipTech Solutions

### Company Overview
ChipTech Solutions is a leading semiconductor manufacturer specializing in custom IC design and fabrication services.

### Financial Performance
| Metric | 2023 | 2024 | 2025 | CAGR |
|--------|------|------|------|------|
| Revenue | $320M | $380M | $450M | **18.6%** |
| EBITDA | $48M | $57M | $72M | **22.5%** |

### Strengths
✅ Strong revenue growth (18.6% CAGR)
✅ Improving EBITDA margins
✅ Diversified customer base

### Risks
⚠️ Customer concentration: Top 3 = 45% revenue
⚠️ Capex intensive business model

### Recommendation
**🟢 ATTRACTIVE** - Strong growth with improving margins.`,
      };
    }

    if (lowerQuery.includes('medtech') || lowerQuery.includes('med tech')) {
      return {
        response: `## 🔬 Deep Dive: MedTech Innovations

### Company Overview
MedTech Innovations is a healthcare technology company focused on advanced diagnostic and monitoring devices.

### Financial Performance
| Metric | 2023 | 2024 | 2025 | CAGR |
|--------|------|------|------|------|
| Revenue | $280M | $330M | $380M | **16.5%** |
| EBITDA | $42M | $52.8M | $64.6M | **24.0%** |

### Strengths
✅ Robust margin expansion
✅ 35% recurring revenue
✅ Strong R&D pipeline

### Risks
⚠️ Regulatory approval delays possible
⚠️ Competition from large players

### Recommendation
**🟢 ATTRACTIVE** - Excellent margin expansion with recurring revenue.`,
      };
    }

    if (lowerQuery.includes('payflow')) {
      return {
        response: `## 🔬 Deep Dive: PayFlow Technologies

### Company Overview
PayFlow Technologies provides B2B payment processing and cash flow management solutions.

### Financial Performance
| Metric | 2023 | 2024 | 2025 | CAGR |
|--------|------|------|------|------|
| Revenue | $380M | $490M | $620M | **27.7%** |
| EBITDA | $57M | $78.4M | $105.4M | **36.0%** |

### Strengths
✅ Exceptional growth (27.7% CAGR)
✅ High net revenue retention (125%+)
✅ Platform stickiness

### Risks
⚠️ Valuation premium to peers
⚠️ Regulatory scrutiny increasing

### Recommendation
**🟡 MONITOR** - Excellent fundamentals but premium valuation.`,
      };
    }

    return {
      response: `I can provide detailed analysis on companies. Try:

🔬 **Available Deep Dives:**
• "Analyze ChipTech Solutions"
• "Deep dive MedTech Innovations"
• "Review PayFlow Technologies"`,
    };
  }

  // COMPARISON / SYNERGY
  if (lowerQuery.includes('compare') || lowerQuery.includes(' vs ') || lowerQuery.includes('versus') ||
    lowerQuery.includes('synergy') || lowerQuery.includes('synergies')) {

    if ((lowerQuery.includes('chiptech') && lowerQuery.includes('nano')) ||
      (lowerQuery.includes('chip') && lowerQuery.includes('silicon'))) {
      return {
        response: `## ⚖️ ChipTech vs NanoSilicon

### Financial Comparison
| Metric | ChipTech | NanoSilicon | Winner |
|--------|----------|-------------|--------|
| Revenue 2025 | $450M | $320M | 🏆 ChipTech |
| Revenue CAGR | 18.6% | 20.6% | 🏆 NanoSilicon |
| EBITDA 2025 | $72M | $51.2M | 🏆 ChipTech |
| Valuation | $900M | $640M | - |

### Synergy Potential
**Total Synergy Estimate:** $58-87M annually

### Recommendation
🎯 Acquire ChipTech first for scale, evaluate NanoSilicon as bolt-on in 18-24 months.`,
      };
    }

    return {
      response: `I can help compare companies or analyze synergies. Try:

⚖️ **Comparisons:**
• "Compare ChipTech vs NanoSilicon"
• "Healthcare sector comparison"

🤝 **Synergy Analysis:**
• "Synergy with semiconductor portfolio"`,
    };
  }

  // PIPELINE INSIGHTS
  if (lowerQuery.includes('pipeline') || lowerQuery.includes('funnel') || lowerQuery.includes('conversion') ||
    (lowerQuery.includes('performance') && !lowerQuery.includes('company')) || lowerQuery.includes('bottleneck')) {

    if (lowerQuery.includes('performance') || lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
      return {
        response: `## 📊 Pipeline Performance Summary

### Current Pipeline Status
| Stage | Companies | Conversion Rate |
|-------|-----------|-----------------|
| L0 - Sourcing | 12 | - |
| L1 - Screening | 5 | 42% |
| L2 - Initial Review | 4 | 80% |
| L3 - Deep Dive | 3 | 75% |
| L4 - Due Diligence | 2 | 67% |
| L5 - Closing | 1 | 50% |

### Key Metrics
• **Total Pipeline Value:** $2.4B
• **Avg. Time to Close:** 89 days
• **Overall Conversion:** 7.1%

### Recommendations
✅ Conversion rates above benchmarks
⚠️ Bottleneck at L1→L2 - refine criteria`,
      };
    }

    if (lowerQuery.includes('conversion') || lowerQuery.includes('rate')) {
      return {
        response: `## 📈 Conversion Rate Analysis

### Stage-by-Stage Funnel
| Transition | Rate | Trend |
|------------|------|-------|
| L0→L1 | 48% | 📈 +10pp |
| L1→L2 | 83% | 📈 +8pp |
| L2→L3 | 60% | 📈 +5pp |
| L3→L4 | 67% | 📈 +7pp |
| L4→L5 | 50% | 📈 +5pp |

### Insights
🎯 All stages showing improvement
⭐ Best improvement at L0→L1
📌 Focus area: L4→L5 closing`,
      };
    }

    if (lowerQuery.includes('bottleneck')) {
      return {
        response: `## 🔍 Bottleneck Analysis

### Time in Stage
| Stage | Avg. Days | Status |
|-------|-----------|--------|
| L0→L1 | 4.2 | 🟡 Slow |
| L1→L2 | 6.8 | 🟡 Slow |
| L4→L5 | 45.0 | 🔴 Critical |

### Critical Issues
**🔴 L4 Due Diligence (45 days)**
• Root Cause: Data collection delays
• Fix: Earlier data request at L3

### Action Items
1. ⚡ Deploy AI screening (-2 days)
2. 📅 Add mid-week IC slot (-3 days)
3. 📋 Create L3 data checklist (-10 days)`,
      };
    }

    return {
      response: `I can analyze your pipeline. Try:

📊 **Performance:**
• "Pipeline performance summary"
• "Show conversion rates"
• "Bottleneck analysis"`,
    };
  }

  // COMPANY DISCOVERY - Redirect to AI Discovery
  const discoveryKeywords = ['find', 'show', 'list', 'discover', 'search for', 'companies in',
    'semiconductor', 'healthcare', 'fintech', 'saas', 'clean energy', 'cleanenergy'];

  if (discoveryKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return {
      response: `To discover and browse companies with detailed financial data and the ability to add them directly to your pipeline, please use the full **AI Discovery** page.

Click the expand button (↗) above to open AI Discovery!`,
      redirectToDiscovery: true,
    };
  }

  // HELP
  if (lowerQuery.includes('help') || lowerQuery.includes('what can you')) {
    return {
      response: `I can help you with:

🔬 **Company Analysis**
• "Analyze ChipTech Solutions"
• "Deep dive MedTech"

⚖️ **Comparisons**
• "Compare ChipTech vs NanoSilicon"

📊 **Pipeline Insights**
• "Pipeline performance summary"
• "Show conversion rates"
• "Bottleneck analysis"

🔍 **Company Discovery**
For browsing and adding companies, use the full AI Discovery page (click ↗ above)`,
    };
  }

  // Default
  return {
    response: `I'm your M&A assistant! I can help with:

• **Deep dives**: "Analyze ChipTech"
• **Comparisons**: "Compare ChipTech vs NanoSilicon"
• **Pipeline insights**: "Pipeline performance"

For company discovery with data tables, use the full AI Discovery page (click ↗).`,
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
      content: `Hi! I'm your M&A assistant. I can help with:

• **Company deep dives** - "Analyze ChipTech"
• **Comparisons** - "Compare companies"  
• **Pipeline insights** - "Performance summary"

For company discovery tables, click ↗ to open AI Discovery.`,
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
      const { response, redirectToDiscovery } = getMockResponse(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        redirectToDiscovery,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800);
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
