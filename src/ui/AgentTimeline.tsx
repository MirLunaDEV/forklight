import { useAppStore } from "@/state/appStore";
import { cn } from "@/lib/utils";

export function AgentTimeline() {
  const timeline = useAppStore((state) => state.timeline);

  return (
    <section className="shrink-0 border-t border-border bg-surface px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Agent activity
        </h2>
        <span className="text-[10px] text-muted">
          Real WebMCP tool executions only
        </span>
      </div>
      <ol className="flex max-h-24 flex-col-reverse gap-1 overflow-y-auto font-mono text-[11px]">
        {timeline.length === 0 ? (
          <li className="text-muted">Waiting for site-tool calls.</li>
        ) : (
          timeline.map((event) => (
            <li
              key={event.id}
              className={cn(
                "flex gap-2",
                event.status === "error" ? "text-fail" : "text-fg",
              )}
            >
              <span className="text-muted">
                {new Date(event.ts).toLocaleTimeString()}
              </span>
              <span className="text-capability">{event.tool}</span>
              <span>
                {event.status === "start"
                  ? ".."
                  : event.status === "success"
                    ? "ok"
                    : "err"}
              </span>
              <span className="truncate text-muted">{event.summary}</span>
              {event.durationMs != null ? (
                <span className="ml-auto text-muted">{event.durationMs}ms</span>
              ) : null}
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
