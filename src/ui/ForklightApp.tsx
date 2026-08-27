import { useEffect, useState } from "react";
import { SceneHost } from "@/scene/SceneHost";
import { useAppStore } from "@/state/appStore";
import { bootstrapWebmcp } from "@/webmcp/registerTools";
import { AgentTimeline } from "./AgentTimeline";
import { BranchPanel } from "./BranchPanel";
import { ConstraintPanel } from "./ConstraintPanel";
import { MetricsPanel } from "./MetricsPanel";
import { QaPanel } from "./QaPanel";
import { isQaEnabled } from "./qaMode";
import { TopBar } from "./TopBar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileTab = "constraints" | "futures" | "metrics" | "qa";

export function ForklightApp() {
  const [tab, setTab] = useState<MobileTab>("futures");
  const caption = useViewCaption();
  const qaEnabled = isQaEnabled();
  const mobileTabs: readonly (readonly [MobileTab, string])[] = qaEnabled
    ? [
        ["constraints", "Constraints"],
        ["futures", "Futures"],
        ["metrics", "Metrics"],
        ["qa", "QA"],
      ]
    : [
        ["constraints", "Constraints"],
        ["futures", "Futures"],
        ["metrics", "Metrics"],
      ];

  useEffect(() => {
    const stop = bootstrapWebmcp();
    window.__forklightReady = true;
    return () => {
      stop();
      window.__forklightReady = false;
    };
  }, []);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="relative h-[38vh] min-h-[220px] shrink-0 touch-none lg:h-auto lg:min-h-0 lg:flex-1">
          <SceneHost />
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-sm bg-bg/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {caption}
          </div>
        </section>
        <aside className="hidden min-h-0 w-[360px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border p-3 lg:flex">
          <ConstraintPanel />
          <BranchPanel />
          <MetricsPanel />
          {qaEnabled ? <QaPanel /> : null}
        </aside>
        <div className="flex min-h-0 flex-1 flex-col border-t border-border lg:hidden">
          <div className="flex gap-1 overflow-x-auto px-2 py-2">
            {mobileTabs.map(([id, label]) => (
              <Button
                key={id}
                variant={tab === id ? "primary" : "ghost"}
                onClick={() => setTab(id)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto px-3 pb-3")}>
            {tab === "constraints" ? <ConstraintPanel /> : null}
            {tab === "futures" ? <BranchPanel /> : null}
            {tab === "metrics" ? <MetricsPanel /> : null}
            {qaEnabled && tab === "qa" ? <QaPanel /> : null}
          </div>
        </div>
      </div>
      <AgentTimeline />
    </div>
  );
}

function useViewCaption() {
  const selectedView = useAppStore((state) => state.selectedView);
  const branches = useAppStore((state) => state.branches);
  if (selectedView === "main") return "Viewing MAIN";
  const branch = branches.find(
    (item) => item.id === selectedView || item.name === selectedView,
  );
  return branch ? `Viewing ${branch.name}` : "Viewing MAIN";
}

declare global {
  interface Window {
    __forklightReady?: boolean;
  }
}
