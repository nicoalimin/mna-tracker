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

export const companiesSchema = [
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

export const invenCacheSchema = [
  // Inven-specific identifiers
  { name: "inven_company_id", type: "text" },
  { name: "domain", type: "text" },
  { name: "inven_company_name", type: "text" },
  { name: "website", type: "text" },
  { name: "linkedin", type: "text" },
  { name: "description", type: "text" },
  { name: "logo_url", type: "text" },
  // Headcount
  { name: "headcount_min", type: "integer" },
  { name: "headcount_max", type: "integer" },
  { name: "employee_count", type: "integer" },
  // Financial estimates
  { name: "revenue_estimate_usd_millions", type: "numeric" },
  // Company info
  { name: "ownership", type: "text" },
  { name: "founded_year", type: "integer" },
  { name: "headquarters_city", type: "text" },
  { name: "headquarters_state", type: "text" },
  { name: "headquarters_country_code", type: "text" },
  // Plus all companies columns for enrichment
  ...companiesSchema,
];

/**
 * Get the schema of the companies data including column names and types.
 */
export const getDataSchema = tool(
  async () => {
    logger.debug("🔧 TOOL CALLED: get_data_schema()");

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

    const columnsInfo = companiesSchema.map((col) => `  - ${col.name} (${col.type})`);

    const result = `## Companies Data Schema

**Table:** companies
**Total Rows:** ${rowCount}
**Key Columns (${companiesSchema.length} total):**

${columnsInfo.join("\n")}

Use the query_companies tool to search and filter company data.
Use the get_company_stats tool for aggregate statistics.
`;

    logger.debug(`✓ Schema retrieved: ${companiesSchema.length} columns, ${rowCount} rows`);
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
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 5,
          },
        ],
        messages: [
          {
            role: "user",
            content: `Search the web for: ${query}\n\nProvide a summary of the most relevant and recent information you find.`,
          },
        ],
      } as any);

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

/**
 * Query past acquisitions with filters.
 */
