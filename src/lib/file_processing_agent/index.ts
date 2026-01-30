import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
// tools are no longer provided to the LLM agent directly for matching
import { logger } from "../agent/logger";
import { getAllCompanyReferences } from "../fuzzySearch";
import { addCompanyNoteTool } from "./tools"; // Still importing to usage if needed, but logic is changing

const generateSystemPrompt = (companies_list) => `You are a specialized M&A File Processing Assistant. Your task is to analyze raw text extracted from meeting documents (like PPTX slides) and transform it into a highly structured format.

## Objectives:
1. **Understand Unstructured Data**: Read the provided raw text carefully.
2. **Reformat to Structured JSON**: Extract a clear summary, key points, action items, and tags.
3. **Generate Tags**: Create a list of tags including company names mentioned and short highlights.
4. **Identify Companies**: Identify which of the "Known Companies" provided in the prompt are mentioned in the text.
5. **Extract Company Notes**: For each identified company, extract specific notes or context.
6. **Extract Meeting Date**: Identify the date of the meeting/document (usually mentioned in the title or content).

## Known Companies:
${companies_list}

## Process:
1. Review the "Known Companies" list.
2. Identify which of those companies appear in the text.
3. **Detect Codenames**: Actively scan for and include project codenames (such as "Project Utopia", "Project Tulia", "Project Notos", "Project gChem", etc.) even if they do not match the "Known Companies" list. Treat these as valid detected companies.
4. Final Output must be a valid JSON block containing:
   - summary: A concise overview of the meeting/document.
   - key_points: Array of main takeaways.
   - action_items: Array of next steps.
   - tags: Array of useful searchable tags (company names, topics).
   - companies_detected: Array of STRINGS (exact names as they appear in the Known Companies list) that were found in the text.
   - company_notes: Array of objects { "company_name": "...", "note": "..." } containing the specific context for that company.
   - file_date: A string representing the meeting date in YYYY-MM-DD format. If not found, return null.

## Output Format:
Your response should end with a JSON block in this format:
\`\`\`json
{
  "summary": "...",
  "key_points": ["...", "..."],
  "action_items": ["...", "..."],
  "tags": ["...", "..."],
  "companies_detected": ["Acme Corp", "Beta Ltd"],
  "company_notes": [
     { "company_name": "Acme Corp", "note": "Target price discussion..." }
  ],
  "file_date": "2024-01-30"
}
\`\`\`

Always prioritize accuracy. Only list a company in 'companies_detected' if you are sure it matches one in the provided known list.`;

/**
 * Invoke the file processing agent.
 */
export async function processFileContent(rawText: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  // 1. Fetch all known companies to provide context
  const allReferences = await getAllCompanyReferences();

  // OPTIMIZATION: Inject only names to save tokens
  const allNames = allReferences.map(r => r.name).join(", ");

  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    anthropicApiKey: apiKey,
    temperature: 0,
  });

  const agent = createReactAgent({
    llm,
    tools: [], // No tools needed for this phase logic
    prompt: generateSystemPrompt(allNames),
  });

  const inputs = {
    messages: [new HumanMessage(`Raw Content to process:\n\n${rawText}`)],
  };

  logger.debug("📂 INVOKING FILE PROCESSING AGENT");
  const result = await agent.invoke(inputs);

  // Extract the last message from the result
  const messagesList = result.messages as BaseMessage[];
  const lastMessage = messagesList[messagesList.length - 1];
  const content = typeof lastMessage.content === "string"
    ? lastMessage.content
    : JSON.stringify(lastMessage.content);

  // Extract JSON from the content
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);

      // Post-Processing: Client-side ID match
      // Map detected strings back to IDs
      const finalMatchedCompanies: any[] = [];
      const companiesDetected = parsed.companies_detected || [];

      for (const detectedName of companiesDetected) {
        // Find exact match in allReferences (case-insensitive search if needed, but agent should be exact)
        // We do a permissive find
        const match = allReferences.find(r => r.name.toLowerCase() === (detectedName as string).toLowerCase());
        if (match) {
          finalMatchedCompanies.push(match);
        } else {
          finalMatchedCompanies.push({
            id: null,
            name: detectedName,
            type: 'company',
            similarity: 1
          });
        }
      }

      // Add to final output
      parsed.matched_companies = finalMatchedCompanies;

      // Also trigger add_company_note logic if notes are present
      // We can do this here or let the API handler deal with it. 
      // Since the tool is removed from agent, we must do it manually if we want the side effect, 
      // OR just return the data structure and let the caller handle DB updates.
      // Based on previous flow, the API endpoint handles DB updates using the returned 'matched_companies'.
      // We should ensure 'company_notes' are also passed or handled.
      // For now, minimal regression: The API uses 'matched_companies' to update the meeting note record.
      // If we want to persist notes to the company record, we should loop through company_notes here.

      if (parsed.company_notes && Array.isArray(parsed.company_notes)) {
        for (const noteObj of parsed.company_notes) {
          const match = allReferences.find(r => r.name.toLowerCase() === (noteObj.company_name as string).toLowerCase());
          if (match) {
            // We invoke the tool logic manually or skip it?
            // The original requirement was "add it to the companies detected".
            // The API route likely reads 'matched_companies' and saves it to the DB column.
            // Direct DB linking (add_company_note) was an agent tool action.
            // We will attempt to invoke the tool functionality manually if we can, 
            // OR simply return this data. 
            // Given the instructions: "structure it... match it... store it". 
            // We will attach the note content to the matched_companies object so the caller (API) can use it if needed,
            // or just rely on the 'matched_companies' column in minutes_of_meeting.

            // Let's augment the matched company object with the note
            const recordIndex = finalMatchedCompanies.findIndex(m => m.id === match.id);
            if (recordIndex >= 0) {
              finalMatchedCompanies[recordIndex].note = noteObj.note;
            }
          }
        }
      }

      parsed.matched_companies = finalMatchedCompanies;

      return parsed;
    } catch (e) {
      logger.error("Failed to parse JSON from agent response");
      return { raw_response: content };
    }
  }

  return { raw_response: content };
}
