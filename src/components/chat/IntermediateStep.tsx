import { type UIMessage } from "@ai-sdk/react";
import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntermediateStepProps {
  message: UIMessage;
}

export function IntermediateStep({ message }: IntermediateStepProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract content from parts if possible, otherwise rely on how we stored it (we might have stored it in text part for system messages we created manually)
  let rawContent = "";
  if (message.parts.length > 0 && message.parts[0].type === 'text') {
    rawContent = (message.parts[0] as any).text;
  }

  let content: any = {};
  try {
    content = JSON.parse(rawContent);
  } catch (e) {
    content = { observation: rawContent };
  }

  const action = content.action;
  const observation = content.observation;

  return (
    <div className="mb-4 ml-12">
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center border border-border">
          <Terminal className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-xs font-medium text-muted-foreground truncate">
            {action ? `Executing: ${action.name || 'Tool'}` : 'Processing...'}
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 pl-8 pr-2">
          {action && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Input</div>
              <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto border border-border">
                {JSON.stringify(action.args, null, 2)}
              </pre>
            </div>
          )}
          {observation && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Result</div>
              <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto border border-border max-h-[300px]">
                {typeof observation === 'string' ? observation : JSON.stringify(observation, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
