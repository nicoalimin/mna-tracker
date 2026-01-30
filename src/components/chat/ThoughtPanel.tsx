'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Calculator, Search, Database, FileText, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThoughtStep {
  type: 'tool_start' | 'tool_end';
  tool: string;
  input?: any;
  output?: any;
  timestamp: number;
}

interface ThoughtPanelProps {
  steps: ThoughtStep[];
}

const getToolIcon = (toolName: string) => {
  const name = toolName.toLowerCase();
  if (name.includes('query_companies') || name.includes('get_company')) return <Database className="h-3.5 w-3.5" />;
  if (name.includes('web_search')) return <Globe className="h-3.5 w-3.5" />;
  if (name.includes('stats')) return <Calculator className="h-3.5 w-3.5" />;
  if (name.includes('notes')) return <FileText className="h-3.5 w-3.5" />;
  return <Search className="h-3.5 w-3.5" />;
};

const formatToolName = (name: string) => {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function ThoughtPanel({ steps }: ThoughtPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0) return null;

  // Group steps by tool
  const toolGroups: Record<string, { start?: ThoughtStep; end?: ThoughtStep }> = {};
  steps.forEach(step => {
    const key = `${step.tool}-${step.timestamp}`; // Simplistic key, in reality might need more
    if (!toolGroups[step.tool]) toolGroups[step.tool] = {};
    if (step.type === 'tool_start') toolGroups[step.tool].start = step;
    else toolGroups[step.tool].end = step;
  });

  return (
    <div className="my-2 border rounded-lg bg-muted/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <span>Agent Thinking Process ({steps.filter(s => s.type === 'tool_start').length} tools)</span>
        </div>
        {!isExpanded && (
          <div className="flex -space-x-1">
            {Object.keys(toolGroups).slice(0, 3).map((tool, i) => (
              <div key={i} className="h-5 w-5 rounded-full bg-background border flex items-center justify-center">
                {getToolIcon(tool)}
              </div>
            ))}
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="px-3 py-2 space-y-3 border-t bg-background/50">
          {steps.filter(s => s.type === 'tool_start').map((startStep, idx) => {
            const endStep = steps.find(s => s.type === 'tool_end' && s.tool === startStep.tool && s.timestamp >= startStep.timestamp);
            const isProcessing = !endStep;

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    "h-5 w-5 rounded flex items-center justify-center",
                    isProcessing ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-blue-100 text-blue-600"
                  )}>
                    {getToolIcon(startStep.tool)}
                  </div>
                  <span className="font-semibold">{formatToolName(startStep.tool)}</span>
                  {isProcessing && <span className="text-[10px] text-amber-500 italic">Processing...</span>}
                </div>

                <div className="ml-7 space-y-1">
                  <div className="text-[10px] text-muted-foreground bg-muted/40 rounded p-1.5 font-mono break-all">
                    <span className="opacity-50 font-sans">Input: </span>
                    {JSON.stringify(startStep.input)}
                  </div>

                  {endStep && (
                    <div className="text-[10px] text-muted-foreground bg-green-50/50 dark:bg-green-900/10 rounded p-1.5 font-mono break-all border border-green-100/50 dark:border-green-900/20">
                      <span className="opacity-50 font-sans">Output: </span>
                      {typeof endStep.output === 'string'
                        ? (endStep.output.length > 200 ? endStep.output.substring(0, 200) + '...' : endStep.output)
                        : 'Completed'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
