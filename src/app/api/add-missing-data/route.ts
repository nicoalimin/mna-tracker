/**
 * API Route for adding missing company data.
 * Uses the agent to search for and update missing financial data before screening.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, HumanMessage } from "@/lib/agent";
import { createClient } from "@supabase/supabase-js";

interface CompanyData {
  id: string;
  name: string;
  segment?: string | null;
  geography?: string | null;
  revenue_2022_usd_mn?: number | null;
  revenue_2023_usd_mn?: number | null;
  revenue_2024_usd_mn?: number | null;
  ebitda_2022_usd_mn?: number | null;
  ebitda_2023_usd_mn?: number | null;
  ebitda_2024_usd_mn?: number | null;
  ev_2024?: number | null;
  company_focus?: string | null;
  ownership?: string | null;
  website?: string | null;
}

interface AddMissingDataRequest {
  companies: CompanyData[];
}

// Create a server-side Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, key);
}

const ADD_MISSING_DATA_PROMPT = `You are a data enrichment agent. Your task is to find missing financial data for companies.

For the company described below, please:
1. Use web_search to find the company's latest financial data
2. Use inven_paid_data_source_search if this is a known company to get Inven data
3. Focus on finding: revenue, EBITDA, enterprise value, employee count, and company description

## Company Information
{companyInfo}

## Missing Fields to Find
{missingFields}

## Response Format
Respond with a JSON object containing ONLY the fields you found data for. Use null for fields you couldn't find.
Format financial values in USD millions (e.g., 150.5 for $150.5M).

Example response:
{
  "revenue_2024_usd_mn": 150.5,
  "ebitda_2024_usd_mn": 25.3,
  "ev_2024": 500.0,
  "company_focus": "Enterprise software solutions"
}

Respond with the JSON object only, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body: AddMissingDataRequest = await request.json();
    const { companies } = body;

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: "No companies provided" },
        { status: 400 }
      );
    }

    const agent = getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not available. Please ensure ANTHROPIC_API_KEY is set." },
        { status: 500 }
      );
    }

    const supabase = getSupabaseClient();
    const results: { companyId: string; updated: boolean; fieldsUpdated: string[] }[] = [];

    // Process each company
    for (const company of companies) {
      // Identify missing fields
      const missingFields: string[] = [];
      if (company.revenue_2024_usd_mn == null) missingFields.push("revenue_2024_usd_mn");
      if (company.revenue_2023_usd_mn == null) missingFields.push("revenue_2023_usd_mn");
      if (company.ebitda_2024_usd_mn == null) missingFields.push("ebitda_2024_usd_mn");
      if (company.ebitda_2023_usd_mn == null) missingFields.push("ebitda_2023_usd_mn");
      if (company.ev_2024 == null) missingFields.push("ev_2024");
      if (!company.company_focus) missingFields.push("company_focus");
      if (!company.geography) missingFields.push("geography");
      if (!company.ownership) missingFields.push("ownership");

      // Skip if no missing fields
      if (missingFields.length === 0) {
        results.push({ companyId: company.id, updated: false, fieldsUpdated: [] });
        continue;
      }

      // Build company info for the prompt
      const companyInfo = [
        `Name: ${company.name}`,
        company.segment ? `Segment: ${company.segment}` : null,
        company.geography ? `Geography: ${company.geography}` : null,
        company.website ? `Website: ${company.website}` : null,
        company.company_focus ? `Focus: ${company.company_focus}` : null,
      ].filter(Boolean).join("\n");

      const prompt = ADD_MISSING_DATA_PROMPT
        .replace("{companyInfo}", companyInfo)
        .replace("{missingFields}", missingFields.join(", "));

      try {
        const result = await agent.invoke({
          messages: [new HumanMessage(prompt)],
        });

        const content = result.messages[0] || "";

        // Try to parse the response as JSON
        let foundData: Record<string, unknown> = {};
        try {
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            foundData = JSON.parse(jsonMatch[0]);
          }
        } catch {
          console.error(`Failed to parse response for ${company.name}`);
        }

        // Filter to only valid fields and non-null values
        const validFields = [
          "revenue_2022_usd_mn", "revenue_2023_usd_mn", "revenue_2024_usd_mn",
          "ebitda_2022_usd_mn", "ebitda_2023_usd_mn", "ebitda_2024_usd_mn",
          "ev_2024", "company_focus", "geography", "ownership", "segment"
        ];

        const updateData: Record<string, unknown> = {};
        const fieldsUpdated: string[] = [];

        for (const [key, value] of Object.entries(foundData)) {
          if (validFields.includes(key) && value != null && missingFields.includes(key)) {
            updateData[key] = value;
            fieldsUpdated.push(key);
          }
        }

        // Update company in database if we found data
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("companies")
            .update(updateData)
            .eq("id", company.id);

          if (updateError) {
            console.error(`Failed to update company ${company.id}:`, updateError);
            results.push({ companyId: company.id, updated: false, fieldsUpdated: [] });
          } else {
            results.push({ companyId: company.id, updated: true, fieldsUpdated });
          }
        } else {
          results.push({ companyId: company.id, updated: false, fieldsUpdated: [] });
        }
      } catch (error) {
        console.error(`Error enriching company ${company.name}:`, error);
        results.push({ companyId: company.id, updated: false, fieldsUpdated: [] });
      }
    }

    const updatedCount = results.filter(r => r.updated).length;

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} of ${companies.length} companies`,
      results,
    });
  } catch (error) {
    console.error("Add missing data error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const agent = getAgentGraph();
  return NextResponse.json({
    status: agent ? "ready" : "not_configured",
    message: agent ? "Add missing data endpoint is ready" : "Agent not available. Check ANTHROPIC_API_KEY.",
  });
}
