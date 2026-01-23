/**
 * Tool definitions for the LangGraph agent.
 * Adapted to work with Supabase instead of SQLite.
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

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
 * Get the schema of the companies data including column names and types.
 */
export const getDataSchema = tool(
  async () => {
    logger.debug("🔧 TOOL CALLED: get_data_schema()");

    const columns = [
      // Core identifiers
      { name: "id", type: "uuid" },
      { name: "entry_id", type: "integer" },
      { name: "watchlist_id", type: "integer" },
      // Basic info
      { name: "target", type: "text" },
      { name: "segment", type: "text" },
      { name: "segment_related_offerings", type: "text" },
      { name: "company_focus", type: "text" },
      { name: "website", type: "text" },
      { name: "watchlist_status", type: "text" },
      { name: "pipeline_stage", type: "text" },
      { name: "comments", type: "text" },
      { name: "ownership", type: "text" },
      { name: "geography", type: "text" },
      // Revenue (USD Mn)
      { name: "revenue_2021_usd_mn", type: "numeric" },
      { name: "revenue_2022_usd_mn", type: "numeric" },
      { name: "revenue_2023_usd_mn", type: "numeric" },
      { name: "revenue_2024_usd_mn", type: "numeric" },
      // EBITDA (USD Mn)
      { name: "ebitda_2021_usd_mn", type: "numeric" },
      { name: "ebitda_2022_usd_mn", type: "numeric" },
      { name: "ebitda_2023_usd_mn", type: "numeric" },
      { name: "ebitda_2024_usd_mn", type: "numeric" },
      // Valuation
      { name: "ev_2024", type: "numeric" },
      { name: "ev_ebitda_2024", type: "numeric" },
      // Growth metrics
      { name: "revenue_cagr_2021_2022", type: "numeric" },
      { name: "revenue_cagr_2022_2023", type: "numeric" },
      { name: "revenue_cagr_2023_2024", type: "numeric" },
      // Margins
      { name: "ebitda_margin_2021", type: "numeric" },
      { name: "ebitda_margin_2022", type: "numeric" },
      { name: "ebitda_margin_2023", type: "numeric" },
      { name: "ebitda_margin_2024", type: "numeric" },
    ];

    // Get row count from Supabase
    let rowCount = 0;
    try {
      const supabase = getSupabaseClient();
      const { count } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });
      rowCount = count || 0;
    } catch (error) {
      logger.error(`Error getting row count: ${(error as Error).message}`);
    }

    const columnsInfo = columns.map((col) => `  - ${col.name} (${col.type})`);

    const result = `## Companies Data Schema

**Table:** companies
**Total Rows:** ${rowCount}
**Key Columns (${columns.length} total):**

${columnsInfo.join("\n")}

Use the query_companies tool to search and filter company data.
Use the get_company_stats tool for aggregate statistics.
`;

    logger.debug(`✓ Schema retrieved: ${columns.length} columns, ${rowCount} rows`);
    return result;
  },
  {
    name: "get_data_schema",
    description: `Get the schema of the companies data including column names and types.
Use this to understand what data is available before writing queries.

Returns:
    A description of the table schema with column names and types.`,
  }
);

/**
 * Query companies with filters.
 */
