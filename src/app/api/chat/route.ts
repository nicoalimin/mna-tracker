/**
 * API Route for the AI Chat Agent.
 * Handles POST requests to invoke the LangGraph agent.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, HumanMessage, AIMessage } from "@/lib/agent";
import { BaseMessage } from "@langchain/core/messages";

// Store conversation history per session (in-memory for now)
// In production, consider using a database or Redis
const conversationHistory = new Map<string, BaseMessage[]>();

// Maximum messages to keep in history
const MAX_HISTORY = 20;

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
    const currentUserMessage = new HumanMessage(message);

    // Get the agent
    const agent = getAgentGraph();
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

    // Update conversation history
    history.push(currentUserMessage);
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