export const queryPastAcquisitions = tool(
  async ({
    sector,
    country,
    status,
    project_type,
    year,
    search_term,
    limit = 20,
  }: {
    sector?: string;
    country?: string;
    status?: string;
    project_type?: string;
    year?: string;
    search_term?: string;
    limit?: number;
  }) => {
    logger.debug(
      `🔧 TOOL CALLED: query_past_acquisitions(sector='${sector}', country='${country}', search='${search_term}')`
    );

    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("past_acquisitions")
        .select(
          `
          id,
          no,
          project_name,
          project_type,
          target_co_partner,
          seller,
          country,
          sector,
          ev_100_pct_usd_m,
          revenue_usd_m,
          ebitda_usd_m,
          ebitda_margin_pct,
          status,
          internal_stage,
          year,
          pass_l0_screening,
          pass_all_5_l1_criteria
        `
        )
        .limit(Math.min(limit, 50));

      // Apply filters
      if (sector) {
        query = query.ilike("sector", `%${sector}%`);
      }
      if (country) {
        query = query.ilike("country", `%${country}%`);
      }
      if (status) {
        query = query.ilike("status", `%${status}%`);
      }
      if (project_type) {
        query = query.ilike("project_type", `%${project_type}%`);
      }
      if (year) {
        query = query.eq("year", year);
      }
      if (search_term) {
        query = query.or(
          `project_name.ilike.%${search_term}%,target_co_partner.ilike.%${search_term}%,sector.ilike.%${search_term}%`
        );
      }

      const { data: acquisitions, error } = await query;

      if (error) {
        logger.error(`Query error: ${error.message}`);
        return `**Query Error:** ${error.message}`;
      }

      if (!acquisitions || acquisitions.length === 0) {
        return "No past acquisitions found matching your criteria.";
      }

      // Format results as markdown table
      const header = "Project Name | Type | Sector | Country | EV ($M) | Revenue ($M) | EBITDA ($M) | Status | Year";
      const separator = "--- | --- | --- | --- | --- | --- | --- | --- | ---";

      const rows = acquisitions.map((a) => {
        const ev = a.ev_100_pct_usd_m || "-";
        const rev = a.revenue_usd_m || "-";
        const ebitda = a.ebitda_usd_m || "-";
        return `${a.project_name || "N/A"} | ${a.project_type || "-"} | ${a.sector || "-"} | ${a.country || "-"} | ${ev} | ${rev} | ${ebitda} | ${a.status || "-"} | ${a.year || "-"}`;
      });

      let result = `**Past Acquisitions (${acquisitions.length} deals):**\n\n`;
      result += `| ${header} |\n| ${separator} |\n`;
      result += rows.map((row) => `| ${row} |`).join("\n");

      logger.debug(`✓ Query returned ${acquisitions.length} past acquisitions`);
      return result;
    } catch (error) {
      logger.error(`Query error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "query_past_acquisitions",
    description: `Query past acquisitions from the database with optional filters.

Use this tool to find historical deals by sector, country, status, or search terms.
All filters are optional and can be combined.

Args:
    sector: Filter by sector (partial match, e.g., "Technology", "Healthcare")
    country: Filter by country (partial match, e.g., "USA", "Japan")
    status: Filter by deal status (e.g., "Closed", "Dropped")
    project_type: Filter by project type
    year: Filter by year
    search_term: Search across project name, target company, and sector
    limit: Maximum number of results (default: 20, max: 50)

Returns:
    A table of matching past acquisitions with key deal metrics.`,
    schema: z.object({
      sector: z.string().optional().describe("Filter by sector"),
      country: z.string().optional().describe("Filter by country"),
      status: z.string().optional().describe("Filter by deal status"),
      project_type: z.string().optional().describe("Filter by project type"),
      year: z.string().optional().describe("Filter by year"),
      search_term: z.string().optional().describe("Search term for name/sector"),
      limit: z.number().optional().default(20).describe("Max results to return"),
    }),
  }
);

/**
 * Compare a company against past acquisitions to evaluate fit.
 */
export const compareWithPastAcquisitions = tool(
  async ({
    company_name,
    sector,
    country,
    revenue_usd_m,
    ebitda_usd_m,
    ebitda_margin_pct,
    ev_usd_m,
  }: {
    company_name: string;
    sector?: string;
    country?: string;
    revenue_usd_m?: number;
    ebitda_usd_m?: number;
    ebitda_margin_pct?: number;
    ev_usd_m?: number;
  }) => {
    logger.debug(
      `🔧 TOOL CALLED: compare_with_past_acquisitions(company='${company_name}', sector='${sector}')`
    );

    try {
      const supabase = getSupabaseClient();

      // Get all past acquisitions for comparison
      const { data: acquisitions, error } = await supabase
        .from("past_acquisitions")
        .select("*");

      if (error) {
        logger.error(`Query error: ${error.message}`);
        return `**Query Error:** ${error.message}`;
      }

      if (!acquisitions || acquisitions.length === 0) {
        return "No past acquisitions data available for comparison.";
      }

      // Filter to similar deals if sector provided
      let comparableDeals = acquisitions;
      if (sector) {
        const sectorLower = sector.toLowerCase();
        comparableDeals = acquisitions.filter(
          (a) => a.sector?.toLowerCase().includes(sectorLower)
        );
      }
      if (country) {
        const countryLower = country.toLowerCase();
        comparableDeals = comparableDeals.filter(
          (a) => a.country?.toLowerCase().includes(countryLower)
        );
      }

      // Calculate statistics from comparable deals
      const parseNumeric = (val: string | null | undefined): number | null => {
        if (!val) return null;
        const num = parseFloat(val.replace(/[,$%]/g, ""));
        return isNaN(num) ? null : num;
      };

      const evValues = comparableDeals.map((a) => parseNumeric(a.ev_100_pct_usd_m)).filter((v): v is number => v !== null);
      const revValues = comparableDeals.map((a) => parseNumeric(a.revenue_usd_m)).filter((v): v is number => v !== null);
      const ebitdaValues = comparableDeals.map((a) => parseNumeric(a.ebitda_usd_m)).filter((v): v is number => v !== null);
      const marginValues = comparableDeals.map((a) => parseNumeric(a.ebitda_margin_pct)).filter((v): v is number => v !== null);

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const median = (arr: number[]) => {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      };
      const min = (arr: number[]) => arr.length > 0 ? Math.min(...arr) : 0;
      const max = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 0;

      // Count screening pass rates
      const passedL0 = comparableDeals.filter((a) =>
        a.pass_l0_screening?.toLowerCase() === "yes" || a.pass_l0_screening?.toLowerCase() === "true"
      ).length;
      const passedL1 = comparableDeals.filter((a) =>
        a.pass_all_5_l1_criteria?.toLowerCase() === "yes" || a.pass_all_5_l1_criteria?.toLowerCase() === "true"
      ).length;

      // Build comparison result
      let result = `## Comparison Analysis: ${company_name}\n\n`;
      result += `### Comparable Deals Overview\n`;
      result += `- **Total Past Acquisitions:** ${acquisitions.length}\n`;
      result += `- **Comparable Deals (${sector || "All"} ${country ? `in ${country}` : ""}):** ${comparableDeals.length}\n`;
      result += `- **L0 Screening Pass Rate:** ${comparableDeals.length > 0 ? ((passedL0 / comparableDeals.length) * 100).toFixed(1) : 0}%\n`;
      result += `- **L1 Criteria Pass Rate:** ${comparableDeals.length > 0 ? ((passedL1 / comparableDeals.length) * 100).toFixed(1) : 0}%\n\n`;

      result += `### Historical Deal Metrics (Comparable Deals)\n\n`;
      result += `| Metric | Min | Avg | Median | Max | ${company_name} | Fit |\n`;
      result += `| --- | --- | --- | --- | --- | --- | --- |\n`;

      // EV comparison
      if (evValues.length > 0) {
        const companyEv = ev_usd_m !== undefined ? ev_usd_m : null;
        const evFit = companyEv !== null
          ? (companyEv >= min(evValues) * 0.5 && companyEv <= max(evValues) * 1.5 ? "✅ Good" : "⚠️ Outside Range")
          : "N/A";
        result += `| EV ($M) | ${min(evValues).toFixed(1)} | ${avg(evValues).toFixed(1)} | ${median(evValues).toFixed(1)} | ${max(evValues).toFixed(1)} | ${companyEv?.toFixed(1) || "N/A"} | ${evFit} |\n`;
      }

      // Revenue comparison
      if (revValues.length > 0) {
        const companyRev = revenue_usd_m !== undefined ? revenue_usd_m : null;
        const revFit = companyRev !== null
          ? (companyRev >= min(revValues) * 0.5 && companyRev <= max(revValues) * 1.5 ? "✅ Good" : "⚠️ Outside Range")
          : "N/A";
        result += `| Revenue ($M) | ${min(revValues).toFixed(1)} | ${avg(revValues).toFixed(1)} | ${median(revValues).toFixed(1)} | ${max(revValues).toFixed(1)} | ${companyRev?.toFixed(1) || "N/A"} | ${revFit} |\n`;
      }

      // EBITDA comparison
      if (ebitdaValues.length > 0) {
        const companyEbitda = ebitda_usd_m !== undefined ? ebitda_usd_m : null;
        const ebitdaFit = companyEbitda !== null
          ? (companyEbitda >= min(ebitdaValues) * 0.5 && companyEbitda <= max(ebitdaValues) * 1.5 ? "✅ Good" : "⚠️ Outside Range")
          : "N/A";
        result += `| EBITDA ($M) | ${min(ebitdaValues).toFixed(1)} | ${avg(ebitdaValues).toFixed(1)} | ${median(ebitdaValues).toFixed(1)} | ${max(ebitdaValues).toFixed(1)} | ${companyEbitda?.toFixed(1) || "N/A"} | ${ebitdaFit} |\n`;
      }

      // Margin comparison
      if (marginValues.length > 0) {
        const companyMargin = ebitda_margin_pct !== undefined ? ebitda_margin_pct : null;
        const marginFit = companyMargin !== null
          ? (companyMargin >= 10 ? "✅ Good" : "⚠️ Below 10%")
          : "N/A";
        result += `| EBITDA Margin (%) | ${min(marginValues).toFixed(1)} | ${avg(marginValues).toFixed(1)} | ${median(marginValues).toFixed(1)} | ${max(marginValues).toFixed(1)} | ${companyMargin?.toFixed(1) || "N/A"} | ${marginFit} |\n`;
      }

      // Find most similar deals
      result += `\n### Most Similar Past Deals\n\n`;

      const scoredDeals = comparableDeals.map((deal) => {
        let score = 0;
        const dealEv = parseNumeric(deal.ev_100_pct_usd_m);
        const dealRev = parseNumeric(deal.revenue_usd_m);
        const dealEbitda = parseNumeric(deal.ebitda_usd_m);

        // Score based on similarity (lower diff = higher score)
        if (ev_usd_m && dealEv) {
          const diff = Math.abs(ev_usd_m - dealEv) / Math.max(ev_usd_m, dealEv);
          score += (1 - Math.min(diff, 1)) * 30;
        }
        if (revenue_usd_m && dealRev) {
          const diff = Math.abs(revenue_usd_m - dealRev) / Math.max(revenue_usd_m, dealRev);
          score += (1 - Math.min(diff, 1)) * 30;
        }
        if (ebitda_usd_m && dealEbitda) {
          const diff = Math.abs(ebitda_usd_m - dealEbitda) / Math.max(ebitda_usd_m, dealEbitda);
          score += (1 - Math.min(diff, 1)) * 40;
        }

        return { deal, score };
      });

      const topDeals = scoredDeals
        .filter((d) => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (topDeals.length > 0) {
        result += `| Project Name | Sector | EV ($M) | Revenue ($M) | EBITDA ($M) | Status | Similarity |\n`;
        result += `| --- | --- | --- | --- | --- | --- | --- |\n`;
        topDeals.forEach(({ deal, score }) => {
          result += `| ${deal.project_name || "N/A"} | ${deal.sector || "-"} | ${deal.ev_100_pct_usd_m || "-"} | ${deal.revenue_usd_m || "-"} | ${deal.ebitda_usd_m || "-"} | ${deal.status || "-"} | ${score.toFixed(0)}% |\n`;
        });
      } else {
        result += "No similar deals found. Provide financial metrics for better matching.\n";
      }

      // Overall assessment
      result += `\n### Overall Assessment\n\n`;
      const assessmentPoints: string[] = [];

      if (ev_usd_m !== undefined && evValues.length > 0) {
        if (ev_usd_m <= 1000) {
          assessmentPoints.push("✅ EV under $1B - meets size criteria");
        } else {
          assessmentPoints.push("⚠️ EV over $1B - may exceed typical deal size");
        }
      }

      if (ebitda_margin_pct !== undefined) {
        if (ebitda_margin_pct >= 10) {
          assessmentPoints.push("✅ EBITDA margin >10% - meets profitability criteria");
        } else {
          assessmentPoints.push("⚠️ EBITDA margin <10% - below typical threshold");
        }
      }

      if (comparableDeals.length >= 3) {
        assessmentPoints.push(`📊 ${comparableDeals.length} comparable past deals found for reference`);
      } else if (comparableDeals.length > 0) {
        assessmentPoints.push(`📊 Limited comparable deals (${comparableDeals.length}) - consider broader comparison`);
      }

      result += assessmentPoints.length > 0 ? assessmentPoints.join("\n") : "Provide more details for a complete assessment.";

      logger.debug("✓ Comparison analysis completed");
      return result;
    } catch (error) {
      logger.error(`Comparison error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "compare_with_past_acquisitions",
    description: `Compare a company against past acquisitions to evaluate strategic fit.

Use this tool when the user wants to:
- Evaluate if a company fits historical deal patterns
- Compare a target's metrics against past acquisition benchmarks
- Find similar past deals for reference
- Assess if a company meets typical screening criteria

Args:
    company_name: Name of the company to evaluate (required)
    sector: Company's sector for filtering comparable deals
    country: Company's country for filtering comparable deals
    revenue_usd_m: Company's revenue in USD millions
    ebitda_usd_m: Company's EBITDA in USD millions
    ebitda_margin_pct: Company's EBITDA margin percentage
    ev_usd_m: Company's enterprise value in USD millions

Returns:
    Detailed comparison analysis including:
    - Historical deal statistics from comparable acquisitions
    - Fit assessment against typical deal metrics
    - Most similar past deals
    - Overall strategic fit assessment`,
    schema: z.object({
      company_name: z.string().describe("Name of the company to evaluate"),
      sector: z.string().optional().describe("Company's sector"),
      country: z.string().optional().describe("Company's country"),
      revenue_usd_m: z.number().optional().describe("Revenue in USD millions"),
      ebitda_usd_m: z.number().optional().describe("EBITDA in USD millions"),
      ebitda_margin_pct: z.number().optional().describe("EBITDA margin percentage"),
      ev_usd_m: z.number().optional().describe("Enterprise value in USD millions"),
    }),
  }
);

/**
 * Get details of a specific past acquisition.
 */
export const getPastAcquisitionDetails = tool(
  async ({ project_name }: { project_name: string }) => {
    logger.debug(`🔧 TOOL CALLED: get_past_acquisition_details(project_name='${project_name}')`);

    try {
      const supabase = getSupabaseClient();

      const { data: acquisitions, error } = await supabase
        .from("past_acquisitions")
        .select("*")
        .ilike("project_name", `%${project_name}%`)
        .limit(1);

      if (error) {
        return `**Error:** ${error.message}`;
      }

      if (!acquisitions || acquisitions.length === 0) {
        return `No past acquisition found matching "${project_name}". Try a different search term or use query_past_acquisitions to browse available deals.`;
      }

      const a = acquisitions[0];

      const result = `## Past Acquisition Details: ${a.project_name || "Unknown"}

### Basic Information
- **No:** ${a.no || "N/A"}
- **Project Type:** ${a.project_type || "N/A"}
- **Target Company/Partner:** ${a.target_co_partner || "N/A"}
- **Seller:** ${a.seller || "N/A"}
- **Target Company Type:** ${a.target_co_company_type || "N/A"}
- **Country:** ${a.country || "N/A"}
- **Sector:** ${a.sector || "N/A"}
- **Year:** ${a.year || "N/A"}

### Deal Metrics
- **EV (100%):** $${a.ev_100_pct_usd_m || "N/A"}M
- **Equity Value:** $${a.equity_value || "N/A"}M
- **Estimated Debt:** $${a.estimated_debt_usd_m || "N/A"}M
- **Investment Value:** $${a.investment_value || "N/A"}M
- **Stake:** ${a.stake || "N/A"}

### Financial Performance
- **Revenue:** $${a.revenue_usd_m || "N/A"}M
- **EBITDA:** $${a.ebitda_usd_m || "N/A"}M
- **Net Income:** $${a.net_income_usd_m || "N/A"}M
- **EBITDA Margin:** ${a.ebitda_margin_pct || "N/A"}%
- **NIM:** ${a.nim_pct || "N/A"}%
- **FCF Conversion:** ${a.fcf_conv || "N/A"}

### Historical Financials
| Year | 2021 | 2022 | 2023 | 2024 |
| --- | --- | --- | --- | --- |
| Revenue ($M) | ${a.revenue_2021_usd_m || "-"} | ${a.revenue_2022_usd_m || "-"} | ${a.revenue_2023_usd_m || "-"} | ${a.revenue_2024_usd_m || "-"} |
| EBITDA ($M) | ${a.ebitda_2021_usd_m || "-"} | ${a.ebitda_2022_usd_m || "-"} | ${a.ebitda_2023_usd_m || "-"} | ${a.ebitda_2024_usd_m || "-"} |
| EBITDA Margin | ${a.ebitda_margin_2021 || "-"} | ${a.ebitda_margin_2022 || "-"} | ${a.ebitda_margin_2023 || "-"} | ${a.ebitda_margin_2024 || "-"} |

### Growth Metrics
- **2021-2022 CAGR:** ${a.cagr_2021_2022 || "N/A"}
- **2022-2023 CAGR:** ${a.cagr_2022_2023 || "N/A"}
- **2023-2024 CAGR:** ${a.cagr_2023_2024 || "N/A"}
- **Revenue CAGR (L3Y):** ${a.revenue_cagr_l3y || "N/A"}
- **Revenue Drop Count:** ${a.revenue_drop_count || "N/A"}

### Status & Screening
- **Internal Stage:** ${a.internal_stage || "N/A"}
- **Status:** ${a.status || "N/A"}
- **Prioritization:** ${a.prioritization || "N/A"}
- **Source:** ${a.source || "N/A"} (${a.type_of_source || "N/A"})
- **Internal Source:** ${a.internal_source || "N/A"}
- **Name of Advisors:** ${a.name_of_advisors || "N/A"}

### Screening Results
- **L0 Date:** ${a.l0_date || "N/A"}
- **Pass L0 Screening:** ${a.pass_l0_screening || "N/A"}
- **Reason to Drop:** ${a.reason_to_drop || "N/A"}
- **On Hold Reason:** ${a.on_hold_reason || "N/A"}

### L1 Criteria Assessment
- **Vision Alignment (>25% priority revenue):** ${a.vision_alignment_25pct_revenue || "N/A"}
- **Priority Geography (>50% US/JP/KR/TW/CN/ID):** ${a.priority_geography_50pct_revenue || "N/A"}
- **EV Value (<$1B):** ${a.ev_value_under_1b || "N/A"}
- **Revenue Stability (no consecutive drop):** ${a.revenue_stability_no_consecutive_drop || "N/A"}
- **EBITDA >10% over L3Y:** ${a.ebitda_over_10pct_l3y || "N/A"}
- **Pass All 5 L1 Criteria:** ${a.pass_all_5_l1_criteria || "N/A"}
- **Willingness to Sell:** ${a.willingness_to_sell || "N/A"}

### Product & Strategic Fit
- **Main Products:** ${a.main_products || "N/A"}
- **Company Website:** ${a.company_website || "N/A"}
- **Fit with Priority Product Groups:** ${a.fit_with_priority_product_groups || "N/A"}
- **Details on Product Fit:** ${a.details_on_product_fit || "N/A"}
- **% Revenue from Priority Segments:** ${a.pct_revenue_from_priority_segments || "N/A"}
- **Geography Breakdown:** ${a.geography_breakdown_of_revenue || "N/A"}

${a.comments ? `### Comments\n${a.comments}` : ""}
${a.assumption ? `### Assumptions\n${a.assumption}` : ""}
`;

      logger.debug("✓ Past acquisition details retrieved");
      return result;
    } catch (error) {
      logger.error(`Details error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "get_past_acquisition_details",
    description: `Get detailed information about a specific past acquisition by project name.

Use this when the user asks about a specific historical deal's details, screening criteria, or outcomes.

Args:
    project_name: The name (or partial name) of the project/deal to look up

Returns:
    Complete deal profile with all available financial data, screening results, and strategic fit assessment.`,
    schema: z.object({
      project_name: z.string().describe("Project name to look up"),
    }),
  }
);

/**
 * Parse a natural language search prompt into structured Inven API filters using Claude.
 */
async function parseSearchPromptToInvenFilters(prompt: string): Promise<{
  prompt?: string;
  keywords?: { keyword: string; weight: number }[];
  headquarters?: { countryCode: string }[];
  headcount?: { min?: number; max?: number };
  employeeCount?: { min?: number; max?: number };
  revenueEstimateUsdMillions?: { min?: number; max?: number };
  ownership?: string[];
  foundedYear?: { min?: number; max?: number };
}> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    logger.warn("ANTHROPIC_API_KEY not set, using prompt only");
    return { prompt };
  }

  try {
    const client = new Anthropic({ apiKey: anthropicApiKey });

    const systemPrompt = `You are a filter parser for the Inven company search API.
Given a natural language search query, extract structured filters.

Available filters:
- prompt: The main search description (industry, company type, etc.)
- keywords: Array of {keyword: string, weight: 1-3} for specific terms
- headquarters: Array of {countryCode: "XX"} using ISO 3166-1 alpha-2 codes (e.g., US, KR, JP, CN, DE, GB, FR)
- headcount: {min, max} for employee range
- employeeCount: {min, max} for exact employee count
- revenueEstimateUsdMillions: {min, max} in USD millions
- ownership: Array of "corporate", "public", "private_equity", "private_unknown", "venture_capital", "other"
- foundedYear: {min, max} for founding year

Enterprise Value approximation: If EV is mentioned, estimate revenue as EV/5 to EV/10 for typical multiples.

Country codes examples: US (United States), KR (Korea), JP (Japan), CN (China), DE (Germany), GB (UK), FR (France), ID (Indonesia), TW (Taiwan), SG (Singapore), IN (India), AU (Australia)

Respond ONLY with a valid JSON object, no explanation.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Parse this search query into Inven API filters:\n\n"${prompt}"`,
        },
      ],
    });

    const textContent = response.content.find((b) => b.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { prompt };
    }

    // Extract JSON from response
    let jsonStr = textContent.text.trim();
    // Handle markdown code blocks
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    const filters = JSON.parse(jsonStr);
    logger.debug(`✓ Parsed filters: ${JSON.stringify(filters)}`);
    return filters;
  } catch (error) {
    logger.error(`Filter parsing error: ${(error as Error).message}`);
    return { prompt };
  }
}

