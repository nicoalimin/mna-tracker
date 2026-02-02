"use client";

import { type UIMessage, useChat } from "@ai-sdk/react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ArrowDown, LoaderCircle } from "lucide-react";

import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { IntermediateStep } from "@/components/chat/IntermediateStep";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

function ChatMessages(props: {
  messages: UIMessage[];
  emptyStateComponent: ReactNode;
  sourcesForMessages: Record<string, any>;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {props.messages.map((m, i) => {
        const uniqueKey = m.id ? `${m.id}-${i}` : `msg-${i}`;
        if (m.role === "system") {
          return <IntermediateStep key={uniqueKey} message={m} />;
        }

        const sourceKey = (props.messages.length - 1 - i).toString();
        return (
          <ChatMessageBubble
            key={uniqueKey}
            message={m}
            aiEmoji={props.aiEmoji}
            sources={props.sourcesForMessages[sourceKey]}
          />
        );
      })}
    </div>
  );
}

export function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  const disabled = props.loading && props.onStop == null;
  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();

        if (props.loading) {
          props.onStop?.();
        } else {
          props.onSubmit(e);
        }
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

        <div className="flex justify-between ml-4 mr-2 mb-2">
          <div className="flex gap-3 text-xs items-center text-muted-foreground">{props.children}</div>

          <div className="flex gap-2 self-end">
            {props.actions}
            <Button type="submit" className="self-end h-8 px-4" size="sm" disabled={disabled}>
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
  showIngestForm?: boolean;
  showIntermediateStepsToggle?: boolean;
  initialMessages?: UIMessage[];
}) {
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(
    !!props.showIntermediateStepsToggle,
  );
  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

  const [input, setInput] = useState("");

  const chat = useChat({
    api: props.endpoint,
    initialMessages: props.initialMessages,
    onResponse(response: Response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
        : [];

      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    onError: (e: Error) => {
      console.error(e);
      toast.error(`Error while processing your request`, {
        description: e.message,
      });
    }
  } as any);

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (chat.status === 'streaming' || chat.status === 'submitted' || intermediateStepsLoading) return;

    if (!showIntermediateSteps) {
      chat.sendMessage({ text: input });
      setInput("");
      return;
    }

    // Some extra work to show intermediate steps properly
    setIntermediateStepsLoading(true);
    const content = input;
    setInput("");

    const messagesWithUserReply: UIMessage[] = chat.messages.concat({
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ type: 'text', text: content }]
    } as any);
    chat.setMessages(messagesWithUserReply);

    try {
      const response = await fetch(props.endpoint, {
        method: "POST",
        body: JSON.stringify({
          messages: messagesWithUserReply,
          show_intermediate_steps: true,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        toast.error(`Error while processing your request`, {
          description: json.error,
        });
        setIntermediateStepsLoading(false);
        return;
      }

      const json = await response.json();
      setIntermediateStepsLoading(false);

      const responseMessages: UIMessage[] = json.messages;

      // Represent intermediate steps as system messages for display purposes
      const toolCallMessages = responseMessages.filter(
        (responseMessage: UIMessage) => {
          return (
            (responseMessage.role === "assistant" &&
              // @ts-ignore
              !!responseMessage.tool_calls?.length) ||
            // @ts-ignore
            responseMessage.parts?.some(p => p.type === 'tool-call') ||
            // @ts-ignore
            responseMessage.role === "tool"
          );
        },
      );

      const intermediateStepMessages: UIMessage[] = [];
      const toolCalls = responseMessages.flatMap(msg => msg?.parts?.filter(p => p.type === 'tool-call'));
      for (let i = 0; i < toolCalls.length; i++) {
        const tc = toolCalls[i];
        if (!tc) continue;
        intermediateStepMessages.push({
          id: `step-${Date.now()}-${i}`,
          role: "system",
          parts: [{
            type: 'text', text: JSON.stringify({
              // @ts-ignore
              action: tc,
              observation: "Tool executed",
            })
          }],
        });
      }

      const newMessages = [...messagesWithUserReply];
      for (const message of intermediateStepMessages) {
        newMessages.push(message);
        chat.setMessages([...newMessages]);
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500),
        );
      }

      // Append all response messages
      chat.setMessages([
        ...newMessages,
        ...responseMessages
      ]);

    } catch (err) {
      console.error(err);
      setIntermediateStepsLoading(false);
      toast.error("Failed to send message");
    }
  }

  return (
    <ChatLayout
      content={
        chat.messages.length === 0 ? (
          <div className="max-w-[768px] mx-auto w-full">{props.emptyStateComponent}</div>
        ) : (
          <ChatMessages
            aiEmoji={props.emoji}
            messages={chat.messages}
            emptyStateComponent={props.emptyStateComponent}
            sourcesForMessages={sourcesForMessages}
          />
        )
      }
      footer={
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={sendMessage}
          loading={chat.status === 'streaming' || chat.status === 'submitted' || intermediateStepsLoading}
          placeholder={props.placeholder ?? "Ask a question..."}
        >
          {props.showIntermediateStepsToggle && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="show_intermediate_steps"
                name="show_intermediate_steps"
                checked={showIntermediateSteps}
                disabled={chat.status === 'streaming' || chat.status === 'submitted' || intermediateStepsLoading}
                onCheckedChange={(e) => setShowIntermediateSteps(!!e)}
              />
              <label htmlFor="show_intermediate_steps" className="cursor-pointer select-none">
                Show intermediate steps
              </label>
            </div>
          )}
        </ChatInput>
      }
    />
  );
}
