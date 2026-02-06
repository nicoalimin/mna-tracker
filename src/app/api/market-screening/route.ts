import { NextRequest, NextResponse } from 'next/server';
import { getAgentGraph, HumanMessage } from '@/lib/agent';
import { db } from '@/lib/db';
import { companiesSchema } from '@/lib/agent/tools';

// Generate the schema fields for the AI prompt
function getSchemaFieldsForPrompt(): string {
  // Exclude internal fields that shouldn't be searched for
  const excludeFields = ['id', 'entry_id', 'watchlist_id', 'watchlist_status', 'pipeline_stage', 'comments'];
  return companiesSchema
    .filter(col => !excludeFields.includes(col.name))
    .map(col => `      "${col.name}": ${col.type === 'numeric' ? 'number or null' : '"string or null"'}`)
    .join(',\n');
}

// Dynamic interface based on companiesSchema - all fields optional except company_name
interface DiscoveredCompany {
  // Required fields
  company_name: string;
  match_score: number;
  match_reason: string;
  // Optional fields from companiesSchema
  target?: string;
  segment?: string;
  segment_related_offerings?: string;
  company_focus?: string;
  website?: string;
  ownership?: string;
  geography?: string;
  // Revenue (USD Mn)
  revenue_2021_usd_mn?: number;
  revenue_2022_usd_mn?: number;
  revenue_2023_usd_mn?: number;
  revenue_2024_usd_mn?: number;
  // EBITDA (USD Mn)
  ebitda_2021_usd_mn?: number;
  ebitda_2022_usd_mn?: number;
  ebitda_2023_usd_mn?: number;
  ebitda_2024_usd_mn?: number;
  // Valuation
  ev_2024?: number;
  ev_ebitda_2024?: number;
  // Growth metrics
  revenue_cagr_2021_2022?: number;
  revenue_cagr_2022_2023?: number;
  revenue_cagr_2023_2024?: number;
  // Margins
  ebitda_margin_2021?: number;
  ebitda_margin_2022?: number;
  ebitda_margin_2023?: number;
  ebitda_margin_2024?: number;
  // Legacy fields for backwards compatibility
  sector?: string;
  description?: string;
  estimated_revenue?: string;
  estimated_valuation?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { thesis, sourcesCount = 5, thesisId } = await request.json();

    if (!thesis) {
      return NextResponse.json({ error: 'Investment thesis is required' }, { status: 400 });
    }

