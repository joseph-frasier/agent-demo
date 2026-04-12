import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface ClaudeOpts {
  system: string;
  user: string;
  maxTokens?: number;
}

export async function callClaudeText(opts: ClaudeOpts): Promise<string> {
  const message = await client.messages
    .stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: opts.maxTokens ?? 4096,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    })
    .finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error(
      `Claude response truncated at max_tokens (${opts.maxTokens ?? 4096}). Increase maxTokens or reduce the requested output size.`
    );
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return textBlock.text;
}

interface StreamClaudeOpts extends ClaudeOpts {
  onChunk: (textDelta: string, accumulated: string) => void;
}

export async function streamClaudeText(opts: StreamClaudeOpts): Promise<string> {
  let accumulated = "";

  const stream = client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  stream.on("text", (textDelta: string) => {
    accumulated += textDelta;
    opts.onChunk(textDelta, accumulated);
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error(
      `Claude response truncated at max_tokens (${opts.maxTokens ?? 4096}). Increase maxTokens or reduce the requested output size.`
    );
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return textBlock.text;
}

export async function callClaude<T>(opts: ClaudeOpts): Promise<T> {
  const text = await callClaudeText(opts);

  // Extract JSON — strip leading/trailing markdown fences independently so
  // we tolerate either a properly-closed fenced block or bare JSON.
  let jsonStr = text.trim();
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "");
  jsonStr = jsonStr.replace(/\n?```\s*$/, "");

  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    const preview = jsonStr.slice(0, 200).replace(/\n/g, "\\n");
    throw new Error(
      `Failed to parse Claude response as JSON: ${err instanceof Error ? err.message : String(err)}. Preview: ${preview}...`
    );
  }
}
