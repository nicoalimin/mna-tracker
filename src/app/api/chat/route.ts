/**
 * API Route for the AI Chat Agent.
 * Handles POST requests to invoke the LangGraph agent.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, HumanMessage, AIMessage } from "@/lib/agent";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { createClient } from "@supabase/supabase-js";

// Store conversation history per session (in-memory for now)
// In production, consider using a database or Redis
const conversationHistory = new Map<string, BaseMessage[]>();

// Maximum messages to keep in history
const MAX_HISTORY = 20;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId = "default" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Get or initialize conversation history
    let history = conversationHistory.get(sessionId) || [];

    // Fetch thesis and criteria context
    const contextData = await fetchContextData();

    // Create user message with context (only for first message or when context is relevant)
    let messageWithContext = message;
    if (history.length === 0 && contextData) {
      // Inject context at the start of the conversation
      messageWithContext = `${contextData}User query: ${message}`;
    }

    const currentUserMessage = new HumanMessage(messageWithContext);

    // Get the agent
    const agent = await getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        {
          error: "Agent not available. Please ensure ANTHROPIC_API_KEY is set.",
        },
        { status: 500 }
      );
    }

    // Combine history with current message (limit to last MAX_HISTORY)
    const messagesToSend = [...history.slice(-MAX_HISTORY), currentUserMessage];

    // Invoke the agent
    const result = await agent.invoke({ messages: messagesToSend });
    const agentResponse = result.messages[0] || "No response from agent.";

    // Update conversation history (store original message without context for cleaner history)
    history.push(new HumanMessage(message));
    history.push(new AIMessage(agentResponse));

    // Trim history if too long
    if (history.length > MAX_HISTORY * 2) {
      history = history.slice(-MAX_HISTORY * 2);
    }

    conversationHistory.set(sessionId, history);

    return NextResponse.json({
      response: agentResponse,
      sessionId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: Add GET endpoint to check agent status
export async function GET() {
  const agent = getAgentGraph();
  return NextResponse.json({
    status: agent ? "ok" : "not_configured",
    message: agent
      ? "Agent is ready"
      : "Agent not available. Check ANTHROPIC_API_KEY.",
  });
}

// Optional: DELETE endpoint to clear session history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId") || "default";

    conversationHistory.delete(sessionId);

    return NextResponse.json({
      message: `Session ${sessionId} cleared`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    );
  }
}
