import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function callClaude<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response — handle markdown code fences
  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  return JSON.parse(jsonStr) as T;
}
