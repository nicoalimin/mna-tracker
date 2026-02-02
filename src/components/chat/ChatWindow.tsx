"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ArrowDown, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessageBubble } from "./ChatMessageBubble";

const WELCOME_MESSAGE = `Hello! I'm your M&A discovery assistant. I can help you with:

🔍 **Company Discovery** - Find acquisition targets by sector
🔬 **Deep Dive Analysis** - Detailed company assessments
⚖️ **Comparison & Synergy** - Compare companies, evaluate fit
📊 **Pipeline Insights** - Performance metrics and bottlenecks

💡 **Try asking:**
• "Find semiconductor companies"
• "Analyze ChipTech Solutions"
• "Compare ChipTech vs NanoSilicon"
• "Pipeline performance summary"`;

const welcomeUIMessage: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [{ type: "text", text: WELCOME_MESSAGE }],
};

function WelcomeMessage() {
  return <ChatMessageBubble message={welcomeUIMessage} />;
}

function ChatMessages(props: {
  messages: ReturnType<typeof useChat>["messages"];
  emptyStateComponent: ReactNode;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      <WelcomeMessage />
      {props.messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} aiEmoji={props.aiEmoji} />
      ))}
    </div>
  );
}

export function ChatInput(props: {
  onSubmit: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit();
      }}
      className={cn("flex w-full flex-col", props.className)}
    >
      <div className="border border-input bg-secondary rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          className="border-none outline-none bg-transparent p-4 text-sm placeholder:text-muted-foreground"
        />

        <div className="flex justify-end mr-2 mb-2">
          <Button type="submit" className="self-end h-8 px-4" size="sm" disabled={props.loading}>
            {props.loading ? (
              <span role="status" className="flex justify-center items-center gap-2">
                <LoaderCircle className="animate-spin w-4 h-4" />
                <span className="sr-only">Loading...</span>
              </span>
            ) : (
              <span>Send</span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("rounded-full h-8 w-8 p-0 opacity-80 hover:opacity-100", props.className)}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={cn("grid grid-rows-[1fr,auto] overflow-y-auto", props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ChatLayout(props: { content: ReactNode; footer: ReactNode }) {
  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={props.content}
        footer={
          <div className="sticky bottom-0 px-2 pb-4 bg-gradient-to-t from-background via-background to-transparent pt-4">
            <ScrollToBottom className="absolute -top-10 left-1/2 -translate-x-1/2 mb-4" />
            {props.footer}
          </div>
        }
      />
    </StickToBottom>
  );
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
}) {
  const [input, setInput] = useState("");

  const transport = useMemo(
    () => new DefaultChatTransport({ api: props.endpoint }),
    [props.endpoint]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (e: Error) => {
      console.error(e);
      toast.error(`Error while processing your request`, {
        description: e.message,
      });
    },
  });

  return (
    <ChatLayout
      content={
        messages.length === 0 ? (
          <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
            <WelcomeMessage />
          </div>
        ) : (
          <ChatMessages
            aiEmoji={props.emoji}
            messages={messages}
            emptyStateComponent={props.emptyStateComponent}
          />
        )
      }
      footer={
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={() => {
            sendMessage({ text: input });
            setInput("");
          }}
          loading={status === "streaming" || status === "submitted"}
          placeholder={props.placeholder ?? "Ask a question..."}
        />
      }
    />
  );
}