/**
 * Inven Paid Data Source Search
 * Searches for companies using Inven's AI-powered search.
 * Parses natural language into structured filters, then uses cache-first approach.
 */
export const invenPaidDataSourceSearch = tool(
  async ({
    search_prompt,
    number_of_results = 10,
  }: {
    search_prompt: string;
    number_of_results?: number;
  }) => {
    logger.debug(
      `🔧 TOOL CALLED: inven_paid_data_source_search(prompt='${search_prompt}', limit=${number_of_results})`
    );

    try {
      const supabase = getSupabaseClient();

      // First, check cache for matching companies
      const { data: cachedResults, error: cacheError } = await supabase
        .from("inven_cache")
        .select("inven_company_id, domain, inven_company_name, website")
        .or(`inven_company_name.ilike.%${search_prompt}%,description.ilike.%${search_prompt}%`)
        .limit(number_of_results);

      if (!cacheError && cachedResults && cachedResults.length > 0) {
        logger.debug(`✓ Found ${cachedResults.length} cached results`);

        const rows = cachedResults.map((c) =>
          `${c.inven_company_name || "N/A"} | ${c.domain || "-"} | ${c.website || "-"} | ${c.inven_company_id}`
        );

        let result = `**Cached Results (${cachedResults.length} companies):**\n\n`;
        result += `| Company Name | Domain | Website | Inven Company ID |\n`;
        result += `| --- | --- | --- | --- |\n`;
        result += rows.map((row) => `| ${row} |`).join("\n");
        result += `\n\n*Note: Results from cache. Use inven_paid_data_source_enrichment to get full details.*`;

        return result;
      }

      // If not in cache, call Inven API
      const apiKey = process.env.INVEN_API_KEY;
      if (!apiKey) {
        logger.warn("INVEN_API_KEY not set");
        return "Inven search is not available. INVEN_API_KEY environment variable is not set.";
      }

      // Parse the natural language prompt into structured filters
      logger.debug("Parsing search prompt into structured filters...");
      const parsedFilters = await parseSearchPromptToInvenFilters(search_prompt);

      // Build the filters object, only including non-empty fields
      const filters: Record<string, unknown> = {};

      if (parsedFilters.prompt) {
        filters.prompt = parsedFilters.prompt;
      }
      if (parsedFilters.keywords && parsedFilters.keywords.length > 0) {
        filters.keywords = parsedFilters.keywords;
      }
      if (parsedFilters.headquarters && parsedFilters.headquarters.length > 0) {
        filters.headquarters = parsedFilters.headquarters;
      }
      if (parsedFilters.headcount && (parsedFilters.headcount.min || parsedFilters.headcount.max)) {
        filters.headcount = parsedFilters.headcount;
      }
      if (parsedFilters.employeeCount && (parsedFilters.employeeCount.min || parsedFilters.employeeCount.max)) {
        filters.employeeCount = parsedFilters.employeeCount;
      }
      if (parsedFilters.revenueEstimateUsdMillions && (parsedFilters.revenueEstimateUsdMillions.min || parsedFilters.revenueEstimateUsdMillions.max)) {
        filters.revenueEstimateUsdMillions = parsedFilters.revenueEstimateUsdMillions;
      }
      if (parsedFilters.ownership && parsedFilters.ownership.length > 0) {
        filters.ownership = parsedFilters.ownership;
      }
      if (parsedFilters.foundedYear && (parsedFilters.foundedYear.min || parsedFilters.foundedYear.max)) {
        filters.foundedYear = parsedFilters.foundedYear;
      }

      logger.debug(`Calling Inven API with filters: ${JSON.stringify(filters)}`);

      const response = await fetch("https://api.inven.ai/public-api/v1/company-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          filters,
          numberOfResults: number_of_results,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Inven API error: ${response.status} - ${errorText}`);
        return `**Inven API Error:** ${response.status} - ${errorText}`;
      }

      const data = await response.json();
      const companies = data.companies || [];

      if (companies.length === 0) {
        return `No companies found matching: "${search_prompt}"\n\nFilters applied: ${JSON.stringify(filters, null, 2)}`;
      }

      // Format results
      const rows = companies.map((c: { companyName: string; domain: string; website: string; companyId: string }) =>
        `${c.companyName || "N/A"} | ${c.domain || "-"} | ${c.website || "-"} | ${c.companyId}`
      );

      let result = `**Inven Search Results (${companies.length} companies):**\n\n`;
      result += `| Company Name | Domain | Website | Inven Company ID |\n`;
      result += `| --- | --- | --- | --- |\n`;
      result += rows.map((row: string) => `| ${row} |`).join("\n");
      result += `\n\n**Filters Applied:**\n\`\`\`json\n${JSON.stringify(filters, null, 2)}\n\`\`\``;
      result += `\n\n*Use inven_paid_data_source_enrichment with the Inven Company IDs to get detailed data and save to cache.*`;

      logger.debug(`✓ Inven search returned ${companies.length} companies`);
      return result;
    } catch (error) {
      logger.error(`Inven search error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "inven_paid_data_source_search",
    description: `Search for companies using Inven's AI-powered company search.

Use this tool for Screening and Sourcing scenarios when you need to find companies.
The tool automatically parses natural language into structured filters (headquarters, revenue, headcount, etc.) before calling the API.
It first checks the local cache, then falls back to the Inven API.

Examples of search prompts:
- "Petrochemical companies in Korea with enterprise value less than USD 1 billion"
- "Technology company in the US with headcount of above 100 and revenue below USD 50 million"
- "Solar panel companies in Germany with revenue above 10 million"
- "Get me the company ID of Exxon Mobil"

Supported filters extracted from prompts:
- Industry/sector keywords
- Headquarters country (converted to ISO-2 codes)
- Revenue ranges (in USD millions)
- Employee count / headcount ranges
- Ownership type (public, private, VC-backed, etc.)
- Founded year ranges

Args:
    search_prompt: A specific natural language search prompt describing the companies you want to find
    number_of_results: Maximum number of results to return (default: 10)

Returns:
    A table of matching companies with Company ID, Domain, Name, and Website for further enrichment.`,
    schema: z.object({
      search_prompt: z.string().describe("Natural language search prompt for finding companies"),
      number_of_results: z.number().optional().default(10).describe("Maximum number of results to return"),
    }),
  }
);

/**
 * Inven Paid Data Source Enrichment
 * Gets detailed company data from Inven by company IDs and saves to cache.
 */
export const invenPaidDataSourceEnrichment = tool(
  async ({
    company_ids,
  }: {
    company_ids: string[];
  }) => {
    logger.debug(
      `🔧 TOOL CALLED: inven_paid_data_source_enrichment(company_ids=[${company_ids.join(", ")}])`
    );

    if (!company_ids || company_ids.length === 0) {
      return "**Error:** No company IDs provided. Use inven_paid_data_source_search first to get company IDs.";
    }

    try {
      const supabase = getSupabaseClient();
      const apiKey = process.env.INVEN_API_KEY;

      if (!apiKey) {
        logger.warn("INVEN_API_KEY not set");
        return "Inven enrichment is not available. INVEN_API_KEY environment variable is not set.";
      }

      logger.debug(`Calling Inven API for ${company_ids.length} companies...`);

      // Build identifiers array
      const identifiers = company_ids.map((id) => ({
        companyId: id,
        domain: null,
      }));

      const response = await fetch("https://api.inven.ai/public-api/v1/company-data-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          identifiers,
          selections: ["basic"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Inven API error: ${response.status} - ${errorText}`);
        return `**Inven API Error:** ${response.status} - ${errorText}`;
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        return `No data found for the provided company IDs.`;
      }

      // Save to cache and format results
      const enrichedCompanies: {
        companyId: string;
        companyName: string;
        domain: string;
        website: string;
        description: string;
        country: string;
        headcount: string;
        revenue: string;
        ownership: string;
      }[] = [];

      for (const result of results) {
        const basic = result.basic;
        if (!basic) continue;

        // Upsert to inven_cache
        const cacheRecord = {
          inven_company_id: basic.companyId,
          domain: basic.domain,
          inven_company_name: basic.companyName,
          website: basic.website,
          linkedin: basic.linkedin,
          description: basic.description,
          logo_url: basic.logoUrl,
          headcount_min: basic.headcount?.min,
          headcount_max: basic.headcount?.max,
          employee_count: basic.employeeCount,
          revenue_estimate_usd_millions: basic.revenueEstimateUsdMillions,
          ownership: basic.ownership,
          founded_year: basic.foundedYear,
          headquarters_city: basic.headquarters?.city,
          headquarters_state: basic.headquarters?.state,
          headquarters_country_code: basic.headquarters?.countryCode,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabase
          .from("inven_cache")
          .upsert(cacheRecord, { onConflict: "inven_company_id" });

        if (upsertError) {
          logger.error(`Cache upsert error for ${basic.companyId}: ${upsertError.message}`);
        } else {
          logger.debug(`✓ Cached company ${basic.companyId}`);
        }

        enrichedCompanies.push({
          companyId: basic.companyId,
          companyName: basic.companyName,
          domain: basic.domain,
          website: basic.website,
          description: basic.description,
          country: basic.headquarters?.countryCode || "N/A",
          headcount: basic.employeeCount ? String(basic.employeeCount) : (basic.headcount ? `${basic.headcount.min}-${basic.headcount.max}` : "N/A"),
          revenue: basic.revenueEstimateUsdMillions ? `$${basic.revenueEstimateUsdMillions}M` : "N/A",
          ownership: basic.ownership || "N/A",
        });
      }

      // Format detailed results
      let result = `**Enriched Company Data (${enrichedCompanies.length} companies):**\n\n`;

      for (const company of enrichedCompanies) {
        result += `### ${company.companyName}\n`;
        result += `- **Inven Company ID:** ${company.companyId}\n`;
        result += `- **Domain:** ${company.domain}\n`;
        result += `- **Website:** ${company.website}\n`;
        result += `- **Country:** ${company.country}\n`;
        result += `- **Headcount:** ${company.headcount}\n`;
        result += `- **Revenue Estimate:** ${company.revenue}\n`;
        result += `- **Ownership:** ${company.ownership}\n`;
        result += `- **Description:** ${company.description || "N/A"}\n\n`;
      }

      result += `*Data has been cached for future queries.*`;

      logger.debug(`✓ Enriched and cached ${enrichedCompanies.length} companies`);
      return result;
    } catch (error) {
      logger.error(`Inven enrichment error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "inven_paid_data_source_enrichment",
    description: `Get detailed company data from Inven by company IDs.

Use this tool ONLY when you have Inven Company IDs (from inven_paid_data_source_search).
The tool fetches detailed company data and saves it to the local cache for future use.

Args:
    company_ids: Array of Inven Company IDs to enrich (e.g., ["3588005", "179942"])

Returns:
    Detailed company profiles including description, headcount, revenue estimates, ownership, and headquarters.`,
    schema: z.object({
      company_ids: z.array(z.string()).describe("Array of Inven Company IDs to enrich"),
    }),
  }
);

/**
 * Query meeting notes based on matched companies, tags, or search terms.
 */
export const queryMeetingNotes = tool(
  async ({
    company_name,
    tag,
    search_term,
    limit = 10,
  }: {
    company_name?: string;
    tag?: string;
    search_term?: string;
    limit?: number;
  }) => {
    logger.debug(
      `🔧 TOOL CALLED: query_meeting_notes(company='${company_name}', tag='${tag}', search='${search_term}')`
    );

    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("minutes_of_meeting")
        .select("*")
        .order('file_date', { ascending: false })
        .limit(Math.min(limit, 20));

      // Apply filters
      if (company_name) {
        query = query.or(`raw_notes.ilike.%${company_name}%,structured_notes.ilike.%${company_name}%,matched_companies.ilike.%${company_name}%`);
      }

      if (tag) {
        query = query.contains('tags', [tag]);
      }

      if (search_term) {
        query = query.or(
          `file_name.ilike.%${search_term}%,raw_notes.ilike.%${search_term}%,structured_notes.ilike.%${search_term}%`
        );
      }

      const { data: notes, error } = await query;

      if (error) {
        logger.error(`Query error: ${error.message}`);
        return `**Query Error:** ${error.message}`;
      }

      if (!notes || notes.length === 0) {
        return "No meeting notes found matching your criteria.";
      }

      return formatNotesResults(notes);
    } catch (error) {
      logger.error(`Query error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
  {
    name: "query_meeting_notes",
    description: `Search and retrieve meeting notes.
    
Use this tool to find meeting records, summaries, and key points related to specific companies, tags, or topics.
You can filter by company name, tag, or use a general search term.

Args:
    company_name: Filter by associated company name
    tag: Filter by specific tag (e.g., "M&A", "Strategy", "Financials")
    search_term: General search term for file name or note content
    limit: Maximum number of results (default: 10, max: 20)

Returns:
    A summary of matching meeting notes.`,
    schema: z.object({
      company_name: z.string().optional().describe("Filter by company name"),
      tag: z.string().optional().describe("Filter by tag"),
      search_term: z.string().optional().describe("General search term"),
      limit: z.number().optional().default(10).describe("Max results to return"),
    }),
  }
);

function formatNotesResults(notes: any[]): string {
  let result = `**Meeting Notes Results (${notes.length} records):**\n\n`;

  notes.forEach((note, index) => {
    let structured = null;
    try {
      if (note.structured_notes) {
        structured = typeof note.structured_notes === 'string'
          ? JSON.parse(note.structured_notes)
          : note.structured_notes;
      }
    } catch (e) { }

    result += `### ${index + 1}. ${note.file_name}\n`;
    result += `- **Date:** ${note.file_date || 'N/A'}\n`;
    result += `- **Tags:** ${note.tags?.join(', ') || 'None'}\n`;

    if (structured && structured.summary) {
      result += `- **Summary:** ${structured.summary}\n`;
    } else if (note.raw_notes) {
      const excerpt = note.raw_notes.length > 200
        ? note.raw_notes.substring(0, 200) + "..."
        : note.raw_notes;
      result += `- **Excerpt:** ${excerpt}\n`;
    }

    if (structured && structured.key_points && structured.key_points.length > 0) {
      result += `- **Key Points:**\n  - ${structured.key_points.slice(0, 3).join('\n  - ')}\n`;
    }

    result += `\n`;
  });

  return result;
}

// Export all tools as an array
export const tools = [
  getDataSchema,
  queryCompanies,
  getCompanyStats,
  getCompanyDetails,
  webSearch,
  queryPastAcquisitions,
  compareWithPastAcquisitions,
  getPastAcquisitionDetails,
  invenPaidDataSourceSearch,
  invenPaidDataSourceEnrichment,
  queryMeetingNotes,
];

/**
 * Get a formatted list of tool names and descriptions for prompt injection.
 * Returns a markdown-formatted list of available tools.
 */
export function getToolDescriptions(): string {
  const toolInfo = [
    { name: "get_data_schema", description: "Get the database schema to understand available columns and data types" },
    { name: "query_companies", description: "Search and filter companies by segment, geography, revenue, EBITDA, and other criteria" },
    { name: "get_company_stats", description: "Get aggregate statistics and breakdowns by segment or geography" },
    { name: "get_company_details", description: "Get detailed information about a specific company by name" },
    { name: "web_search", description: "Search the web for company data, financials, market info, and external benchmarks" },
    { name: "query_past_acquisitions", description: "Query historical M&A deals by sector, country, status, or year" },
    { name: "compare_with_past_acquisitions", description: "Compare a company against historical acquisition metrics" },
    { name: "get_past_acquisition_details", description: "Get detailed information about a specific past acquisition" },
    { name: "inven_paid_data_source_search", description: "Search for companies using Inven's AI-powered search for Screening and Sourcing" },
    { name: "inven_paid_data_source_enrichment", description: "Get detailed company data from Inven by company IDs and cache results" },
    { name: "query_meeting_notes", description: "Search and retrieve meeting notes related to companies, tags, or topics" },
  ];

  return toolInfo.map((t, i) => `${i + 1}. **${t.name}** - ${t.description}`).join("\n");
}
