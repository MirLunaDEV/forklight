export interface ToolRemovalWaitOptions {
  timeoutMs?: number;
  pollMs?: number;
}

export class ToolRemovalTimeoutError extends Error {
  readonly code = "WEBMCP_TOOL_REMOVAL_TIMEOUT";

  constructor(toolNames: readonly string[]) {
    super(
      `Timed out waiting for WebMCP tool removal: ${toolNames.join(", ")}.`,
    );
    this.name = "ToolRemovalTimeoutError";
  }
}

export async function waitUntilToolsGone(
  modelContext: ModelContext,
  toolNames: readonly string[],
  options: ToolRemovalWaitOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 400;
  const pollMs = options.pollMs ?? 20;
  const wanted = new Set(toolNames);
  const started = Date.now();

  while (true) {
    const tools = await modelContext.getTools();
    const remaining = tools
      .map((tool) => tool.name)
      .filter((name) => wanted.has(name));
    if (remaining.length === 0) return;
    if (Date.now() - started >= timeoutMs) {
      throw new ToolRemovalTimeoutError(remaining);
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}
