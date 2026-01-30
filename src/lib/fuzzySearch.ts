import levenshtein from 'fast-levenshtein';
import { createClient } from "@supabase/supabase-js";

// Create a server-side Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, key);
}

interface MatchResult {
  id: string;
  name: string;
  type: 'company' | 'past_acquisition';
  similarity: number;
}

/**
 * Finds the best matching company or past acquisition name using Levenshtein distance.
 * @param searchName - The name extracted from the document
 * @param threshold - The maximum relative distance allowed (0.0 to 1.0, where 0 is perfect match)
 * @returns The best match found or null
 */
export async function findBestCompanyMatch(
  searchName: string,
  threshold: number = 0.3
): Promise<MatchResult | null> {
  const supabase = getSupabaseClient();
  const normalizedSearch = searchName.toLowerCase().trim();

  // 1. Fetch all candidate names from companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, target');

  // 2. Fetch all candidate names from past_acquisitions
  const { data: pastDeals } = await supabase
    .from('past_acquisitions')
    .select('id, project_name');

  let bestMatch: MatchResult | null = null;
  let minDistance = Infinity;

  // Process companies
  if (companies) {
    for (const company of companies) {
      if (!company.target) continue;
      const targetName = company.target.toLowerCase().trim();

      // Early exit for exact match
      if (normalizedSearch === targetName) {
        return { id: company.id, name: company.target, type: 'company', similarity: 1 };
      }

      const distance = levenshtein.get(normalizedSearch, targetName);
      const relativeDistance = distance / Math.max(normalizedSearch.length, targetName.length);

      if (relativeDistance < minDistance) {
        minDistance = relativeDistance;
        bestMatch = { id: company.id, name: company.target, type: 'company', similarity: 1 - relativeDistance };
      }
    }
  }

  // Process past deals
  if (pastDeals) {
    for (const deal of pastDeals) {
      if (!deal.project_name) continue;
      const targetName = deal.project_name.toLowerCase().trim();

      // Early exit for exact match
      if (normalizedSearch === targetName) {
        return { id: deal.id, name: deal.project_name, type: 'past_acquisition', similarity: 1 };
      }

      const distance = levenshtein.get(normalizedSearch, targetName);
      const relativeDistance = distance / Math.max(normalizedSearch.length, targetName.length);

      if (relativeDistance < minDistance) {
        minDistance = relativeDistance;
        bestMatch = { id: deal.id, name: deal.project_name, type: 'past_acquisition', similarity: 1 - relativeDistance };
      }
    }
  }

  // Check if best match is within threshold
  if (bestMatch && (1 - bestMatch.similarity) <= threshold) {
    return bestMatch;
  }


  return null;
}

/**
 * Fetches all company targets and past acquisition project names from the database.
 * Usage: Inject this list into the LLM context so it knows what companies exist.
 */
export async function getAllCompanyReferences(): Promise<MatchResult[]> {
  const supabase = getSupabaseClient();

  // 1. Fetch all candidate names from companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, target');

  // 2. Fetch all candidate names from past_acquisitions
  const { data: pastDeals } = await supabase
    .from('past_acquisitions')
    .select('id, project_name');

  const matches: MatchResult[] = [];

  // Add companies
  if (companies) {
    for (const company of companies) {
      if (!company.target) continue;
      matches.push({
        id: company.id,
        name: company.target,
        type: 'company',
        similarity: 1
      });
    }
  }

  // Add past deals
  if (pastDeals) {
    for (const deal of pastDeals) {
      if (!deal.project_name) continue;
      matches.push({
        id: deal.id,
        name: deal.project_name,
        type: 'past_acquisition',
        similarity: 1
      });
    }
  }

  return matches;
}
