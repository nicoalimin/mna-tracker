import { type UIMessage } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatMessageBubbleProps {
  message: UIMessage;
  aiEmoji?: string;
  sources?: any[];
  className?: string;
}

export function ChatMessageBubble(props: ChatMessageBubbleProps) {
  const isUser = props.message.role === "user";

  // Extract text content from parts, or fallback to content property
  const partsContent = props.message?.parts
    ?.filter(part => part.type === 'text')
    ?.map(part => (part as any).text)
    ?.join('');

  // Fallback to message.content for streamed responses (which don't use parts format)
  const content = partsContent || (typeof (props.message as any).content === 'string' ? (props.message as any).content : '');

  return (
    <div
      className={cn(
        "flex gap-4 mb-6",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center",
          !isUser
            ? "bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg"
            : "bg-primary"
        )}
      >
        {!isUser ? (
          <Bot className="h-5 w-5 text-white" />
        ) : (
          <User className="h-5 w-5 text-primary-foreground" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex-1 max-w-[80%]",
          isUser ? "flex flex-col items-end" : "flex flex-col items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-5 py-4 w-full",
            !isUser
              ? "bg-card border shadow-sm"
              : "bg-primary text-primary-foreground"
          )}
        >
          <MarkdownRenderer
            content={content}
            className={cn(isUser && "prose-invert [&_*]:text-primary-foreground")}
          />
        </div>

        {/* Sources - Only for assistant for now */}
        {!isUser && props.sources && props.sources.length > 0 && (
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