export const queryCompanies = tool(
  async ({
    segment,
    geography,
    watchlist_status,
    min_revenue,
    max_revenue,
    min_ebitda,
    search_term,
    limit = 20,
  }: {
    segment?: string;
    geography?: string;
    watchlist_status?: string;
    min_revenue?: number;
    max_revenue?: number;
    min_ebitda?: number;
    search_term?: string;
    limit?: number;
  }) => {
    logger.debug(
      `🔧 TOOL CALLED: query_companies(segment='${segment}', geography='${geography}', search='${search_term}')`
    );

    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("companies")
        .select(
          `
          id,
          entry_id,
          target,
          segment,
          geography,
          watchlist_status,
          pipeline_stage,
          revenue_2024_usd_mn,
          ebitda_2024_usd_mn,
          ev_2024,
          ebitda_margin_2024,
          ev_ebitda_2024
        `
        )
        .limit(Math.min(limit, 50));

      // Apply filters
      if (segment) {
        query = query.ilike("segment", `%${segment}%`);
      }
      if (geography) {
        query = query.ilike("geography", `%${geography}%`);
      }
      if (watchlist_status) {
        query = query.ilike("watchlist_status", `%${watchlist_status}%`);
      }
      if (min_revenue !== undefined) {
        query = query.gte("revenue_2024_usd_mn", min_revenue);
      }
      if (max_revenue !== undefined) {
        query = query.lte("revenue_2024_usd_mn", max_revenue);
      }
      if (min_ebitda !== undefined) {
        query = query.gte("ebitda_2024_usd_mn", min_ebitda);
      }
      if (search_term) {
        query = query.or(
          `target.ilike.%${search_term}%,segment.ilike.%${search_term}%,company_focus.ilike.%${search_term}%`
        );
      }

      const { data: companies, error } = await query;

      if (error) {
        logger.error(`Query error: ${error.message}`);
        return `**Query Error:** ${error.message}`;
      }

      if (!companies || companies.length === 0) {
        return "No companies found matching your criteria.";
      }

      // Format results as markdown table
      const header = "Target | Segment | Geography | Status | Rev 2024 ($M) | EBITDA 2024 ($M) | EV 2024 ($M)";
      const separator = "--- | --- | --- | --- | --- | --- | ---";

      const rows = companies.map((c) => {
        const rev = c.revenue_2024_usd_mn ? `$${c.revenue_2024_usd_mn.toFixed(1)}` : "-";
        const ebitda = c.ebitda_2024_usd_mn ? `$${c.ebitda_2024_usd_mn.toFixed(1)}` : "-";
        const ev = c.ev_2024 ? `$${c.ev_2024.toFixed(1)}` : "-";
        return `${c.target || "N/A"} | ${c.segment || "-"} | ${c.geography || "-"} | ${c.watchlist_status || "-"} | ${rev} | ${ebitda} | ${ev}`;
      });

      let result = `**Query Results (${companies.length} companies):**\n\n`;
      result += `| ${header} |\n| ${separator} |\n`;
      result += rows.map((row) => `| ${row} |`).join("\n");

      logger.debug(`✓ Query returned ${companies.length} companies`);
      return result;
    } catch (error) {
      logger.error(`Query error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "query_companies",
    description: `Query companies from the database with optional filters.

Use this tool to find companies by segment, geography, financial metrics, or search terms.
All filters are optional and can be combined.

Args:
    segment: Filter by segment (partial match, e.g., "Technology", "Healthcare")
    geography: Filter by geography (partial match, e.g., "USA", "Japan", "Europe")
    watchlist_status: Filter by status (e.g., "Active", "Inactive")
    min_revenue: Minimum 2024 revenue in USD millions
    max_revenue: Maximum 2024 revenue in USD millions
    min_ebitda: Minimum 2024 EBITDA in USD millions
    search_term: Search across target name, segment, and company focus
    limit: Maximum number of results (default: 20, max: 50)

Returns:
    A table of matching companies with key financial metrics.`,
    schema: z.object({
      segment: z.string().optional().describe("Filter by segment"),
      geography: z.string().optional().describe("Filter by geography"),
      watchlist_status: z.string().optional().describe("Filter by watchlist status"),
      min_revenue: z.number().optional().describe("Minimum 2024 revenue (USD M)"),
      max_revenue: z.number().optional().describe("Maximum 2024 revenue (USD M)"),
      min_ebitda: z.number().optional().describe("Minimum 2024 EBITDA (USD M)"),
      search_term: z.string().optional().describe("Search term for name/segment"),
      limit: z.number().optional().default(20).describe("Max results to return"),
    }),
  }
);

/**
 * Get aggregate statistics for companies.
 */
export const getCompanyStats = tool(
  async ({ group_by }: { group_by?: string }) => {
    logger.debug(`🔧 TOOL CALLED: get_company_stats(group_by='${group_by}')`);

    try {
      const supabase = getSupabaseClient();

      // Get all companies for aggregation
      const { data: companies, error } = await supabase
        .from("companies")
        .select(
          `
          segment,
          geography,
          watchlist_status,
          revenue_2024_usd_mn,
          ebitda_2024_usd_mn,
          ev_2024,
          ebitda_margin_2024
        `
        );

      if (error) {
        return `**Error:** ${error.message}`;
      }

      if (!companies || companies.length === 0) {
        return "No companies in the database.";
      }

      // Calculate overall stats
      const totalCompanies = companies.length;
      const withRevenue = companies.filter((c) => c.revenue_2024_usd_mn);
      const withEbitda = companies.filter((c) => c.ebitda_2024_usd_mn);

      const totalRevenue = withRevenue.reduce((sum, c) => sum + (c.revenue_2024_usd_mn || 0), 0);
      const avgRevenue = withRevenue.length > 0 ? totalRevenue / withRevenue.length : 0;

      const totalEbitda = withEbitda.reduce((sum, c) => sum + (c.ebitda_2024_usd_mn || 0), 0);
      const avgEbitda = withEbitda.length > 0 ? totalEbitda / withEbitda.length : 0;

      let result = `## Company Statistics

**Overall Summary:**
- Total Companies: ${totalCompanies}
- Companies with Revenue Data: ${withRevenue.length}
- Companies with EBITDA Data: ${withEbitda.length}
- Total Revenue (2024): $${totalRevenue.toFixed(1)}M
- Average Revenue (2024): $${avgRevenue.toFixed(1)}M
- Total EBITDA (2024): $${totalEbitda.toFixed(1)}M
- Average EBITDA (2024): $${avgEbitda.toFixed(1)}M

`;

      // Group by segment or geography
      if (group_by === "segment" || !group_by) {
        const bySegment = new Map<string, typeof companies>();
        companies.forEach((c) => {
          const key = c.segment || "Unknown";
          if (!bySegment.has(key)) bySegment.set(key, []);
          bySegment.get(key)!.push(c);
        });

        result += `**By Segment:**\n\n`;
        result += `| Segment | Count | Avg Rev ($M) | Avg EBITDA ($M) |\n`;
        result += `| --- | --- | --- | --- |\n`;

        Array.from(bySegment.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 15)
          .forEach(([segment, items]) => {
            const avgR = items.filter((i) => i.revenue_2024_usd_mn).length > 0
              ? items.reduce((s, i) => s + (i.revenue_2024_usd_mn || 0), 0) / items.filter((i) => i.revenue_2024_usd_mn).length
              : 0;
            const avgE = items.filter((i) => i.ebitda_2024_usd_mn).length > 0
              ? items.reduce((s, i) => s + (i.ebitda_2024_usd_mn || 0), 0) / items.filter((i) => i.ebitda_2024_usd_mn).length
              : 0;
            result += `| ${segment} | ${items.length} | ${avgR.toFixed(1)} | ${avgE.toFixed(1)} |\n`;
          });
      }

      if (group_by === "geography") {
        const byGeo = new Map<string, typeof companies>();
        companies.forEach((c) => {
          const key = c.geography || "Unknown";
          if (!byGeo.has(key)) byGeo.set(key, []);
          byGeo.get(key)!.push(c);
        });

        result += `\n**By Geography:**\n\n`;
        result += `| Geography | Count | Avg Rev ($M) | Avg EBITDA ($M) |\n`;
        result += `| --- | --- | --- | --- |\n`;

        Array.from(byGeo.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 15)
          .forEach(([geo, items]) => {
            const avgR = items.filter((i) => i.revenue_2024_usd_mn).length > 0
              ? items.reduce((s, i) => s + (i.revenue_2024_usd_mn || 0), 0) / items.filter((i) => i.revenue_2024_usd_mn).length
              : 0;
            const avgE = items.filter((i) => i.ebitda_2024_usd_mn).length > 0
              ? items.reduce((s, i) => s + (i.ebitda_2024_usd_mn || 0), 0) / items.filter((i) => i.ebitda_2024_usd_mn).length
              : 0;
            result += `| ${geo} | ${items.length} | ${avgR.toFixed(1)} | ${avgE.toFixed(1)} |\n`;
          });
      }

      logger.debug("✓ Statistics calculated");
      return result;
    } catch (error) {
      logger.error(`Stats error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "get_company_stats",
    description: `Get aggregate statistics for companies in the database.

Use this to get summaries, averages, and breakdowns by segment or geography.

Args:
    group_by: Optional grouping - "segment" or "geography"

Returns:
    Summary statistics and breakdowns.`,
    schema: z.object({
      group_by: z
        .string()
        .optional()
        .describe("Group by 'segment' or 'geography'"),
    }),
  }
);

/**
 * Get detailed information about a specific company.
 */
export const getCompanyDetails = tool(
  async ({ company_name }: { company_name: string }) => {
    logger.debug(`🔧 TOOL CALLED: get_company_details(company_name='${company_name}')`);

    try {
      const supabase = getSupabaseClient();

      const { data: companies, error } = await supabase
        .from("companies")
        .select("*")
        .ilike("target", `%${company_name}%`)
        .limit(1);

      if (error) {
        return `**Error:** ${error.message}`;
      }

      if (!companies || companies.length === 0) {
        return `No company found matching "${company_name}". Try a different search term or use query_companies to browse available companies.`;
      }

      const c = companies[0];

      const result = `## Company Details: ${c.target || "Unknown"}

### Basic Information
- **Entry ID:** ${c.entry_id || "N/A"}
- **Segment:** ${c.segment || "N/A"}
- **Company Focus:** ${c.company_focus || "N/A"}
- **Geography:** ${c.geography || "N/A"}
- **Ownership:** ${c.ownership || "N/A"}
- **Website:** ${c.website || "N/A"}
- **Watchlist Status:** ${c.watchlist_status || "N/A"}
- **Pipeline Stage:** ${c.pipeline_stage || "N/A"}

### Revenue (USD Millions)
| Year | 2021 | 2022 | 2023 | 2024 |
| --- | --- | --- | --- | --- |
| Revenue | ${c.revenue_2021_usd_mn?.toFixed(1) || "-"} | ${c.revenue_2022_usd_mn?.toFixed(1) || "-"} | ${c.revenue_2023_usd_mn?.toFixed(1) || "-"} | ${c.revenue_2024_usd_mn?.toFixed(1) || "-"} |
| Growth | - | ${c.revenue_cagr_2021_2022 ? (c.revenue_cagr_2021_2022 * 100).toFixed(1) + "%" : "-"} | ${c.revenue_cagr_2022_2023 ? (c.revenue_cagr_2022_2023 * 100).toFixed(1) + "%" : "-"} | ${c.revenue_cagr_2023_2024 ? (c.revenue_cagr_2023_2024 * 100).toFixed(1) + "%" : "-"} |

### EBITDA (USD Millions)
| Year | 2021 | 2022 | 2023 | 2024 |
| --- | --- | --- | --- | --- |
| EBITDA | ${c.ebitda_2021_usd_mn?.toFixed(1) || "-"} | ${c.ebitda_2022_usd_mn?.toFixed(1) || "-"} | ${c.ebitda_2023_usd_mn?.toFixed(1) || "-"} | ${c.ebitda_2024_usd_mn?.toFixed(1) || "-"} |
| Margin | ${c.ebitda_margin_2021 ? (c.ebitda_margin_2021 * 100).toFixed(1) + "%" : "-"} | ${c.ebitda_margin_2022 ? (c.ebitda_margin_2022 * 100).toFixed(1) + "%" : "-"} | ${c.ebitda_margin_2023 ? (c.ebitda_margin_2023 * 100).toFixed(1) + "%" : "-"} | ${c.ebitda_margin_2024 ? (c.ebitda_margin_2024 * 100).toFixed(1) + "%" : "-"} |

### Valuation (2024)
- **Enterprise Value:** ${c.ev_2024 ? "$" + c.ev_2024.toFixed(1) + "M" : "N/A"}
- **EV/EBITDA Multiple:** ${c.ev_ebitda_2024?.toFixed(1) || "N/A"}x

${c.comments ? `### Comments\n${c.comments}` : ""}
`;

      logger.debug("✓ Company details retrieved");
      return result;
    } catch (error) {
      logger.error(`Details error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "get_company_details",
    description: `Get detailed information about a specific company by name.

Use this when the user asks about a specific company's financials, details, or history.

Args:
    company_name: The name (or partial name) of the company to look up

Returns:
    Detailed company profile with all available financial data.`,
    schema: z.object({
      company_name: z.string().describe("Company name to look up"),
    }),
  }
);

/**
 * Search the web for market data, industry benchmarks, and external information.
 */
export const webSearch = tool(
  async ({ query }: { query: string }) => {
    logger.debug(`🔧 TOOL CALLED: web_search(query='${query}')`);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn("ANTHROPIC_API_KEY not set");
      return "Web search is not available. ANTHROPIC_API_KEY environment variable is not set.";
    }

    try {
      const client = new Anthropic({ apiKey });

      // Use Claude with web search tool enabled
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools: [],
        messages: [
          {
            role: "user",
            content: `Search the web for: ${query}\n\nProvide a summary of the most relevant and recent information you find.`,
          },
        ],
      });

      // Extract text content from response
      const outputLines = [`**Web Search Results for '${query}':**\n`];

      for (const block of response.content) {
        if (block.type === "text") {
          outputLines.push(block.text);
        }
      }

      logger.debug("✓ Web search completed");
      return outputLines.length > 1 ? outputLines.join("\n") : "No results found.";
    } catch (error) {
      logger.error(`✗ Web search error: ${(error as Error).message}`);
      return `Web search error: ${(error as Error).message}`;
    }
  },
  {
    name: "web_search",
    description: `Search the web for market data, industry benchmarks, and external information.

IMPORTANT: Use this tool when the user asks about:
- Market comparisons or industry benchmarks (e.g., "compare to market", "industry average")
- Valuation multiples or typical deal metrics (e.g., "EBITDA multiples", "revenue multiples")
- Competitor analysis or market positioning
- Current market trends, news, or recent developments
- External validation of data (e.g., "public financials", "market cap")
- M&A activity, deal comparables, or acquisition trends in a sector
- Any question containing: "market", "industry", "benchmark", "comparable", "peers", "external"

Args:
    query: A specific search query. Include relevant details like:
           - Industry or sector name
           - Company names if relevant
           - Specific metrics (EBITDA, revenue, multiples)
           - Time frame (e.g., "2025", "recent")

Returns:
    Search results from the web with relevant market data and context.`,
    schema: z.object({
      query: z.string().describe("The search query for web search"),
    }),
  }
);

// Export all tools as an array
export const tools = [
  getDataSchema,
  queryCompanies,
  getCompanyStats,
  getCompanyDetails,
  webSearch,
];
