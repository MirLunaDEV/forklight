/**
 * Minimal local ambient declarations for the WebMCP draft API
 * (Draft Community Group Report, 2026-08-19 / 2026-08-26).
 * Not a standards polyfill — only the members Forklight uses.
 */

interface ToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface ToolExecuteCallbackOptions {
  signal: AbortSignal;
}

type ToolExecuteCallback = (
  inputObject: Record<string, unknown>,
  options: ToolExecuteCallbackOptions,
) => Promise<Record<string, unknown>>;

interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  execute: ToolExecuteCallback;
  annotations?: ToolAnnotations;
}

interface ModelContextRegisterToolOptions {
  exposedTo?: string[];
  signal?: AbortSignal;
}

interface ModelContextGetToolOptions {
  fromOrigins?: string[];
}

interface RegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  annotations?: ToolAnnotations;
  origin?: string;
}

interface ModelContext {
  registerTool(
    tool: ModelContextTool,
    options?: ModelContextRegisterToolOptions,
  ): Promise<void>;
  getTools(options?: ModelContextGetToolOptions): Promise<RegisteredTool[]>;
}

interface Document {
  readonly modelContext?: ModelContext;
}
