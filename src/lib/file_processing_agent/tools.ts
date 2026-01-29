import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { findBestCompanyMatch } from "../fuzzySearch";
import { logger } from "../agent/logger";

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
 * Tool for fuzzy searching companies or past acquisitions.
 */
export const fuzzySearchCompanyTool = tool(
  async ({ name }: { name: string }) => {
    logger.debug(`🔧 TOOL CALLED: fuzzy_search_company(name='${name}')`);
    try {
      const match = await findBestCompanyMatch(name);
      if (match) {
        logger.debug(`✅ Found best match: ${match.name} (${match.type}) with similarity ${match.similarity}`);
        return JSON.stringify({
          found: true,
          match: {
            id: match.id,
            name: match.name,
            type: match.type,
            similarity: match.similarity
          }
        });
      }
      return JSON.stringify({ found: false, message: "No close match found." });
    } catch (error) {
      return JSON.stringify({ error: (error as Error).message });
    }
  },
  {
    name: "fuzzy_search_company",
    description: "Search for a company or past acquisition by name using fuzzy matching. Returns the closest match if found.",
    schema: z.object({
      name: z.string().describe("The name of the company to search for"),
    }),
  }
);

/**
 * Tool to add notes to a company or past deal.
 */
export const addCompanyNoteTool = tool(
  async ({ id, type, content, stage }: { id: string, type: 'company' | 'past_acquisition', content: string, stage?: string }) => {
    logger.debug(`🔧 TOOL CALLED: add_company_note(id='${id}', type='${type}')`);
    try {
      const supabase = getSupabaseClient();

      if (type === 'company') {
        const { error } = await supabase
          .from('deal_notes')
          .insert({
            deal_id: id,
            content: content,
            stage: stage || 'Meeting Note'
          });

        if (error) throw error;
      } else {
        // For past acquisitions, update the 'notes' column
        // First get existing notes
        const { data: deal } = await supabase
          .from('past_acquisitions')
          .select('notes')
          .eq('id', id)
          .single();

        const existingNotes = deal?.notes || '';
        const updatedNotes = existingNotes
          ? `${existingNotes}\n---\n${content}`
          : content;

        const { error } = await supabase
          .from('past_acquisitions')
          .update({ notes: updatedNotes })
          .eq('id', id);

        if (error) throw error;
      }

      return `Successfully added note to ${type} ${id}`;
    } catch (error) {
      return `Error adding note: ${(error as Error).message}`;
    }
  },
  {
    name: "add_company_note",
    description: "Adds a note to a matched company or past acquisition. If it's a company, it adds to deal_notes. If it's a past_acquisition, it appends to the notes column.",
    schema: z.object({
      id: z.string().describe("The UUID of the company or past acquisition"),
      type: z.enum(['company', 'past_acquisition']).describe("The type of the record"),
      content: z.string().describe("The content of the note to add"),
      stage: z.string().optional().describe("The deal stage if applicable (e.g., L0, L1)")
    }),
  }
);
