import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  companies?: MockCompany[];
}

interface MockCompany {
  id: string;
  name: string;
  sector: string;
  revenue_year1: number;
  revenue_year2: number;
  revenue_year3: number;
  ebitda_year1: number;
  ebitda_year2: number;
  ebitda_year3: number;
  valuation: number;
  added?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

// Mock company data by sector
const mockCompanyData: Record<string, MockCompany[]> = {
  semiconductor: [
    { id: 'semi-1', name: 'ChipTech Solutions', sector: 'Semiconductor', revenue_year1: 320000000, revenue_year2: 380000000, revenue_year3: 450000000, ebitda_year1: 48000000, ebitda_year2: 57000000, ebitda_year3: 72000000, valuation: 900000000 },
    { id: 'semi-2', name: 'NanoSilicon Corp', sector: 'Semiconductor', revenue_year1: 220000000, revenue_year2: 270000000, revenue_year3: 320000000, ebitda_year1: 33000000, ebitda_year2: 40500000, ebitda_year3: 51200000, valuation: 640000000 },
    { id: 'semi-3', name: 'Quantum Chips Inc', sector: 'Semiconductor', revenue_year1: 180000000, revenue_year2: 230000000, revenue_year3: 280000000, ebitda_year1: 27000000, ebitda_year2: 34500000, ebitda_year3: 44800000, valuation: 560000000 },
    { id: 'semi-4', name: 'MicroWave Systems', sector: 'Semiconductor', revenue_year1: 150000000, revenue_year2: 170000000, revenue_year3: 195000000, ebitda_year1: 22500000, ebitda_year2: 25500000, ebitda_year3: 31200000, valuation: 390000000 },
    { id: 'semi-5', name: 'Silicon Dynamics', sector: 'Semiconductor', revenue_year1: 280000000, revenue_year2: 350000000, revenue_year3: 410000000, ebitda_year1: 42000000, ebitda_year2: 52500000, ebitda_year3: 65600000, valuation: 820000000 },
  ],
  healthcare: [
    { id: 'health-1', name: 'MedTech Innovations', sector: 'Healthcare', revenue_year1: 280000000, revenue_year2: 330000000, revenue_year3: 380000000, ebitda_year1: 42000000, ebitda_year2: 52800000, ebitda_year3: 64600000, valuation: 760000000 },
    { id: 'health-2', name: 'BioHealth Systems', sector: 'Healthcare', revenue_year1: 400000000, revenue_year2: 460000000, revenue_year3: 520000000, ebitda_year1: 60000000, ebitda_year2: 73600000, ebitda_year3: 88400000, valuation: 1040000000 },
    { id: 'health-3', name: 'HealthCore Analytics', sector: 'Healthcare', revenue_year1: 100000000, revenue_year2: 135000000, revenue_year3: 175000000, ebitda_year1: 15000000, ebitda_year2: 21600000, ebitda_year3: 29750000, valuation: 350000000 },
    { id: 'health-4', name: 'Precision Medicine Co', sector: 'Healthcare', revenue_year1: 200000000, revenue_year2: 245000000, revenue_year3: 290000000, ebitda_year1: 30000000, ebitda_year2: 39200000, ebitda_year3: 49300000, valuation: 580000000 },
  ],
  fintech: [
    { id: 'fin-1', name: 'PayFlow Technologies', sector: 'Fintech', revenue_year1: 380000000, revenue_year2: 490000000, revenue_year3: 620000000, ebitda_year1: 57000000, ebitda_year2: 78400000, ebitda_year3: 105400000, valuation: 1240000000 },
    { id: 'fin-2', name: 'CryptoSecure Inc', sector: 'Fintech', revenue_year1: 120000000, revenue_year2: 190000000, revenue_year3: 280000000, ebitda_year1: 18000000, ebitda_year2: 30400000, ebitda_year3: 47600000, valuation: 560000000 },
    { id: 'fin-3', name: 'LendingAI Corp', sector: 'Fintech', revenue_year1: 220000000, revenue_year2: 280000000, revenue_year3: 340000000, ebitda_year1: 33000000, ebitda_year2: 44800000, ebitda_year3: 57800000, valuation: 680000000 },
    { id: 'fin-4', name: 'InsureTech Solutions', sector: 'Fintech', revenue_year1: 130000000, revenue_year2: 160000000, revenue_year3: 195000000, ebitda_year1: 19500000, ebitda_year2: 25600000, ebitda_year3: 33150000, valuation: 390000000 },
  ],
  cleanenergy: [
    { id: 'energy-1', name: 'SolarMax Industries', sector: 'Clean Energy', revenue_year1: 250000000, revenue_year2: 340000000, revenue_year3: 420000000, ebitda_year1: 37500000, ebitda_year2: 54400000, ebitda_year3: 71400000, valuation: 840000000 },
    { id: 'energy-2', name: 'WindPower Corp', sector: 'Clean Energy', revenue_year1: 180000000, revenue_year2: 230000000, revenue_year3: 290000000, ebitda_year1: 27000000, ebitda_year2: 36800000, ebitda_year3: 49300000, valuation: 580000000 },
    { id: 'energy-3', name: 'GreenBattery Tech', sector: 'Clean Energy', revenue_year1: 150000000, revenue_year2: 210000000, revenue_year3: 280000000, ebitda_year1: 22500000, ebitda_year2: 33600000, ebitda_year3: 47600000, valuation: 560000000 },
  ],
  saas: [
    { id: 'saas-1', name: 'CloudNative Systems', sector: 'SaaS', revenue_year1: 320000000, revenue_year2: 420000000, revenue_year3: 510000000, ebitda_year1: 48000000, ebitda_year2: 67200000, ebitda_year3: 86700000, valuation: 1020000000 },
    { id: 'saas-2', name: 'DataStream AI', sector: 'SaaS', revenue_year1: 140000000, revenue_year2: 210000000, revenue_year3: 290000000, ebitda_year1: 21000000, ebitda_year2: 33600000, ebitda_year3: 49300000, valuation: 580000000 },
    { id: 'saas-3', name: 'WorkflowPro Inc', sector: 'SaaS', revenue_year1: 100000000, revenue_year2: 130000000, revenue_year3: 165000000, ebitda_year1: 15000000, ebitda_year2: 20800000, ebitda_year3: 28050000, valuation: 330000000 },
  ],
};

// Get mock response based on keywords
const getMockResponse = (query: string): { response: string; companies?: MockCompany[] } => {
  const lowerQuery = query.toLowerCase();

  // DEEP DIVE ANALYSIS - Keywords: analyze, deep dive, review, assessment, evaluate company
  if (lowerQuery.includes('analyze') || lowerQuery.includes('deep dive') || lowerQuery.includes('review') ||
    lowerQuery.includes('assessment') || (lowerQuery.includes('evaluate') && !lowerQuery.includes('pipeline'))) {

    if (lowerQuery.includes('chiptech') || lowerQuery.includes('chip tech')) {
      return {
        response: `## 🔬 Deep Dive: ChipTech Solutions

### Company Overview
ChipTech Solutions is a leading semiconductor manufacturer specializing in custom IC design and fabrication services. Founded in 2015, the company has grown to become a key supplier for automotive and IoT applications.

### Financial Performance
| Metric | 2023 | 2024 | 2025 | CAGR |
|--------|------|------|------|------|
| Revenue | $320M | $380M | $450M | **18.6%** |
| EBITDA | $48M | $57M | $72M | **22.5%** |
| EBITDA Margin | 15.0% | 15.0% | 16.0% | +1.0pp |

### Strengths
✅ Strong revenue growth (18.6% CAGR)
✅ Improving EBITDA margins
✅ Diversified customer base (automotive, IoT, industrial)
✅ Proprietary manufacturing process

### Risks
⚠️ Customer concentration: Top 3 customers = 45% revenue
⚠️ Capex intensive business model
⚠️ Exposure to semiconductor cycle volatility

### Valuation Analysis
• **Current Valuation:** $900M
• **EV/Revenue (2025):** 2.0x
• **EV/EBITDA (2025):** 12.5x
• **Comparable Median:** 14.0x EV/EBITDA
• **Implied Upside:** ~12%

### Recommendation
**🟢 ATTRACTIVE** - Strong growth profile with improving margins. Valuation is reasonable compared to peers.`,
      };
    }

    if (lowerQuery.includes('medtech') || lowerQuery.includes('med tech')) {
      return {
        response: `## 🔬 Deep Dive: MedTech Innovations

### Company Overview
MedTech Innovations is a healthcare technology company focused on developing advanced diagnostic and monitoring devices. The company serves hospitals, clinics, and home healthcare markets.

### Financial Performance
| Metric | 2023 | 2024 | 2025 | CAGR |
|--------|------|------|------|------|
| Revenue | $280M | $330M | $380M | **16.5%** |
| EBITDA | $42M | $52.8M | $64.6M | **24.0%** |
| EBITDA Margin | 15.0% | 16.0% | 17.0% | +2.0pp |

### Strengths
✅ Robust margin expansion trajectory
✅ Recurring revenue from device subscriptions (35% of revenue)
✅ Strong R&D pipeline with 3 FDA approvals pending
✅ Established relationships with major hospital networks

### Risks
⚠️ Regulatory approval delays possible
⚠️ Reimbursement policy changes could impact pricing
⚠️ Competition from large medical device companies

### Valuation Analysis
• **Current Valuation:** $760M
• **EV/Revenue (2025):** 2.0x
• **EV/EBITDA (2025):** 11.8x
• **Healthcare Sector Median:** 13.5x EV/EBITDA
• **Implied Upside:** ~14%

### Recommendation
**🟢 ATTRACTIVE** - Excellent margin expansion with strong recurring revenue base. R&D pipeline provides growth optionality.`,
      };
    }

    if (lowerQuery.includes('payflow')) {
      return {
        response: `## 🔬 Deep Dive: PayFlow Technologies

### Company Overview
PayFlow Technologies is a fintech company providing B2B payment processing and cash flow management solutions. The company targets mid-market enterprises with its integrated payment platform.

### Financial Performance
| Metric | 2023 | 2024 | 2025 | CAGR |
|--------|------|------|------|------|
| Revenue | $380M | $490M | $620M | **27.7%** |
| EBITDA | $57M | $78.4M | $105.4M | **36.0%** |
| EBITDA Margin | 15.0% | 16.0% | 17.0% | +2.0pp |

### Strengths
✅ Exceptional growth trajectory (27.7% revenue CAGR)
✅ Strong operating leverage driving margin expansion
✅ High net revenue retention (125%+)
✅ Platform stickiness through integrations

### Risks
⚠️ Valuation premium to peers
⚠️ Regulatory scrutiny in payments space increasing
⚠️ Large fintech players entering mid-market segment

### Valuation Analysis
• **Current Valuation:** $1.24B
• **EV/Revenue (2025):** 2.0x
• **EV/EBITDA (2025):** 11.8x
• **Fintech Sector Median:** 15.0x EV/EBITDA
• **Implied Upside:** ~27%

### Recommendation
**🟡 MONITOR** - Excellent fundamentals but valuation is at premium. Wait for better entry point or negotiate deal terms carefully.`,
      };
    }

    // Generic deep dive response
    return {
      response: `I can provide detailed analysis on companies in our database. Try:

🔬 **Available Deep Dives:**
• "Analyze ChipTech Solutions"
• "Deep dive MedTech Innovations"
• "Review PayFlow Technologies"

I'll provide comprehensive analysis including:
• Financial performance & trends
• Strengths and risks assessment
• Valuation analysis
• Investment recommendation`,
    };
  }

  // COMPARISON / SYNERGY - Keywords: compare, vs, versus, synergy, fit, integration
  if (lowerQuery.includes('compare') || lowerQuery.includes(' vs ') || lowerQuery.includes('versus') ||
    lowerQuery.includes('synergy') || lowerQuery.includes('synergies') || lowerQuery.includes('fit with') ||
    lowerQuery.includes('integration')) {

    if ((lowerQuery.includes('chiptech') && lowerQuery.includes('nano')) ||
      (lowerQuery.includes('chip') && lowerQuery.includes('silicon'))) {
      return {
        response: `## ⚖️ Company Comparison: ChipTech Solutions vs NanoSilicon Corp

### Overview Comparison
| Attribute | ChipTech Solutions | NanoSilicon Corp |
|-----------|-------------------|------------------|
| Sector | Semiconductor | Semiconductor |
| Specialization | Custom IC Design | Advanced Materials |
| Target Market | Automotive, IoT | Consumer Electronics |

### Financial Comparison
| Metric | ChipTech | NanoSilicon | Winner |
|--------|----------|-------------|--------|
| Revenue 2025 | $450M | $320M | 🏆 ChipTech |
| Revenue CAGR | 18.6% | 20.6% | 🏆 NanoSilicon |
| EBITDA 2025 | $72M | $51.2M | 🏆 ChipTech |
| EBITDA Margin | 16.0% | 16.0% | Tie |
| Valuation | $900M | $640M | - |
| EV/EBITDA | 12.5x | 12.5x | Tie |

### Synergy Potential with Portfolio
Assuming existing semiconductor holdings:

**Revenue Synergies:** 
• Combined go-to-market could unlock $25-40M additional revenue
• Cross-selling opportunities in automotive segment

**Cost Synergies:**
• Shared manufacturing capacity: $15-20M annual savings
• Combined procurement leverage: $8-12M savings
• G&A consolidation: $10-15M savings

**Total Synergy Estimate:** $58-87M annually (7-10% of combined revenue)

### Recommendation
**ChipTech Solutions** offers better absolute scale and synergy potential, while **NanoSilicon Corp** provides higher growth rate at lower valuation.

🎯 **Suggested Strategy:** Acquire ChipTech first for scale, evaluate NanoSilicon as bolt-on in 18-24 months.`,
      };
    }

    if (lowerQuery.includes('synergy') && lowerQuery.includes('semiconductor')) {
      return {
        response: `## 🤝 Synergy Analysis: Semiconductor Portfolio

### Current Portfolio Composition
Assuming your portfolio includes holdings in semiconductor manufacturing and distribution.

### Synergy Matrix with Potential Targets

| Target Company | Revenue Synergy | Cost Synergy | Integration Risk | Score |
|----------------|-----------------|--------------|------------------|-------|
| ChipTech Solutions | High | High | Medium | ⭐⭐⭐⭐⭐ |
| NanoSilicon Corp | Medium | High | Low | ⭐⭐⭐⭐ |
| Quantum Chips Inc | High | Medium | High | ⭐⭐⭐ |
| MicroWave Systems | Low | High | Low | ⭐⭐⭐ |
| Silicon Dynamics | Medium | Medium | Medium | ⭐⭐⭐ |

### Top Synergy Opportunity: ChipTech Solutions

**Why ChipTech is the best fit:**
1. **Complementary customer base** - Automotive focus complements your industrial exposure
2. **Manufacturing synergies** - Shared fab capacity could reduce COGS by 8-12%
3. **R&D efficiency** - Combined IP portfolio accelerates product development
4. **Go-to-market leverage** - Cross-selling potential worth $30-50M annually

### Estimated Synergy Value
| Synergy Type | Year 1 | Year 2 | Year 3 | NPV |
|--------------|--------|--------|--------|-----|
| Revenue | $15M | $35M | $50M | $75M |
| Cost | $20M | $35M | $40M | $70M |
| **Total** | $35M | $70M | $90M | **$145M** |

### Integration Considerations
⚠️ Manufacturing integration requires $50M capex
⚠️ Key talent retention critical (identify top 50 employees)
⚠️ Customer communication plan essential`,
      };
    }

    if (lowerQuery.includes('healthcare') && lowerQuery.includes('comparison')) {
      return {
        response: `## ⚖️ Healthcare Sector Comparison

### Company Overview
| Company | Specialization | Rev 2025 | EBITDA 2025 | Valuation |
|---------|---------------|----------|-------------|-----------|
| MedTech Innovations | Diagnostics | $380M | $64.6M | $760M |
| BioHealth Systems | Medical Devices | $520M | $88.4M | $1.04B |
| HealthCore Analytics | Data Analytics | $175M | $29.8M | $350M |
| Precision Medicine Co | Personalized Rx | $290M | $49.3M | $580M |

### Growth Comparison
| Company | Revenue CAGR | EBITDA CAGR | Margin Trend |
|---------|--------------|-------------|--------------|
| MedTech Innovations | 16.5% | 24.0% | Expanding |
| BioHealth Systems | 14.0% | 21.4% | Expanding |
| HealthCore Analytics | 32.3% | 40.9% | Expanding |
| Precision Medicine Co | 20.4% | 28.2% | Expanding |

### Valuation Comparison
| Company | EV/Revenue | EV/EBITDA | vs Sector Avg |
|---------|------------|-----------|---------------|
| MedTech Innovations | 2.0x | 11.8x | -13% |
| BioHealth Systems | 2.0x | 11.8x | -13% |
| HealthCore Analytics | 2.0x | 11.7x | -14% |
| Precision Medicine Co | 2.0x | 11.8x | -13% |

### Recommendation Ranking
1. **🥇 HealthCore Analytics** - Highest growth, most attractive valuation
2. **🥈 MedTech Innovations** - Strong margins, proven recurring revenue
3. **🥉 Precision Medicine Co** - Attractive growth with moderate scale
4. **BioHealth Systems** - Good company but size may limit synergies`,
      };
    }

    // Generic comparison response
    return {
      response: `I can help you compare companies or analyze synergies with your portfolio. Try:

⚖️ **Company Comparisons:**
• "Compare ChipTech vs NanoSilicon"
• "Healthcare sector comparison"

🤝 **Synergy Analysis:**
• "Synergy with our semiconductor portfolio"
• "Evaluate fit with existing holdings"

I'll analyze:
• Financial performance comparison
• Synergy potential (revenue & cost)
• Integration considerations
• Investment recommendations`,
    };
  }

  // PIPELINE INSIGHTS - Keywords: pipeline, funnel, conversion, performance, bottleneck, stage, metrics
  if (lowerQuery.includes('pipeline') || lowerQuery.includes('funnel') || lowerQuery.includes('conversion') ||
    (lowerQuery.includes('performance') && !lowerQuery.includes('company')) || lowerQuery.includes('bottleneck') ||
    lowerQuery.includes('stage analysis') || lowerQuery.includes('deal flow')) {

    if (lowerQuery.includes('performance') || lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
      return {
        response: `## 📊 Pipeline Performance Summary

### Current Pipeline Status
| Stage | Companies | Avg. Days in Stage | Conversion Rate |
|-------|-----------|-------------------|-----------------|
| L0 - Sourcing | 12 | 4.2 days | - |
| L1 - Screening | 5 | 6.8 days | 42% |
| L2 - Initial Review | 4 | 12.5 days | 80% |
| L3 - Deep Dive | 3 | 21.3 days | 75% |
| L4 - Due Diligence | 2 | 45.0 days | 67% |
| L5 - Closing | 1 | 30.0 days | 50% |

### Key Metrics (Last 90 Days)
| Metric | Value | vs Previous Period |
|--------|-------|-------------------|
| Total Deals Sourced | 28 | +17% |
| Deals Closed | 2 | +100% |
| Avg. Time to Close | 89 days | -12% |
| Overall Conversion (L0→L5) | 7.1% | +2.1pp |
| Pipeline Value | $2.4B | +34% |

### Performance by Source
| Source | Deals | Conversion | Avg. Deal Size |
|--------|-------|------------|----------------|
| Outbound | 18 | 5.6% | $420M |
| Inbound | 8 | 12.5% | $280M |
| Market Screening | 2 | 0% (early stage) | $350M |

### Recommendations
✅ **Strong performance** - Conversion rates above industry benchmarks
⚠️ **Bottleneck at L1→L2** - Consider refining screening criteria
💡 **Opportunity** - Inbound deals showing 2x conversion rate`,
      };
    }

    if (lowerQuery.includes('conversion') || lowerQuery.includes('rate')) {
      return {
        response: `## 📈 Conversion Rate Analysis

### Stage-by-Stage Conversion Funnel
\`\`\`
L0 (Sourcing)      ████████████████████ 100% (28 deals)
                            │ 42% pass
L1 (Screening)     ████████░░░░░░░░░░░░  42% (12 deals)
                            │ 83% pass
L2 (Initial Review)██████░░░░░░░░░░░░░░  35% (10 deals)
                            │ 60% pass
L3 (Deep Dive)     ████░░░░░░░░░░░░░░░░  21% (6 deals)
                            │ 67% pass
L4 (Due Diligence) ███░░░░░░░░░░░░░░░░░  14% (4 deals)
                            │ 50% pass
L5 (Closing)       ██░░░░░░░░░░░░░░░░░░   7% (2 deals)
\`\`\`

### Conversion Rate Trends (12 Weeks)
| Stage | Week 1-4 | Week 5-8 | Week 9-12 | Trend |
|-------|----------|----------|-----------|-------|
| L0→L1 | 38% | 40% | 48% | 📈 +10pp |
| L1→L2 | 75% | 82% | 83% | 📈 +8pp |
| L2→L3 | 55% | 58% | 60% | 📈 +5pp |
| L3→L4 | 60% | 65% | 67% | 📈 +7pp |
| L4→L5 | 45% | 48% | 50% | 📈 +5pp |

### Insights
🎯 **All stages showing improvement** - Process refinements working
⭐ **Best improvement at L0→L1** - AI screening criteria effective
📌 **Focus area: L4→L5** - Due diligence to closing still lowest`,
      };
    }

    if (lowerQuery.includes('bottleneck') || lowerQuery.includes('analysis') || lowerQuery.includes('issue')) {
      return {
        response: `## 🔍 Stage Bottleneck Analysis

### Time in Stage Analysis
| Stage | Avg. Days | Target | Status | Issue |
|-------|-----------|--------|--------|-------|
| L0→L1 | 4.2 | 3.0 | 🟡 Slow | +40% over target |
| L1→L2 | 6.8 | 5.0 | 🟡 Slow | +36% over target |
| L2→L3 | 12.5 | 14.0 | 🟢 Good | Within target |
| L3→L4 | 21.3 | 21.0 | 🟢 Good | Within target |
| L4→L5 | 45.0 | 30.0 | 🔴 Critical | +50% over target |

### Identified Bottlenecks

**🔴 Critical: L4 Due Diligence (45 days avg)**
• **Root Cause:** Financial data collection delays
• **Impact:** 2 deals currently stuck > 60 days
• **Recommendation:** Implement earlier data request at L3

**🟡 Moderate: L0→L1 Transition (4.2 days avg)**
• **Root Cause:** Manual screening backlog
• **Impact:** 8 deals waiting for screening
• **Recommendation:** Increase AI screening automation

**🟡 Moderate: L1→L2 Transition (6.8 days avg)**
• **Root Cause:** IC calendar availability
• **Impact:** Weekly IC meeting causing delays
• **Recommendation:** Consider bi-weekly IC for L2 approvals

### Action Items
1. ⚡ Deploy AI screening for L0→L1 (Est. -2 days)
2. 📅 Add mid-week IC slot (Est. -3 days for L1→L2)
3. 📋 Create L3 data checklist (Est. -10 days for L4)

**Total Estimated Impact:** -15 days from cycle time`,
      };
    }

    // Generic pipeline response
    return {
      response: `I can help you analyze your pipeline performance. Try:

📊 **Performance Metrics:**
• "Pipeline performance summary"
• "Show conversion rates"
• "Stage bottleneck analysis"

I'll provide insights on:
• Deal flow and conversion rates
• Stage-by-stage performance
• Bottleneck identification
• Actionable recommendations`,
    };
  }

  // COMPANY DISCOVERY - Keywords: find, search, show me, look for, companies
  if (lowerQuery.includes('semiconductor') || lowerQuery.includes('chip')) {
    return {
      response: "I found **5 semiconductor companies** matching your search. Here's the complete financial data:",
      companies: mockCompanyData.semiconductor,
    };
  }

  if (lowerQuery.includes('healthcare') || lowerQuery.includes('medical') || lowerQuery.includes('health')) {
    return {
      response: "I found **4 healthcare companies** with their complete financial data:",
      companies: mockCompanyData.healthcare,
    };
  }

  if (lowerQuery.includes('fintech') || lowerQuery.includes('financial') || lowerQuery.includes('banking')) {
    return {
      response: "I found **4 fintech companies** matching your criteria:",
      companies: mockCompanyData.fintech,
    };
  }

  if (lowerQuery.includes('clean energy') || lowerQuery.includes('renewable') || lowerQuery.includes('solar') || lowerQuery.includes('green')) {
    return {
      response: "I found **3 clean energy companies** with strong growth potential:",
      companies: mockCompanyData.cleanenergy,
    };
  }

  if (lowerQuery.includes('saas') || lowerQuery.includes('software') || lowerQuery.includes('cloud')) {
    return {
      response: "I found **3 SaaS companies** matching your search:",
      companies: mockCompanyData.saas,
    };
  }

  // Default response with all capabilities
  return {
    response: `I can help you with M&A analysis across multiple areas:

🔍 **Company Discovery**
• "Find semiconductor companies"
• "Show me healthcare companies"
• "Search fintech companies"

🔬 **Deep Dive Analysis**
• "Analyze ChipTech Solutions"
• "Deep dive MedTech Innovations"
• "Review PayFlow Technologies"

⚖️ **Comparison & Synergy**
• "Compare ChipTech vs NanoSilicon"
• "Synergy with our semiconductor portfolio"
• "Healthcare sector comparison"

📊 **Pipeline Insights**
• "Pipeline performance summary"
• "Show conversion rates"
• "Stage bottleneck analysis"`,
  };
};

const initialMessage: Message = {
  id: '1',
  role: 'assistant',
  content: `Hello! I'm your M&A discovery assistant. I can help you with:

🔍 **Company Discovery** - Find acquisition targets by sector
🔬 **Deep Dive Analysis** - Detailed company assessments
⚖️ **Comparison & Synergy** - Compare companies, evaluate fit
📊 **Pipeline Insights** - Performance metrics and bottlenecks

💡 **Try asking:**
• "Find semiconductor companies"
• "Analyze ChipTech Solutions"
• "Compare ChipTech vs NanoSilicon"
• "Pipeline performance summary"`,
};

const suggestionChips = [
  "semiconductor companies",
  "analyze ChipTech",
  "pipeline performance",
];

export default function AIDiscovery() {
  const navigate = useNavigate();
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

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const { response, companies } = getMockResponse(input);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      companies,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
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

  const handleAddToL0 = async (company: MockCompany) => {
    try {
      // Insert company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: company.name,
          sector: company.sector,
          source: 'outbound',
          revenue_year1: company.revenue_year1,
          revenue_year2: company.revenue_year2,
          revenue_year3: company.revenue_year3,
          ebitda_year1: company.ebitda_year1,
          ebitda_year2: company.ebitda_year2,
          ebitda_year3: company.ebitda_year3,
          valuation: company.valuation,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create deal
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert({
          company_id: companyData.id,
          current_stage: 'L0',
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Create stage history
      await supabase.from('deal_stage_history').insert({
        deal_id: dealData.id,
        stage: 'L0',
      });

      setAddedCompanies(prev => new Set([...prev, company.id]));
      toast.success(`${company.name} added to L0 pipeline`);
    } catch (error: any) {
      console.error('Error adding company:', error);
      toast.error('Failed to add company to pipeline');
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
                              <TableHead>Sector</TableHead>
                              <TableHead className="text-right">Rev 2023</TableHead>
                              <TableHead className="text-right">Rev 2024</TableHead>
                              <TableHead className="text-right">Rev 2025</TableHead>
                              <TableHead className="text-right">EBITDA 2023</TableHead>
                              <TableHead className="text-right">EBITDA 2024</TableHead>
                              <TableHead className="text-right">EBITDA 2025</TableHead>
                              <TableHead className="text-right">Valuation</TableHead>
                              <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {message.companies.map((company) => {
                              const isAdded = addedCompanies.has(company.id);
                              return (
                                <TableRow key={company.id}>
                                  <TableCell className="font-medium">{company.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{company.sector}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.revenue_year1)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.revenue_year2)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.revenue_year3)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.ebitda_year1)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.ebitda_year2)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.ebitda_year3)}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(company.valuation)}</TableCell>
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
                                        onClick={() => handleAddToL0(company)}
                                        className="hover:bg-primary hover:text-primary-foreground"
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add to L0
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
                    "{chip}"{i < suggestionChips.length - 1 ? ',' : ''}
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
