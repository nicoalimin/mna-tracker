/**
 * API Route for AI Screening.
 * Evaluates a single company against a single criteria using the LangGraph agent.
 * Returns structured result (pass/fail/inconclusive/error) and remarks.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, HumanMessage } from "@/lib/agent";
import { getToolDescriptions } from "@/lib/agent/tools";
import { z } from "zod";

// Schema for the screening result
const ScreeningResultSchema = z.object({
  result: z.enum(["pass", "fail", "inconclusive", "error"]),
  remarks: z.string(),
});

type ScreeningResult = z.infer<typeof ScreeningResultSchema>;

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

interface ScreeningRequest {
  companyId: string;
  criteriaId: string;
  criteriaPrompt: string;
  company: CompanyData;
}

const SCREENING_PROMPT_TEMPLATE = `You are an M&A screening analyst. Your task is to evaluate whether a company passes or fails a specific screening criterion.

## IMPORTANT: Use All Available Tools

You have access to these tools - USE THEM to gather more information:
{toolDescriptions}

**Before returning "inconclusive" due to missing data, ALWAYS try these steps:**
1. If financial data is missing, use web_search to find it (e.g., "Company Name revenue EBITDA financials 2024")
2. If industry context is needed, use web_search for benchmarks (e.g., "Industry average EBITDA margin")
3. If criteria requires specific company info not provided, search for it
4. If you need to compare with past deals, use query_past_acquisitions or compare_with_past_acquisitions

## Company Information Provided
{companyContext}

## Screening Criterion
{criteriaPrompt}

## Your Task
1. First, review the company information provided above
2. If ANY information needed for the criterion is missing, use the appropriate tool to find it
3. Evaluate whether the company passes or fails the criterion
4. Return your decision as JSON

## Response Format
Respond ONLY with a JSON object containing:
- "result": one of "pass", "fail", "inconclusive", or "error"
  - Use "pass" if the company clearly meets the criterion
  - Use "fail" if the company clearly does not meet the criterion
  - Use "inconclusive" ONLY if you've tried relevant tools and still can't find sufficient data
  - Use "error" only if you cannot process the request
- "remarks": A brief explanation of your decision (1-2 sentences), including what sources you used

Respond with the JSON object only, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body: ScreeningRequest = await request.json();
    const { companyId, criteriaId, criteriaPrompt, company } = body;

    // Validate required fields
    if (!companyId || !criteriaId || !criteriaPrompt || !company) {
      return NextResponse.json(
        { error: "Missing required fields: companyId, criteriaId, criteriaPrompt, company" },
        { status: 400 }
      );
    }

    // Get the agent
    const agent = await getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not available. Please ensure ANTHROPIC_API_KEY is set." },
        { status: 500 }
      );
    }

    // Build company context string
    const companyContext = buildCompanyContext(company);

    // Get dynamically injected tool descriptions
    const toolDescriptions = getToolDescriptions();

    // Create the evaluation prompt with tool descriptions
    const evaluationPrompt = SCREENING_PROMPT_TEMPLATE
      .replace("{toolDescriptions}", toolDescriptions)
      .replace("{companyContext}", companyContext)
      .replace("{criteriaPrompt}", criteriaPrompt);

    // Invoke the agent
    const result = await agent.invoke({
      messages: [new HumanMessage(evaluationPrompt)],
    });

    // Extract the response
    const content = result.messages[0] || "";

    let screeningResult: ScreeningResult;
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);
      screeningResult = ScreeningResultSchema.parse(parsed);
    } catch {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          screeningResult = ScreeningResultSchema.parse(parsed);
        } catch {
          screeningResult = {
            result: "error",
            remarks: "Failed to parse AI response",
          };
        }
      } else {
        screeningResult = {
          result: "error",
          remarks: "AI response was not in expected format",
        };
      }
    }

    return NextResponse.json({
      companyId,
      criteriaId,
      ...screeningResult,
    });
  } catch (error) {
    console.error("AI Screening error:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Internal server error",
        result: "error",
        remarks: "An error occurred during screening",
      },
      { status: 500 }
    );
  }
}

/**
 * Build a human-readable context string from company data.
 */
function buildCompanyContext(company: CompanyData): string {
  const lines: string[] = [];

  lines.push(`**Company Name:** ${company.name || "Unknown"}`);

  if (company.segment) lines.push(`**Segment:** ${company.segment}`);
  if (company.geography) lines.push(`**Geography:** ${company.geography}`);
  if (company.company_focus) lines.push(`**Focus:** ${company.company_focus}`);
  if (company.ownership) lines.push(`**Ownership:** ${company.ownership}`);
  if (company.website) lines.push(`**Website:** ${company.website}`);

  // Financial data
  const financials: string[] = [];
  if (company.revenue_2022_usd_mn != null) financials.push(`Revenue 2022: $${company.revenue_2022_usd_mn}M`);
  if (company.revenue_2023_usd_mn != null) financials.push(`Revenue 2023: $${company.revenue_2023_usd_mn}M`);
  if (company.revenue_2024_usd_mn != null) financials.push(`Revenue 2024: $${company.revenue_2024_usd_mn}M`);
  if (company.ebitda_2022_usd_mn != null) financials.push(`EBITDA 2022: $${company.ebitda_2022_usd_mn}M`);
  if (company.ebitda_2023_usd_mn != null) financials.push(`EBITDA 2023: $${company.ebitda_2023_usd_mn}M`);
  if (company.ebitda_2024_usd_mn != null) financials.push(`EBITDA 2024: $${company.ebitda_2024_usd_mn}M`);
  if (company.ev_2024 != null) financials.push(`EV 2024: $${company.ev_2024}M`);

  if (financials.length > 0) {
    lines.push(`**Financials:**`);
    lines.push(financials.join(" | "));
  } else {
    lines.push(`**Financials:** No financial data available`);
  }

  return lines.join("\n");
}

// Health check endpoint
export async function GET() {
  const agent = await getAgentGraph();
  return NextResponse.json({
    status: agent ? "ready" : "not_configured",
    message: agent ? "AI Screening endpoint is ready" : "Agent not available. Check ANTHROPIC_API_KEY.",
  });
}
