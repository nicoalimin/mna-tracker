import { type UIMessage } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bot, User, ChevronDown, ChevronRight, Wrench } from "lucide-react";
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

interface ToolResultProps {
  part: any;
  isCollapsed: boolean;
  onOpenChange: (open: boolean) => void;
}

function ToolResult({ part, isCollapsed, onOpenChange }: ToolResultProps) {
  const toolName = part.toolName || "Tool";
  const output = part.output;

  // Extract content from the ToolMessage structure if present
  let displayContent = "";
  if (output?.kwargs?.content) {
    displayContent = output.kwargs.content;
  } else if (typeof output === "string") {
    displayContent = output;
  } else if (output) {
    displayContent = JSON.stringify(output, null, 2);
  }

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => onOpenChange(!open)}>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 w-full">
        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border">
          <Wrench className="h-3 w-3" />
          <span className="font-medium">{toolName}</span>
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 ml-1" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1" />
          )}
        </div>
        {part.state && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded",
            part.state === "output-available" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              part.state === "running" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                "bg-muted text-muted-foreground"
          )}>
            {part.state === "output-available" ? "completed" : part.state}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md bg-muted/30 border p-3 text-xs">
          <MarkdownRenderer
            content={displayContent}
            className="prose-xs [&_*]:text-xs"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ChatMessageBubble(props: ChatMessageBubbleProps) {
  const isUser = props.message.role === "user";
  const parts = props.message?.parts || [];

  // Check if there's any text content being streamed (has text parts with content)
  const hasTextContent = parts.some(
    (part) => part.type === "text" && (part as any).text?.trim()
  );

  // Check if any text part is currently streaming (state === 'streaming' or no state yet with partial content)
  const isStreaming = parts.some(
    (part) => part.type === "text" && (part as any).state !== "done"
  );

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

  // For assistant messages, render parts with switch statement
  return (
    <div className="flex gap-4 mb-6">
      {/* Avatar */}
      <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
        <Bot className="h-5 w-5 text-white" />
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-[80%] flex flex-col items-start gap-2">
        {/* Tool Results - Outside and above the chat bubble */}
        {toolParts.length > 0 && (
          <div className="w-full space-y-1">
            {toolParts.map((part, index) => (
              <ToolResult
                key={`tool-${index}`}
                part={part}
                isCollapsed={toolsCollapsed}
                onOpenChange={(collapsed) => setToolsCollapsed(collapsed)}
              />
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
}
