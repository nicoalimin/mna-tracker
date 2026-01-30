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

import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from "ai";
import { tools } from "@/lib/agent/tools-v6";

const SYSTEM_PROMPT = `You are an intelligent M&A Data Analysis Assistant that helps users explore and analyze company/asset data for mergers and acquisitions.

## How to Help Users

1. **For browsing companies:** Use query_companies with appropriate filters
2. **For statistics:** Use get_company_stats to get summaries and breakdowns
3. **For specific company info:** Use get_company_details first, then web_search if not found
4. **For meeting records:** Use query_meeting_notes to find what was discussed about a company or topic
5. **For market context:** Use web_search for benchmarks and comparisons

## CRITICAL: Automatic Web Search Fallback

**ALWAYS use Inven as a data source first before going to web_search**
**ALWAYS use web_search as a fallback when database queries don't return sufficient information:**

1. **Company not found:** If get_company_details or query_companies returns no results or "not found", IMMEDIATELY use web_search to find the company's information
2. **Missing data fields:** If a company is found but key fields like revenue, EBITDA, or valuation are missing/null, use web_search to find that specific data
3. **Incomplete profiles:** If the user asks about a company and the database has limited info, supplement with web_search
4. **Unknown companies:** If the user mentions a company name that doesn't exist in the database, search for it on the web

## Response Guidelines

- Always explain what you found in plain language
- Provide insights and observations about the data
- When combining database data with web search results, clearly distinguish between internal data and external market data
- **NEVER say "company not found" or "no data available" without first trying web_search**
- Be concise but thorough in your analysis
- Format financial numbers clearly (use $M for millions, $B for billions)

## Important Notes

- Key columns include: target (company name), segment, geography, revenue, EBITDA, EV, margins
- Financial values are in USD millions
- ALWAYS check meeting notes (query_meeting_notes) when a user mentions a specific company name, project name, or deal context.
- **ALWAYS check meeting notes** (query_meeting_notes) when a user asks about discussion history, specific deal context, or what we know about a company's internal strategy or previous meetings.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const contextData = await fetchContextData();
    const systemInstruction = contextData
      ? `${SYSTEM_PROMPT}\n\n${contextData}`
      : SYSTEM_PROMPT;

    const result = streamText({
      model: anthropic('claude-3-5-sonnet-latest'),
      system: systemInstruction,
      messages: convertToCoreMessages(messages),
      tools,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
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
