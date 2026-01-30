/**
 * Tool definitions for the Vercel AI SDK v6 agent.
 * Ported from the LangChain/LangGraph implementation.
 */
import { tool, type CoreTool } from "ai";
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

/**
 * 1. Get the schema of the companies data including column names and types.
 */
export const getDataSchema = tool({
  description: "Get the schema of the companies data including column names and types. Use this to understand what data is available before writing queries.",
  parameters: z.object({}),
  execute: async () => {
    logger.debug("🔧 TOOL CALLED: get_data_schema()");

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
});

/**
 * 2. Query companies with filters.
 */
export const queryCompanies = tool({
  description: "Query companies from the database with optional filters. Use this tool to find companies by segment, geography, financial metrics, or search terms.",
  parameters: z.object({
    segment: z.string().optional().describe("Filter by segment (partial match, e.g., 'Technology', 'Healthcare')"),
    geography: z.string().optional().describe("Filter by geography (partial match, e.g., 'USA', 'Japan', 'Europe')"),
    watchlist_status: z.string().optional().describe("Filter by status (e.g., 'Active', 'Inactive')"),
    min_revenue: z.number().optional().describe("Minimum 2024 revenue in USD millions"),
    max_revenue: z.number().optional().describe("Maximum 2024 revenue in USD millions"),
    min_ebitda: z.number().optional().describe("Minimum 2024 EBITDA in USD millions"),
    search_term: z.string().optional().describe("Search across target name, segment, and company focus"),
    limit: z.number().optional().default(20).describe("Maximum number of results (max: 50)"),
  }),
  execute: async (args: {
    segment?: string;
    geography?: string;
    watchlist_status?: string;
    min_revenue?: number;
    max_revenue?: number;
    min_ebitda?: number;
    search_term?: string;
    limit?: number;
  }) => {
    const {
      segment,
      geography,
      watchlist_status,
      min_revenue,
      max_revenue,
      min_ebitda,
      search_term,
      limit = 10,
    } = args;
    logger.debug(`🔧 TOOL CALLED: query_companies(segment='${segment}', geography='${geography}', search='${search_term}')`);

    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("companies")
        .select(`
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
        `)
        .limit(Math.min(limit, 50));

      if (segment) query = query.ilike("segment", `%${segment}%`);
      if (geography) query = query.ilike("geography", `%${geography}%`);
      if (watchlist_status) query = query.ilike("watchlist_status", `%${watchlist_status}%`);
      if (min_revenue !== undefined) query = query.gte("revenue_2024_usd_mn", min_revenue);
      if (max_revenue !== undefined) query = query.lte("revenue_2024_usd_mn", max_revenue);
      if (min_ebitda !== undefined) query = query.gte("ebitda_2024_usd_mn", min_ebitda);
      if (search_term) {
        query = query.or(`target.ilike.%${search_term}%,segment.ilike.%${search_term}%,company_focus.ilike.%${search_term}%`);
      }

      const { data: companies, error } = await query;

      if (error) {
        logger.error(`Query error: ${error.message}`);
        return `**Query Error:** ${error.message}`;
      }

      if (!companies || companies.length === 0) {
        return "No companies found matching your criteria.";
      }

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
});

/**
 * 3. Get aggregate statistics for companies.
 */
export const getCompanyStats = tool({
  description: "Get aggregate statistics for companies in the database. Use this to get summaries, averages, and breakdowns by segment or geography.",
  parameters: z.object({
    group_by: z.string().optional().describe("Optional grouping - 'segment' or 'geography'"),
  }),
  execute: async (args: { group_by: string }) => {
    const { group_by } = args;
    logger.debug(`🔧 TOOL CALLED: get_company_stats(group_by='${group_by}')`);

    try {
      const supabase = getSupabaseClient();
      const { data: companies, error } = await supabase.from("companies").select(`
        segment,
        geography,
        watchlist_status,
        revenue_2024_usd_mn,
        ebitda_2024_usd_mn,
        ev_2024,
        ebitda_margin_2024
      `);

      if (error) return `**Error:** ${error.message}`;
      if (!companies || companies.length === 0) return "No companies in the database.";

      const totalCompanies = companies.length;
      const withRevenue = companies.filter((c) => c.revenue_2024_usd_mn);
      const withEbitda = companies.filter((c) => c.ebitda_2024_usd_mn);

      const totalRevenue = withRevenue.reduce((sum, c) => sum + (c.revenue_2024_usd_mn || 0), 0);
      const avgRevenue = withRevenue.length > 0 ? totalRevenue / withRevenue.length : 0;
      const totalEbitda = withEbitda.reduce((sum, c) => sum + (c.ebitda_2024_usd_mn || 0), 0);
      const avgEbitda = withEbitda.length > 0 ? totalEbitda / withEbitda.length : 0;

      let result = `## Company Statistics\n\n**Overall Summary:**\n- Total Companies: ${totalCompanies}\n- Companies with Revenue Data: ${withRevenue.length}\n- Companies with EBITDA Data: ${withEbitda.length}\n- Total Revenue (2024): $${totalRevenue.toFixed(1)}M\n- Average Revenue (2024): $${avgRevenue.toFixed(1)}M\n- Total EBITDA (2024): $${totalEbitda.toFixed(1)}M\n- Average EBITDA (2024): $${avgEbitda.toFixed(1)}M\n\n`;

      if (group_by === "segment" || !group_by) {
        const bySegment = new Map<string, typeof companies>();
        companies.forEach((c) => {
          const key = c.segment || "Unknown";
          if (!bySegment.has(key)) bySegment.set(key, []);
          bySegment.get(key)!.push(c);
        });
        result += `**By Segment:**\n\n| Segment | Count | Avg Rev ($M) | Avg EBITDA ($M) |\n| --- | --- | --- | --- |\n`;
        Array.from(bySegment.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 15).forEach(([segment, items]) => {
          const avgR = items.filter(i => i.revenue_2024_usd_mn).length > 0 ? items.reduce((s, i) => s + (i.revenue_2024_usd_mn || 0), 0) / items.filter(i => i.revenue_2024_usd_mn).length : 0;
          const avgE = items.filter(i => i.ebitda_2024_usd_mn).length > 0 ? items.reduce((s, i) => s + (i.ebitda_2024_usd_mn || 0), 0) / items.filter(i => i.ebitda_2024_usd_mn).length : 0;
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
        result += `\n**By Geography:**\n\n| Geography | Count | Avg Rev ($M) | Avg EBITDA ($M) |\n| --- | --- | --- | --- |\n`;
        Array.from(byGeo.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 15).forEach(([geo, items]) => {
          const avgR = items.filter(i => i.revenue_2024_usd_mn).length > 0 ? items.reduce((s, i) => s + (i.revenue_2024_usd_mn || 0), 0) / items.filter(i => i.revenue_2024_usd_mn).length : 0;
          const avgE = items.filter(i => i.ebitda_2024_usd_mn).length > 0 ? items.reduce((s, i) => s + (i.ebitda_2024_usd_mn || 0), 0) / items.filter(i => i.ebitda_2024_usd_mn).length : 0;
          result += `| ${geo} | ${items.length} | ${avgR.toFixed(1)} | ${avgE.toFixed(1)} |\n`;
        });
      }
      return result;
    } catch (error) {
      logger.error(`Stats error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
});

/**
 * 4. Get detailed information about a specific company.
 */
export const getCompanyDetails = tool({
  description: "Get detailed information about a specific company by name. Use this when the user asks about a specific company's financials, details, or history.",
  parameters: z.object({
    company_name: z.string().describe("Company name to look up"),
  }),
  execute: async (args: { company_name: string }) => {
    const { company_name } = args;
    logger.debug(`🔧 TOOL CALLED: get_company_details(company_name='${company_name}')`);

    try {
      const supabase = getSupabaseClient();
      const { data: companies, error } = await supabase.from("companies").select("*").ilike("target", `%${company_name}%`).limit(1);

      if (error) return `**Error:** ${error.message}`;
      if (!companies || companies.length === 0) return `No company found matching "${company_name}".`;

      const c = companies[0];
      return `## Company Details: ${c.target || "Unknown"}

### Basic Information
- **Segment:** ${c.segment || "N/A"}
- **Company Focus:** ${c.company_focus || "N/A"}
- **Geography:** ${c.geography || "N/A"}
- **Ownership:** ${c.ownership || "N/A"}
- **Website:** ${c.website || "N/A"}
- **Pipeline Stage:** ${c.pipeline_stage || "N/A"}

### Financials (2024)
- **Revenue:** ${c.revenue_2024_usd_mn ? "$" + c.revenue_2024_usd_mn.toFixed(1) + "M" : "N/A"}
- **EBITDA:** ${c.ebitda_2024_usd_mn ? "$" + c.ebitda_2024_usd_mn.toFixed(1) + "M" : "N/A"}
- **EBITDA Margin:** ${c.ebitda_margin_2024 ? (c.ebitda_margin_2024 * 100).toFixed(1) + "%" : "N/A"}
- **Enterprise Value:** ${c.ev_2024 ? "$" + c.ev_2024.toFixed(1) + "M" : "N/A"}
- **EV/EBITDA Multiple:** ${c.ev_ebitda_2024?.toFixed(1) || "N/A"}x

${c.comments ? `### Comments\n${c.comments}\n` : ""}
`;
    } catch (error) {
      logger.error(`Details error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
});

/**
 * 5. Search the web for market data and industry benchmarks.
 */
export const webSearch = tool({
  description: "Search the web for market data, industry benchmarks, and external information. Use this as a fallback when database queries don't return sufficient info or for market context.",
  parameters: z.object({
    query: z.string().describe("The search query for web search"),
  }),
  execute: async (args: { query: string }) => {
    const { query } = args;
    logger.debug(`🔧 TOOL CALLED: web_search(query='${query}')`);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return "Web search not available (API key missing).";

    try {
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1024,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        messages: [{ role: "user", content: `Search the web for: ${query}. Summarize the results.` }],
      } as any);

      const outputLines = [`**Web Search Results for '${query}':**\n`];
      for (const block of response.content) {
        if (block.type === "text") outputLines.push(block.text);
      }
      return outputLines.length > 1 ? outputLines.join("\n") : "No results found.";
    } catch (error) {
      logger.error(`Web search error: ${(error as Error).message}`);
      return `Web search error: ${(error as Error).message}`;
    }
  },
});

/**
 * 6. Query past acquisitions with filters.
 */
export const queryPastAcquisitions = tool({
  description: "Query past acquisitions from the database with optional filters. Use this tool to find historical deals by sector, country, status, or search terms.",
  parameters: z.object({
    sector: z.string().optional().describe("Filter by sector"),
    country: z.string().optional().describe("Filter by country"),
    status: z.string().optional().describe("Filter by deal status"),
    search_term: z.string().optional().describe("Search term for name/sector"),
    limit: z.number().optional().default(20).describe("Max results to return"),
  }),
  execute: async (args: {
    sector?: string;
    country?: string;
    status?: string;
    search_term?: string;
    limit?: number;
  }) => {
    const {
      sector,
      country,
      status,
      search_term,
      limit = 10,
    } = args;
    logger.debug(`🔧 TOOL CALLED: query_past_acquisitions(sector='${sector}', search='${search_term}')`);

    try {
      const supabase = getSupabaseClient();
      let query = supabase.from("past_acquisitions").select(`
        id, project_name, sector, country, ev_100_pct_usd_m, revenue_usd_m, ebitda_usd_m, status, year
      `).limit(Math.min(limit, 50));

      if (sector) query = query.ilike("sector", `%${sector}%`);
      if (country) query = query.ilike("country", `%${country}%`);
      if (status) query = query.ilike("status", `%${status}%`);
      if (search_term) {
        query = query.or(`project_name.ilike.%${search_term}%,target_co_partner.ilike.%${search_term}%,sector.ilike.%${search_term}%`);
      }

      const { data: acquisitions, error } = await query;
      if (error) return `**Error:** ${error.message}`;
      if (!acquisitions || acquisitions.length === 0) return "No past acquisitions found.";

      const header = "Project Name | Sector | Country | EV ($M) | Revenue ($M) | EBITDA ($M) | Status | Year";
      const separator = "--- | --- | --- | --- | --- | --- | --- | ---";
      const rows = acquisitions.map((a) => `${a.project_name || "N/A"} | ${a.sector || "-"} | ${a.country || "-"} | ${a.ev_100_pct_usd_m || "-"} | ${a.revenue_usd_m || "-"} | ${a.ebitda_usd_m || "-"} | ${a.status || "-"} | ${a.year || "-"}`);

      let result = `**Past Acquisitions (${acquisitions.length} deals):**\n\n| ${header} |\n| ${separator} |\n` + rows.map(r => `| ${r} |`).join("\n");
      return result;
    } catch (error) {
      logger.error(`Query error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
});

/**
 * 7. Compare a company against past acquisitions to evaluate strategic fit.
 */
export const compareWithPastAcquisitions = tool({
  description: "Compare a company against past acquisitions to evaluate strategic fit. Assess if a company meets typical screening criteria and find similar deals.",
  parameters: z.object({
    company_name: z.string().describe("Name of the company to evaluate"),
    sector: z.string().optional().describe("Company's sector"),
    revenue_usd_m: z.number().optional().describe("Revenue in USD millions"),
    ebitda_usd_m: z.number().optional().describe("EBITDA in USD millions"),
    ev_usd_m: z.number().optional().describe("Enterprise value in USD millions"),
  }),
  execute: async (args: {
    company_name: string;
    sector?: string;
    revenue_usd_m?: number;
    ebitda_usd_m?: number;
    ev_usd_m?: number;
  }) => {
    const {
      company_name,
      sector,
      revenue_usd_m,
      ebitda_usd_m,
      ev_usd_m,
    } = args;
    logger.debug(`🔧 TOOL CALLED: compare_with_past_acquisitions(company='${company_name}')`);

    try {
      const supabase = getSupabaseClient();
      const { data: acquisitions, error } = await supabase.from("past_acquisitions").select("*");
      if (error) return `**Error:** ${error.message}`;
      if (!acquisitions || acquisitions.length === 0) return "No past deals data.";

      let comparable = acquisitions;
      if (sector) comparable = acquisitions.filter(a => a.sector?.toLowerCase().includes(sector.toLowerCase()));

      const parseNumeric = (val: string | null) => val ? parseFloat(String(val).replace(/[,$]/g, "")) : 0;
      const evs = comparable.map(a => parseNumeric(a.ev_100_pct_usd_m)).filter(v => v > 0);
      const revs = comparable.map(a => parseNumeric(a.revenue_usd_m)).filter(v => v > 0);

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      let result = `## Comparison: ${company_name}\n\n- Comparable Deals: ${comparable.length}\n- Avg EV: $${avg(evs).toFixed(1)}M\n- Avg Revenue: $${avg(revs).toFixed(1)}M\n\n### Assessment\n`;
      if (ev_usd_m && ev_usd_m < 1000) result += "- ✅ Meets typical size criteria (<$1B)\n";
      if (revenue_usd_m && revenue_usd_m > avg(revs)) result += "- ✅ Above average historical revenue\n";

      return result;
    } catch (error) {
      logger.error(`Comparison error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
});

/**
 * 8. Get details of a specific past acquisition.
 */
export const getPastAcquisitionDetails = tool({
  description: "Get detailed information about a specific past acquisition by project name. Use this when the user asks about historical deal screening or outcomes.",
  parameters: z.object({
    project_name: z.string().describe("Project name to look up"),
  }),
  execute: async (args: { project_name: string }) => {
    const { project_name } = args;
    logger.debug(`🔧 TOOL CALLED: get_past_acquisition_details(project_name='${project_name}')`);

    try {
      const supabase = getSupabaseClient();
      const { data: acquisitions, error } = await supabase.from("past_acquisitions").select("*").ilike("project_name", `%${project_name}%`).limit(1);

      if (error) return `**Error:** ${error.message}`;
      if (!acquisitions || acquisitions.length === 0) return `No deal found matching "${project_name}".`;

      const a = acquisitions[0];
      return `## Past Acquisition: ${a.project_name}\n\n- **Project Type:** ${a.project_type || "N/A"}\n- **Country:** ${a.country || "N/A"}\n- **Year:** ${a.year || "N/A"}\n- **EV (100%):** $${a.ev_100_pct_usd_m || "N/A"}M\n- **Revenue:** $${a.revenue_usd_m || "N/A"}M\n- **Status:** ${a.status || "N/A"}\n- **Reason to Drop:** ${a.reason_to_drop || "N/A"}\n`;
    } catch (error) {
      logger.error(`Details error: ${(error as Error).message}`);
      return `**Error:** ${(error as Error).message}`;
    }
  },
});

/**
 * Helper to parse search prompts for Inven.
 */
async function parseSearchPromptToInvenFilters(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { prompt };

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 512,
      system: "Parse this search query into Inven API filters. Respond ONLY with JSON: {prompt, keywords: [{keyword, weight}], headquarters: [{countryCode}], revenueEstimateUsdMillions: {min, max}}",
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as any).text;
    return JSON.parse(text);
  } catch (e) {
    return { prompt };
  }
}

/**
 * 9. Inven Paid Data Source Search
 */
export const invenSearch = tool({
  description: "Search for companies using Inven's AI-pushed company search. Use for Screening/Sourcing scenarios.",
  parameters: z.object({
    search_prompt: z.string().describe("Natural language search prompt"),
    number_of_results: z.number().optional().default(10).describe("Max results"),
  }),
  execute: async (args: {
    search_prompt: string;
    number_of_results?: number;
  }) => {
    const { search_prompt, number_of_results = 5 } = args;
    logger.debug(`🔧 TOOL CALLED: inven_search(prompt='${search_prompt}')`);

    try {
      const supabase = getSupabaseClient();
      const { data: cached } = await supabase.from("inven_cache").select("inven_company_id, domain, inven_company_name").or(`inven_company_name.ilike.%${search_prompt}%,description.ilike.%${search_prompt}%`).limit(number_of_results);

      if (cached && cached.length > 0) {
        return `**Cached Results:**\n\n| Name | Domain | ID |\n| --- | --- | --- |\n` + cached.map(c => `| ${c.inven_company_name} | ${c.domain} | ${c.inven_company_id} |`).join("\n");
      }

      const apiKey = process.env.INVEN_API_KEY;
      if (!apiKey) return "Inven API key not set.";

      const filters = await parseSearchPromptToInvenFilters(search_prompt);
      const resp = await fetch("https://api.inven.ai/public-api/v1/company-search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ filters, numberOfResults: number_of_results }),
      });

      if (!resp.ok) return "Inven API Error.";
      const data = await resp.json();
      const companies = data.companies || [];
      if (companies.length === 0) return "No Inven results.";

      return `**Inven Results:**\n\n| Name | Domain | ID |\n| --- | --- | --- |\n` + companies.map((c: any) => `| ${c.companyName} | ${c.domain} | ${c.companyId} |`).join("\n");
    } catch (error) {
      return `**Error:** ${(error as Error).message}`;
    }
  },
});

/**
 * 10. Inven Paid Data Source Enrichment
 */
export const invenEnrich = tool({
  description: "Get detailed company data from Inven by company IDs and saves to cache.",
  parameters: z.object({
    company_ids: z.array(z.string()).describe("Array of Inven Company IDs"),
  }),
  execute: async (args: { company_ids: string[] }) => {
    const { company_ids } = args;
    logger.debug(`🔧 TOOL CALLED: inven_enrich(ids=[${company_ids.join(", ")}])`);

    const apiKey = process.env.INVEN_API_KEY;
    if (!apiKey) return "Inven API key not set.";

    try {
      const resp = await fetch("https://api.inven.ai/public-api/v1/company-data-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ identifiers: company_ids.map(id => ({ companyId: id, domain: null })), selections: ["basic"] }),
      });

      if (!resp.ok) return "Inven API Error.";
      const data = await resp.json();
      return `**Enriched Data:**\n\n` + (data.results || []).map((r: any) => `### ${r.basic.companyName}\n- Revenue: $${r.basic.revenueEstimateUsdMillions}M\n- Employees: ${r.basic.employeeCount}\n`).join("\n");
    } catch (error) {
      return `**Error:** ${(error as Error).message}`;
    }
  },
});

/**
 * 11. Query meeting notes.
 */
export const queryMeetingNotes = tool({
  description: "Search and retrieve meeting notes related to companies, tags, or topics.",
  parameters: z.object({
    company_name: z.string().optional().describe("Filter by company name"),
    tag: z.string().optional().describe("Filter by tag"),
    search_term: z.string().optional().describe("General search term"),
    limit: z.number().optional().default(10),
  }),
  execute: async (args: {
    company_name?: string;
    tag?: string;
    search_term?: string;
    limit?: number;
  }) => {
    const {
      company_name,
      tag,
      search_term,
      limit = 10,
    } = args;
    logger.debug(`🔧 TOOL CALLED: query_meeting_notes(search='${search_term}')`);

    try {
      const supabase = getSupabaseClient();
      let query = supabase.from("minutes_of_meeting").select("*").order('file_date', { ascending: false }).limit(limit);

      if (company_name) query = query.or(`raw_notes.ilike.%${company_name}%,structured_notes.ilike.%${company_name}%,matched_companies.ilike.%${company_name}%`);
      if (tag) query = query.contains('tags', [tag]);
      if (search_term) query = query.or(`file_name.ilike.%${search_term}%,raw_notes.ilike.%${search_term}%,structured_notes.ilike.%${search_term}%`);

      const { data: notes, error } = await query;
      if (error) return `**Error:** ${error.message}`;
      if (!notes || notes.length === 0) return "No notes found.";

      return `**Meeting Notes (${notes.length}):**\n\n` + notes.map(n => `### ${n.file_name}\n- Date: ${n.file_date}\n- Tags: ${n.tags?.join(", ")}\n`).join("\n");
    } catch (error) {
      return `**Error:** ${(error as Error).message}`;
    }
  },
});

// Export all tools as a record
export const tools: Record<string, CoreTool<any, any>> = {
  get_data_schema: getDataSchema,
  query_companies: queryCompanies,
  get_company_stats: getCompanyStats,
  get_company_details: getCompanyDetails,
  web_search: webSearch,
  query_past_acquisitions: queryPastAcquisitions,
  compare_with_past_acquisitions: compareWithPastAcquisitions,
  get_past_acquisition_details: getPastAcquisitionDetails,
  inven_search: invenSearch,
  inven_enrich: invenEnrich,
  query_meeting_notes: queryMeetingNotes,
};
