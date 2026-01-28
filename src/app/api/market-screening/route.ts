import { NextRequest, NextResponse } from 'next/server';
import { getAgentGraph, HumanMessage } from '@/lib/agent';
import { createClient } from '@supabase/supabase-js';
import { companiesSchema } from '@/lib/agent/tools';

// Create a server-side Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createClient(url, key);
}

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
    const agent = getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not available. Please ensure ANTHROPIC_API_KEY is set.' },
        { status: 500 }
      );
    }

    // Get existing company names to exclude
    const supabase = getSupabaseClient();
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('target');

    const existingNames = (existingCompanies || []).map((c: { target: string }) => c.target).join(', ');

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

    const responseText = result.messages[0] || '';

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
    const filteredCompanies = companies.filter(
      (company) => !existingNames.toLowerCase().includes(company.company_name.toLowerCase())
    );

    if (filteredCompanies.length === 0) {
      return NextResponse.json({ count: 0, message: 'All found companies are already in the database' });
    }

    // Insert results into the database with all schema fields
    const insertData = filteredCompanies.map((company) => ({
      // Core fields
      company_name: company.company_name,
      match_score: company.match_score,
      match_reason: company.match_reason,
      is_added_to_pipeline: false,
      discovered_at: new Date().toISOString(),
      thesis_content: thesis,
      // Basic info from schema
      target: company.target || company.company_name,
      segment: company.segment || company.sector,
      segment_related_offerings: company.segment_related_offerings,
      company_focus: company.company_focus,
      website: company.website,
      ownership: company.ownership,
      geography: company.geography,
      // Revenue (USD Mn)
      revenue_2021_usd_mn: company.revenue_2021_usd_mn,
      revenue_2022_usd_mn: company.revenue_2022_usd_mn,
      revenue_2023_usd_mn: company.revenue_2023_usd_mn,
      revenue_2024_usd_mn: company.revenue_2024_usd_mn,
      // EBITDA (USD Mn)
      ebitda_2021_usd_mn: company.ebitda_2021_usd_mn,
      ebitda_2022_usd_mn: company.ebitda_2022_usd_mn,
      ebitda_2023_usd_mn: company.ebitda_2023_usd_mn,
      ebitda_2024_usd_mn: company.ebitda_2024_usd_mn,
      // Valuation
      ev_2024: company.ev_2024,
      ev_ebitda_2024: company.ev_ebitda_2024,
      // Growth metrics
      revenue_cagr_2021_2022: company.revenue_cagr_2021_2022,
      revenue_cagr_2022_2023: company.revenue_cagr_2022_2023,
      revenue_cagr_2023_2024: company.revenue_cagr_2023_2024,
      // Margins
      ebitda_margin_2021: company.ebitda_margin_2021,
      ebitda_margin_2022: company.ebitda_margin_2022,
      ebitda_margin_2023: company.ebitda_margin_2023,
      ebitda_margin_2024: company.ebitda_margin_2024,
      // Legacy fields for backwards compatibility
      sector: company.sector || company.segment,
      description: company.description || company.company_focus,
      estimated_revenue: company.estimated_revenue,
      estimated_valuation: company.estimated_valuation,
    }));

    const { error: insertError } = await (supabase as any)
      .from('market_screening_results')
      .insert(insertData);

    if (insertError) {
      console.error('Error inserting results:', insertError);
      return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
    }

    // Update thesis last_scan_at if thesisId provided
    if (thesisId) {
      const nextScan = new Date();
      nextScan.setDate(nextScan.getDate() + 7); // Default to weekly

      await (supabase as any)
        .from('investment_thesis')
        .update({
          last_scan_at: new Date().toISOString(),
          next_scan_at: nextScan.toISOString(),
        })
        .eq('id', thesisId);
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
