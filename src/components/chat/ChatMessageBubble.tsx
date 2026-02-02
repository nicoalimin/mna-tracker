import { type UIMessage } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bot, User, ChevronDown, ChevronRight, Wrench, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ChatMessageBubbleProps {
  message: UIMessage;
  aiEmoji?: string;
  sources?: any[];
  className?: string;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1 text-muted-foreground py-2">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span className="text-sm">Thinking</span>
      <span className="flex gap-0.5">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
      </span>
    </div>
  );
}

export function LoadingBubble() {
  return (
    <div className="flex gap-4 mb-6">
      {/* Avatar */}
      <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
        <Bot className="h-5 w-5 text-white" />
      </div>

      {/* Thinking Indicator */}
      <div className="flex-1 max-w-[80%] flex flex-col items-start">
        <ThinkingIndicator />
      </div>
    </div>
  );
}

export function ChatMessageBubble(props: ChatMessageBubbleProps) {
  const isUser = props.message.role === "user";
  const parts = props.message?.parts || [];

  // Check if there's any text content being streamed (has text parts with content)
  const hasTextContent = parts.some(
    (part) => part.type === "text" && (part as any).text?.trim()
  );

  // Check if streaming is complete (all text parts have state === 'done')
  const isStreamingComplete = parts.length > 0 &&
    parts.filter((part) => part.type === "text").every((part) => (part as any).state === "done");

  // Check if tools are still running
  const hasRunningTools = parts.some(
    (part) => (part.type === "dynamic-tool" || part.type === "tool-invocation") &&
      (part as any).state !== "output-available"
  );

  // Show thinking indicator when: no text content yet OR tools are running
  const showThinking = !isUser && (!hasTextContent || hasRunningTools) && !isStreamingComplete;

  // Auto-collapse tool results when text starts streaming
  const [toolsCollapsed, setToolsCollapsed] = useState(false);

  useEffect(() => {
    // Collapse tools when we have text content
    if (hasTextContent && !toolsCollapsed) {
      setToolsCollapsed(true);
    }
  }, [hasTextContent]);

  // For user messages, just show text content
  if (isUser) {
    const textContent = parts
      .filter((part) => part.type === "text")
      .map((part) => (part as any).text)
      .join("");

    return (
      <div className="flex gap-4 mb-6 flex-row-reverse">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-primary">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 max-w-[80%] flex flex-col items-end">
          <div className="rounded-2xl px-5 py-4 w-full bg-primary text-primary-foreground">
            <MarkdownRenderer
              content={textContent}
              className="prose-invert [&_*]:text-primary-foreground"
            />
          </div>
        </div>
      </div>
    );
  }

  // Separate tool parts from text parts
  const toolParts = parts.filter(
    (part) => part.type === "dynamic-tool" || part.type === "tool-invocation"
  );
  const textParts = parts.filter((part) => part.type === "text");

  // Extract citations from all web_search tool results
  const allCitations: { title: string; url: string }[] = [];
  for (const part of toolParts) {
    const toolName = (part as any).toolName || "";
    if (toolName === "web_search") {
      const output = (part as any).output;
      let content = "";
      if (output?.kwargs?.content) {
        content = output.kwargs.content;
      } else if (typeof output === "string") {
        content = output;
      }
      const citationMatch = content.match(/<!-- CITATIONS_JSON:(.*?) -->/);
      if (citationMatch) {
        try {
          const citations = JSON.parse(citationMatch[1]);
          for (const cite of citations) {
            if (!allCitations.some(c => c.url === cite.url)) {
              allCitations.push(cite);
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  // For assistant messages, render parts with switch statement
  return (
    <div className="flex gap-4 mb-6">
      {/* Avatar */}
      <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
        <Bot className="h-5 w-5 text-white" />
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-[80%] flex flex-col items-start gap-2">
        {/* Tool Results - All tools behind a single collapsible */}
        {toolParts.length > 0 && (
          <Collapsible
            open={!toolsCollapsed}
            onOpenChange={(open) => setToolsCollapsed(!open)}
            className="w-full"
          >
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-3 w-full bg-muted/40 rounded-lg border hover:bg-muted/60">
              <Wrench className="h-4 w-4" />
              <span className="font-medium">
                {toolParts.length} tool{toolParts.length > 1 ? "s" : ""} used
              </span>
              {toolsCollapsed ? (
                <ChevronRight className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-auto" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto rounded-lg bg-muted/20 border p-3">
                {toolParts.map((part, index) => {
                  const toolName = (part as any).toolName || "Tool";
                  const output = (part as any).output;

                  // Extract content from the ToolMessage structure if present
                  let displayContent = "";
                  if (output?.kwargs?.content) {
                    displayContent = output.kwargs.content;
                  } else if (typeof output === "string") {
                    displayContent = output;
                  } else if (output) {
                    displayContent = JSON.stringify(output, null, 2);
                  }

                  // Remove citation JSON from display content
                  displayContent = displayContent.replace(/\n*<!-- CITATIONS_JSON:.*? -->/, "");

                  return (
                    <div key={`tool-${index}`} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{toolName}</span>
                        {(part as any).state && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded",
                            (part as any).state === "output-available" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              (part as any).state === "running" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                "bg-muted text-muted-foreground"
                          )}>
                            {(part as any).state === "output-available" ? "completed" : (part as any).state}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <MarkdownRenderer
                          content={displayContent}
                          className="prose-xs [&_*]:text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Thinking Indicator - Shows when agent is still processing */}
        {showThinking && <ThinkingIndicator />}

        {/* Text Content - Inside the chat bubble */}
        {textParts.some((part) => (part as any).text?.trim()) && (
          <div className="rounded-2xl px-5 py-4 w-full bg-card border shadow-sm">
            {textParts.map((part, index) => {
              const text = (part as any).text;
              if (!text?.trim()) return null;
              return (
                <div key={index}>
                  <MarkdownRenderer content={text} />
                </div>
              );
            })}
          </div>
        )}

        {/* Sources */}
        {props.sources && props.sources.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {props.sources.map((source, i) => (
                <div key={i} className="bg-muted px-2 py-1 rounded border">
                  {source.title || source.name || "Source"}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Web Search Citations - Below chat bubble */}
        {allCitations.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">📚 Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {allCitations.slice(0, 6).map((cite, i) => (
                <a
                  key={i}
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors border border-blue-100 dark:border-blue-800"
                >
                  {cite.title.length > 35 ? cite.title.substring(0, 35) + "..." : cite.title}
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
