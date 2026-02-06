import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, AIMessage } from "@/lib/agent";
import { BaseMessage } from "@langchain/core/messages";
import { toUIMessageStream, toBaseMessages } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage } from "ai";

// Use Node.js runtime (not edge) for full API support
// export const runtime = "edge";

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

import { db } from "@/lib/db";

/**
 * Fetch active investment thesis and screening criteria to provide context.
 */
async function fetchContextData(): Promise<string> {
  try {
    const contextParts: string[] = [];

    // Fetch active investment thesis, using raw SQL
    // Assuming 'is_active' is a boolean column
    const thesisResult = await db.query(
      `SELECT title, content FROM investment_thesis 
       WHERE is_active = true 
       ORDER BY updated_at DESC 
       LIMIT 3`
    );
    const theses = thesisResult.rows;

    if (theses && theses.length > 0) {
      contextParts.push("## Current Investment Thesis\n");
      theses.forEach((thesis, i) => {
        contextParts.push(`### ${i + 1}. ${thesis.title}`);
        contextParts.push(thesis.content);
        contextParts.push("");
      });
    }

    // Fetch screening criteria
    const criteriaResult = await db.query(
      `SELECT name, prompt FROM criterias ORDER BY created_at ASC`
    );
    const criteria = criteriaResult.rows;

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

    console.log(JSON.stringify(body.messages));

    // Filter messages and convert to LangChain format using the adapter
    const filteredMessages = (body.messages ?? []).filter(
      (message: any) =>
        message.role === "user" || message.role === "assistant",
    );

    // Normalize messages to ensure they have the required 'parts' structure for toBaseMessages
    const rawMessages: UIMessage[] = filteredMessages.map((msg: any) => {
      // If message already has parts, filter to only include text parts
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts.filter((part: any) => part.type === 'text');
        return {
          ...msg,
          parts: textParts,
        };
      }
      // Otherwise, convert content to parts format
      return {
        ...msg,
        parts: msg.content ? [{ type: 'text', text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }] : [],
      };
    });

    // Use @ai-sdk/langchain adapter to convert UIMessages to LangChain BaseMessages
    const messages: BaseMessage[] = await toBaseMessages(rawMessages);

    const agent = getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not available. Please ensure ANTHROPIC_API_KEY is set." },
        { status: 500 }
      );
    }

    if (!returnIntermediateSteps) {
      /**
       * Stream back all generated tokens and steps from their runs.
       * Using streamEvents v2 which is supported by @ai-sdk/langchain adapter
       */
      const eventStream = await agent.streamEvents(
        { messages, additionalSystemContext: contextData || undefined },
        { version: "v2", recursionLimit: 50 },
      );

      // Convert LangChain streamEvents to AI SDK UIMessageStream format
      return createUIMessageStreamResponse({
        stream: toUIMessageStream(eventStream),
      });
    } else {
      /**
       * Return intermediate steps
       */
      const result = await agent.invoke(
        {
          messages,
          additionalSystemContext: contextData || undefined
        },
        { recursionLimit: 50 }
      );

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
