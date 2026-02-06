import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "@/lib/db";
import { findBestCompanyMatch } from "../fuzzySearch";
import { logger } from "../agent/logger";


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
      if (type === 'company') {
        await db.query(
          `INSERT INTO deal_notes (deal_id, content, stage)
           VALUES ($1, $2, $3)`,
          [id, content, stage || 'Meeting Note']
        );
      } else {
        // For past acquisitions, update the 'notes' column
        // First get existing notes
        const result = await db.query(
          `SELECT notes FROM past_acquisitions WHERE id = $1`,
          [id]
        );
        const deal = result.rows[0];

        const existingNotes = deal?.notes || '';
        const updatedNotes = existingNotes
          ? `${existingNotes}\n---\n${content}`
          : content;

        await db.query(
          `UPDATE past_acquisitions SET notes = $1 WHERE id = $2`,
          [updatedNotes, id]
        );
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