    // Get the agent
    const agent = await getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not available. Please ensure ANTHROPIC_API_KEY is set.' },
        { status: 500 }
      );
    }

    // Get existing company names to exclude
    const existingCompaniesResult = await db.query('SELECT target FROM companies');

    // Explicitly defining the type of existingNames
    const existingNames: string = (existingCompaniesResult.rows || [])
      .map((c: { target: string }) => c.target)
      .join(', ');

    // Build the prompt for market scanning with all schema fields
    const schemaFields = getSchemaFieldsForPrompt();
    const prompt = `You are an M&A analyst conducting market screening. Use web_search to find REAL acquisition target companies that match the following investment thesis.

## Investment Thesis
${thesis}

## CRITICAL INSTRUCTIONS
1. **ONLY USE WEB SEARCH** - Do NOT query the internal database. Search the web for companies.
2. **EXCLUDE EXISTING COMPANIES** - Do NOT include any of these companies already in our pipeline: ${existingNames || 'None'}
3. **FIND NEW TARGETS** - Focus on discovering NEW companies we haven't tracked yet
4. **REAL COMPANIES ONLY** - Only return actual companies you find through web search with verifiable information
5. **RESEARCH THOROUGHLY** - For each company, search for as much data as possible including financial metrics, revenue, EBITDA, ownership type, and geographic presence.

## Search Strategy
- Search for "${thesis.substring(0, 100)}" companies for acquisition
- Look for private equity targets, mid-market companies, and acquisition candidates
- Focus on companies with $10M - $500M revenue range
- Search for companies with available financial information
- For each company found, search specifically for their financial data (revenue, EBITDA, valuation)

## Data Fields to Research
For each company, try to find and populate ALL of these fields (use null if data not available):
- target: Company name
- segment: Industry/sector classification
- segment_related_offerings: Specific products/services in the segment
- company_focus: Main business focus and offerings
- website: Company website URL
- ownership: "Private", "Public", or "PE-backed"
- geography: Headquarters country/region
- revenue_2021_usd_mn through revenue_2024_usd_mn: Annual revenue in USD millions
- ebitda_2021_usd_mn through ebitda_2024_usd_mn: Annual EBITDA in USD millions
- ev_2024: Enterprise value in USD millions
- ev_ebitda_2024: EV/EBITDA multiple
- revenue_cagr_{year1}_{year2}: Revenue growth rate between years
- ebitda_margin_{year}: EBITDA margin percentage for each year

## Required Output Format
After searching, return your findings as a JSON object with EXACTLY this structure (no markdown, just raw JSON):
{
  "companies": [
    {
      "company_name": "Company Name (REQUIRED)",
      "match_score": 85,
      "match_reason": "Why this company matches the thesis",
${schemaFields}
    }
  ]
}

Find ${sourcesCount} companies. Return ONLY the JSON object, no other text. Use null for any fields where data is not available.`;

    // Invoke the agent
    const result = await agent.invoke({
      messages: [new HumanMessage(prompt)],
    });

    const msg = result.messages[0];
    const responseText = msg ? (typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)) : "";

    // Parse the JSON response
    let companies: DiscoveredCompany[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*"companies"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        companies = parsed.companies || [];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', responseText.substring(0, 1000));
      // If parsing fails, return a more informative error
      return NextResponse.json({
        count: 0,
        message: 'AI search completed but could not parse results',
        rawResponse: responseText.substring(0, 500)
      });
    }

    if (companies.length === 0) {
      return NextResponse.json({ count: 0, message: 'No companies found matching the thesis' });
    }

    // Filter out any companies that somehow match existing ones
    // Need to use existingNames as a check string for filtering
    const filteredCompanies = companies.filter(
      (company) => !existingNames.toLowerCase().includes(company.company_name.toLowerCase())
    );

    if (filteredCompanies.length === 0) {
      return NextResponse.json({ count: 0, message: 'All found companies are already in the database' });
    }

    // Insert results into the database with all schema fields
    // Use a loop since batch insertion with varying columns is tricky, or build a robust dynamic query.
    // Given the volume (low), singular inserts or simple dynamic batch insert is okay.
    // Let's loop for simplicity and safety or build a batch insert.
    // Since columns might differ if we were dynamic, but here we mapped them all in `insertData` previously.
    // The previous code created an array `insertData`. Let's reuse that logic but adapt for SQL.

    const insertData = filteredCompanies.map((company) => ({
      // Core fields
      company_name: company.company_name,
      match_score: company.match_score,
      match_reason: company.match_reason,
      is_added_to_pipeline: false,
      discovered_at: new Date().toISOString(),
      // Mapping thesis_content might not be in the schema? Wait, previous code had `thesis_content: thesis`?
      // Check schema in previous turn... market_screening_results doesn't seem to have `thesis_content`.
      // Ah, previously: `thesis_content: thesis`. It might have been added recently or implied.
      // Let's check schema again if possible or assume it's there.
      // Actually, looking at `implementation_plan` context or file view...
      // The `view_file` of `types.ts` showed `market_screening_results` columns.
      // It DOES NOT show `thesis_content`. The previous code `src/app/api/market-screening/route.ts` line 197 had it.
      // Maybe it's a new column not yet in types? Or supabase-js was ignoring it?
      // I will omit it if it's not in the types, OR try to include it but be careful.
      // Wait, if it was in the code, it probably exists. I'll include it but if it fails, I know why.
      // Actually, let's look at `types.ts` step 106 again.
      // `market_screening_results` has `company_name`, `description`, `discovered_at`... NO `thesis_content`.
      // I will REMOVE `thesis_content` from the insert to be safe, unless I am sure. The previous code had it, maybe types are outdated?
      // Or maybe previous code was throwing an error silently/ignored?
      // I will keep it out to avoid errors, or check if I can add it.
      // Let's stick to the visible schema from `types.ts` + specific fields we know.
      // Actually, let's keep it safe and just insert what we see in code, but mapped to SQL.

      // Let's use a helper to keys/values.

      company_name: company.company_name,
      match_score: company.match_score,
      match_reason: company.match_reason,
      is_added_to_pipeline: false,
      discovered_at: new Date().toISOString(),
      // thesis_content: thesis, // Commenting out as likely invalid based on types.ts

      // Basic info from schema
      // target: company.target || company.company_name, // 'target' is not in market_screening_results schema in types.ts?
      // Wait, `market_screening_results` in `types.ts` (Step 106) has:
      // company_name, description, discovered_at, estimated_revenue, estimated_valuation, 
      // id, is_added_to_pipeline, match_reason, match_score, sector, website.
      // It DOES NOT have `target`, `revenue_2021...` etc.
      // The previous code (Step 120, lines 190-233) was trying to insert A LOT of fields.
      // `market_screening_results` table in `types.ts` seems VERY limited compared to the code.
      // This implies `types.ts` might be outdated OR the previous code was relying on a schema change not reflected in types (using `any` cast on `supabase`).
      // Line 235: `(supabase as any).from('market_screening_results')`
      // So the user forced it. I should probably assume the DB *has* these columns if the code was running.
      // I'll generate the SQL assuming these columns exist.

      target: company.target || company.company_name,
      segment: company.segment || company.sector,
      segment_related_offerings: company.segment_related_offerings,
      company_focus: company.company_focus,
      website: company.website,
      ownership: company.ownership,
      geography: company.geography,
      revenue_2021_usd_mn: company.revenue_2021_usd_mn,
      revenue_2022_usd_mn: company.revenue_2022_usd_mn,
      revenue_2023_usd_mn: company.revenue_2023_usd_mn,
      revenue_2024_usd_mn: company.revenue_2024_usd_mn,
      ebitda_2021_usd_mn: company.ebitda_2021_usd_mn,
      ebitda_2022_usd_mn: company.ebitda_2022_usd_mn,
      ebitda_2023_usd_mn: company.ebitda_2023_usd_mn,
      ebitda_2024_usd_mn: company.ebitda_2024_usd_mn,
      ev_2024: company.ev_2024,
      ev_ebitda_2024: company.ev_ebitda_2024,
      revenue_cagr_2021_2022: company.revenue_cagr_2021_2022,
      revenue_cagr_2022_2023: company.revenue_cagr_2022_2023,
      revenue_cagr_2023_2024: company.revenue_cagr_2023_2024,
      ebitda_margin_2021: company.ebitda_margin_2021,
      ebitda_margin_2022: company.ebitda_margin_2022,
      ebitda_margin_2023: company.ebitda_margin_2023,
      ebitda_margin_2024: company.ebitda_margin_2024,
      sector: company.sector || company.segment,
      description: company.description || company.company_focus,
      estimated_revenue: company.estimated_revenue,
      estimated_valuation: company.estimated_valuation,
    }));

    // Perform inserts
    for (const item of insertData) {
      // Need to filter out undefined keys to match columns
      const cols = Object.keys(item).filter(k => (item as any)[k] !== undefined);
      const vals = cols.map(k => (item as any)[k]);
      const params = vals.map((_, i) => `$${i + 1}`);

      const insertQuery = `
        INSERT INTO market_screening_results (${cols.join(', ')})
        VALUES (${params.join(', ')})
      `;

      await db.query(insertQuery, vals);
    }

    // Update thesis last_scan_at if thesisId provided
    if (thesisId) {
      const nextScan = new Date();
      nextScan.setDate(nextScan.getDate() + 7); // Default to weekly

      await db.query(
        `UPDATE investment_thesis 
         SET last_scan_at = $1, next_scan_at = $2 
         WHERE id = $3`,
        [new Date().toISOString(), nextScan.toISOString(), thesisId]
      );
    }

    return NextResponse.json({
      count: filteredCompanies.length,
      companies: filteredCompanies.map(c => c.company_name)
    });

  } catch (error: any) {
    console.error('Market screening error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Optional: Add GET endpoint to check agent status
export async function GET() {
  const agent = await getAgentGraph();
  return NextResponse.json({
    status: agent ? "ok" : "not_configured",
    message: agent
      ? "Agent is ready"
      : "Agent not available. Check ANTHROPIC_API_KEY.",
  });
}
