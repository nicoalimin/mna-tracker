import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { fuzzySearchCompanyTool, addCompanyNoteTool } from "./tools";
import { logger } from "../agent/logger";

const SYSTEM_PROMPT = `You are a specialized M&A File Processing Assistant. Your task is to analyze raw text extracted from meeting documents (like PPTX slides) and transform it into a highly structured format.

## Objectives:
1. **Understand Unstructured Data**: Read the provided raw text carefully.
2. **Reformat to Structured JSON**: Extract a clear summary, key points, action items, and tags.
3. **Generate Tags**: Create a list of tags including company names mentioned and short highlights.
4. **Identify Company-Specific Notes**: Find sections related to specific companies (targets, competitors, or past deals).
5. **Match and Link**: Use the provided tools to find matching companies in our database and link the extracted notes to them.

## Process:
1. Identify all companies mentioned in the text.
2. For each company:
   - Use 'fuzzy_search_company' to see if they exist in our record.
   - If a match is found (similarity > 0.7 is ideal, but evaluate context), use 'add_company_note' to store relevant notes for that specific company.
3. Final Output must be a valid JSON block containing:
   - summary: A concise overview of the meeting/document.
   - key_points: Array of main takeaways.
   - action_items: Array of next steps.
   - tags: Array of useful searchable tags (company names, topics).
   - matched_companies: Array of objects with { id, name, type } for companies you successfully matched and noted.

## Output Format:
Your response should end with a JSON block in this format:
\`\`\`json
{
  "summary": "...",
  "key_points": ["...", "..."],
  "action_items": ["...", "..."],
  "tags": ["...", "..."],
  "matched_companies": [
    { "id": "uuid", "name": "Company Name", "type": "company|past_acquisition" }
  ]
}
\`\`\`

Always prioritize accuracy in matching. If unsure about a match, do NOT link it, just mention it in the summary/key points.`;

/**
 * Invoke the file processing agent.
 */
export async function processFileContent(rawText: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    anthropicApiKey: apiKey,
    temperature: 0,
  });

  const agent = createReactAgent({
    llm,
    tools: [fuzzySearchCompanyTool, addCompanyNoteTool],
    prompt: SYSTEM_PROMPT,
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
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      logger.error("Failed to parse JSON from agent response");
      return { raw_response: content };
    }
  }

  return { raw_response: content };
}
