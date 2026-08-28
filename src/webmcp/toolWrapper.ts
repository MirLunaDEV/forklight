import { useAppStore } from "../state/appStore";

export interface ToolErrorResult extends Record<string, unknown> {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ToolSuccessResult extends Record<string, unknown> {
  ok: true;
}

export type ToolResult = ToolSuccessResult | ToolErrorResult;

function compactMessage(caught: unknown): string {
  const raw =
    caught instanceof Error ? caught.message : "Unknown tool error";
  const compact = raw.replace(/\s+/g, " ").trim();
  return (compact || "Unknown tool error").slice(0, 240);
}

export function errorResult(code: string, message: string): ToolErrorResult {
  return {
    ok: false,
    error: {
      code,
      message: message.replace(/\s+/g, " ").trim().slice(0, 240),
    },
  };
}

function successResult(value: unknown): ToolSuccessResult {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>), ok: true };
  }
  return { ok: true, data: value };
}

export async function runTool(
  name: string,
  summaryStart: string,
  execute: () => unknown,
): Promise<ToolResult> {
  const started = Date.now();
  useAppStore.getState().recordTimeline({
    tool: name,
    status: "start",
    summary: summaryStart,
    source: "webmcp",
    ts: started,
  });
  try {
    const value = await Promise.resolve(execute());
    const durationMs = Date.now() - started;
    const failed =
      value !== null &&
      typeof value === "object" &&
      "ok" in value &&
      (value as { ok: unknown }).ok === false;
    if (failed) {
      const result = value as ToolErrorResult;
      useAppStore.getState().recordTimeline({
        tool: name,
        status: "error",
        durationMs,
        summary: result.error?.message ?? "Tool failed",
        source: "webmcp",
      });
      return result;
    }
    useAppStore.getState().recordTimeline({
      tool: name,
      status: "success",
      durationMs,
      summary: summarizeSuccess(name, value),
      source: "webmcp",
    });
    return successResult(value);
  } catch (caught) {
    const durationMs = Date.now() - started;
    const message = compactMessage(caught);
    useAppStore.getState().recordTimeline({
      tool: name,
      status: "error",
      durationMs,
      summary: message,
      source: "webmcp",
    });
    return errorResult("TOOL_EXCEPTION", message);
  }
}

function summarizeSuccess(name: string, value: unknown): string {
  if (!value || typeof value !== "object") return name;
  const record = value as Record<string, unknown>;
  switch (name) {
    case "inspect_world": {
      const entities = Array.isArray(record.entities) ? record.entities.length : 0;
      return `${entities} entities, rev ${String(record.revision)}`;
    }
    case "create_branch":
      return String(record.name ?? record.id ?? "future created");
    case "move_entity":
      return String(record.summary ?? "entity moved");
    case "modify_route":
      return String(record.summary ?? "route updated");
    case "run_simulation": {
      const metrics = record.metrics as { throughput?: number } | undefined;
      return metrics
        ? `throughput ${metrics.throughput?.toFixed(4)}`
        : "simulated";
    }
    case "validate_branch":
      return record.allPassed ? "VERIFIED" : "FAILED";
    case "merge_verified_branch":
      return `MAIN rev ${String(record.revision)}`;
    case "compare_branches":
      return "comparison ready";
    default:
      return name;
  }
}

export function runQaAction(tool: string, summary: string, fn: () => unknown) {
  const started = Date.now();
  useAppStore.getState().recordTimeline({
    tool,
    status: "start",
    summary,
    source: "qa",
    ts: started,
  });
  const value = fn();
  const failed =
    value !== null &&
    typeof value === "object" &&
    "ok" in value &&
    (value as { ok: unknown }).ok === false;
  useAppStore.getState().recordTimeline({
    tool,
    status: failed ? "error" : "success",
    durationMs: Date.now() - started,
    summary: failed
      ? ((value as { error?: { message?: string } }).error?.message ?? "QA failed")
      : summary,
    source: "qa",
  });
  return value;
}
