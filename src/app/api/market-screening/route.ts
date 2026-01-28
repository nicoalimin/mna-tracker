import { NextRequest, NextResponse } from 'next/server';
import { getAgentGraph, HumanMessage } from '@/lib/agent';
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createClient(url, key);
}

interface DiscoveredCompany {
  company_name: string;
  sector: string;
  description: string;
  match_score: number;
  match_reason: string;
  website: string;
  estimated_revenue: string;
  estimated_valuation: string;
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

    // Build the prompt for market scanning
    const prompt = `You are an M&A analyst conducting market screening. Use web_search to find REAL acquisition target companies that match the following investment thesis.

## Investment Thesis
${thesis}

## CRITICAL INSTRUCTIONS
1. **ONLY USE WEB SEARCH** - Do NOT query the internal database. Search the web for companies.
2. **EXCLUDE EXISTING COMPANIES** - Do NOT include any of these companies already in our pipeline: ${existingNames || 'None'}
3. **FIND NEW TARGETS** - Focus on discovering NEW companies we haven't tracked yet
4. **REAL COMPANIES ONLY** - Only return actual companies you find through web search with verifiable information

## Search Strategy
- Search for "${thesis.substring(0, 100)}" companies for acquisition
- Look for private equity targets, mid-market companies, and acquisition candidates
- Focus on companies with $10M - $500M revenue range
- Search for companies with available financial information

## Required Output Format
After searching, return your findings as a JSON object with EXACTLY this structure (no markdown, just raw JSON):
{
  "companies": [
    {
      "company_name": "Company Name",
      "sector": "Industry/Sector",
      "description": "Brief description of what the company does",
      "match_score": 85,
      "match_reason": "Why this company matches the thesis",
      "website": "company-website.com",
      "estimated_revenue": "$50M-$100M",
      "estimated_valuation": "$200M-$400M"
    }
  ]
}

Find ${sourcesCount} companies. Return ONLY the JSON object, no other text.`;

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

    // Insert results into the database
    const insertData = filteredCompanies.map((company) => ({
      company_name: company.company_name,
      sector: company.sector,
      description: company.description,
      match_score: company.match_score,
      match_reason: company.match_reason,
      website: company.website,
      estimated_revenue: company.estimated_revenue,
      estimated_valuation: company.estimated_valuation,
      is_added_to_pipeline: false,
      discovered_at: new Date().toISOString(),
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
