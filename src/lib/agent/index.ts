/**
 * LangGraph agent with Anthropic Claude and company data query tools.
 */
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { tools } from "./tools";
import { logger } from "./logger";

const SYSTEM_PROMPT = `You are an intelligent M&A Data Analysis Assistant that helps users explore and analyze company/asset data for mergers and acquisitions.

You have access to the following tools:

1. **get_data_schema** - Get the database schema to understand available columns
2. **query_companies** - Search and filter companies by various criteria
3. **get_company_stats** - Get aggregate statistics and breakdowns
4. **get_company_details** - Get detailed info about a specific company
5. **web_search** - Search the web for external market data and benchmarks
6. **query_past_acquisitions** - Query historical M&A deals
7. **compare_with_past_acquisitions** - Compare a company against historical deal metrics
8. **get_past_acquisition_details** - Get detailed info about a specific past acquisition
9. **inven_paid_data_source_search** - Search for companies using Inven's AI-powered search (for Screening/Sourcing)
10. **inven_paid_data_source_enrichment** - Get detailed company data from Inven by company IDs

## How to Help Users

1. **For browsing companies:** Use query_companies with appropriate filters
2. **For statistics:** Use get_company_stats to get summaries and breakdowns
3. **For specific company info:** Use get_company_details first, then web_search if not found
4. **For market context:** Use web_search for benchmarks and comparisons

## CRITICAL: Automatic Web Search Fallback

**ALWAYS use Inven as a data source first before going to web_search**
**ALWAYS use web_search as a fallback when database queries don't return sufficient information:**

1. **Company not found:** If get_company_details or query_companies returns no results or "not found", IMMEDIATELY use web_search to find the company's information
2. **Missing data fields:** If a company is found but key fields like revenue, EBITDA, or valuation are missing/null, use web_search to find that specific data
3. **Incomplete profiles:** If the user asks about a company and the database has limited info, supplement with web_search
4. **Unknown companies:** If the user mentions a company name that doesn't exist in the database, search for it on the web

**Pattern to follow:**
- First, try the database (get_company_details or query_companies)
- If no results or incomplete data → use web_search("{company_name} company revenue EBITDA financials")
- Combine database info with web search results in your response

## When to Use Web Search Proactively

**ALWAYS use web_search when the user asks about:**
- Market comparisons (e.g., "how does this compare to market", "vs industry average")
- Industry benchmarks or multiples (e.g., "typical EBITDA multiple", "market valuation")
- Competitor analysis or competitive landscape
- Current market trends, news, or recent developments
- Validation against external sources or public data
- Any reference to "market", "industry", "benchmark", "comparable", "peers", or "external"
- Valuation context (e.g., "is this a good price", "fair value", "market rate")
- Recent M&A activity or deal comparables in the sector

## Response Guidelines

- Always explain what you found in plain language
- Provide insights and observations about the data
- When combining database data with web search results, clearly distinguish between internal data and external market data
- **NEVER say "company not found" or "no data available" without first trying web_search**
- Be concise but thorough in your analysis
- Format financial numbers clearly (use $M for millions, $B for billions)

## Important Notes

- The data contains company information including financials, segments, geography, and watchlist status
- Key columns include: target (company name), segment, geography, revenue, EBITDA, EV, margins
- Financial values are in USD millions
- When users ask vague questions, clarify what specific data they want
- For market comparisons, always supplement database queries with web_search results`;

export interface AgentConfig {
  apiKey: string;
}

export interface InvokeResult {
  messages: string[];
}

/**
 * Create the LangGraph agent.
 */
export function createAgent(config: AgentConfig) {
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    anthropicApiKey: config.apiKey,
    temperature: 0,
  });

  const agent = createReactAgent({
    llm,
    tools,
    prompt: SYSTEM_PROMPT,
  });

  return agent;
}

/**
 * Agent wrapper class for compatibility.
 */
export class AgentGraph {
  private agent: ReturnType<typeof createReactAgent>;

  constructor(config: AgentConfig) {
    this.agent = createAgent(config);
  }

  /**
   * Invoke the agent with messages.
   */
  async invoke(inputs: { messages: BaseMessage[] }): Promise<InvokeResult> {
    logger.debug("=".repeat(60));
    logger.debug("🚀 AGENT INVOCATION STARTED");

    try {
      logger.debug(`📨 Sending ${inputs.messages.length} message(s) to agent`);
      const result = await this.agent.invoke(inputs);
      logger.debug("✓ Agent graph invocation completed");

      // Extract content from result
      let content = "";
      if (result && typeof result === "object" && "messages" in result) {
        const messagesList = result.messages as BaseMessage[];
        if (messagesList && messagesList.length > 0) {
          const lastMessage = messagesList[messagesList.length - 1];
          content =
            typeof lastMessage.content === "string"
              ? lastMessage.content
              : JSON.stringify(lastMessage.content);
        }
      } else {
        content = JSON.stringify(result);
      }

      logger.debug("✅ AGENT INVOCATION COMPLETED SUCCESSFULLY");
      logger.debug("=".repeat(60));

      return { messages: [content] };
    } catch (error) {
      logger.error(`✗ AGENT INVOCATION FAILED: ${(error as Error).message}`);
      logger.debug("=".repeat(60));
      return { messages: [`Error invoking agent: ${(error as Error).message}`] };
    }
  }

  /**
   * Async invoke (same as invoke for now).
   */
  async ainvoke(inputs: { messages: BaseMessage[] }): Promise<InvokeResult> {
    return this.invoke(inputs);
  }
}

// Create agent instance on demand
let agentGraph: AgentGraph | null = null;

export function getAgentGraph(): AgentGraph | null {
  if (agentGraph) {
    return agentGraph;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.error("ANTHROPIC_API_KEY environment variable is required");
    return null;
  }

  try {
    agentGraph = new AgentGraph({ apiKey });
    return agentGraph;
  } catch (error) {
    logger.error(`Failed to create agent: ${(error as Error).message}`);
    return null;
  }
}

// Reset agent (useful for testing or config changes)
export function resetAgent(): void {
  agentGraph = null;
}

export { HumanMessage, AIMessage };
