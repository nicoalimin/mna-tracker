import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, HumanMessage, AIMessage } from "@/lib/agent";
import { createClient } from "@supabase/supabase-js";
import { BaseMessage, ChatMessage } from "@langchain/core/messages";

// Simple interface for Vercel AI SDK Messages as received from client
interface VercelChatMessage {
  role: string;
  content: string;
  id?: string;
  [key: string]: any;
}

// Use Node.js runtime (not edge) for full API support
// export const runtime = "edge";

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

// Create a server-side Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, key);
}

/**
 * Fetch active investment thesis and screening criteria to provide context.
 */
async function fetchContextData(): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const contextParts: string[] = [];

    // Fetch active investment thesis
    const { data: theses } = await supabase
      .from("investment_thesis")
      .select("title, content")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(3);

    if (theses && theses.length > 0) {
      contextParts.push("## Current Investment Thesis\n");
      theses.forEach((thesis, i) => {
        contextParts.push(`### ${i + 1}. ${thesis.title}`);
        contextParts.push(thesis.content);
        contextParts.push("");
      });
    }

    // Fetch screening criteria
    const { data: criteria } = await supabase
      .from("criterias")
      .select("name, prompt")
      .order("created_at", { ascending: true });

    if (criteria && criteria.length > 0) {
      contextParts.push("## Screening Criteria\n");
      contextParts.push("The following criteria are used to evaluate companies:\n");
      criteria.forEach((c, i) => {
        contextParts.push(`${i + 1}. **${c.name}**: ${c.prompt}`);
      });
      contextParts.push("");
    }

    if (contextParts.length > 0) {
      return `\n---\n**CONTEXT: Use the following investment thesis and screening criteria to inform your analysis:**\n\n${contextParts.join("\n")}\n---\n\n`;
    }

    return "";
  } catch (error) {
    console.error("Error fetching context data:", error);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const returnIntermediateSteps = body.show_intermediate_steps;

    // Fetch context
    const contextData = await fetchContextData();

    // Filter and transform messages
    const rawMessages = (body.messages ?? []).filter(
      (message: VercelChatMessage) =>
        message.role === "user" || message.role === "assistant",
    );

    // Inject context into the last user message if present
    if (contextData && rawMessages.length > 0) {
      const lastMsg = rawMessages[rawMessages.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content = `${contextData}User query: ${lastMsg.content}`;
      }
    }

    const messages = rawMessages.map(convertVercelMessageToLangChainMessage);

    const agent = await getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not available. Please ensure ANTHROPIC_API_KEY is set." },
        { status: 500 }
      );
    }

    if (!returnIntermediateSteps) {
      /**
       * Stream back all generated tokens and steps from their runs.
       */
      const eventStream = await agent.streamEvents(
        { messages },
        { version: "v2" },
      );

      const textEncoder = new TextEncoder();
      const transformStream = new ReadableStream({
        async start(controller) {
          for await (const { event, data } of eventStream) {
            if (event === "on_chat_model_stream") {
              // Intermediate chat model generations will contain tool calls and no content
              if (!!data.chunk.content) {
                controller.enqueue(textEncoder.encode(data.chunk.content));
              }
            }
          }
          controller.close();
        },
      });

      return new Response(transformStream);
    } else {
      /**
       * Return intermediate steps
       */
      const result = await agent.invoke({ messages });

      // Fallback if result.messages are strings (legacy behavior handled by wrapper update now anyway)
      const validMessages = result.messages.map(m => {
        if (typeof m === 'string') {
          return new AIMessage(m);
        }
        return m as BaseMessage;
      });

      return NextResponse.json(
        {
          messages: validMessages.map(convertLangChainMessageToVercelMessage),
        },
        { status: 200 },
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
