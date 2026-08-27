import { GitFork, Radio } from "lucide-react";
import { useAppStore } from "@/state/appStore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TopBar() {
  const selectedView = useAppStore((state) => state.selectedView);
  const branches = useAppStore((state) => state.branches);
  const revision = useAppStore((state) => state.main.revision);
  const webmcpAvailable = useAppStore((state) => state.webmcpAvailable);
  const mergeRegisteredFor = useAppStore((state) => state.mergeRegisteredFor);
  const switchView = useAppStore((state) => state.switchView);
  const capabilityBanner = useAppStore((state) => state.capabilityBanner);

  return (
    <header className="shrink-0 border-b border-border bg-surface">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <GitFork className="size-4 text-capability" strokeWidth={1.75} />
          <div className="leading-tight">
            <div className="font-display text-sm tracking-[0.18em] text-fg">
              FORKLIGHT
            </div>
            <div className="hidden text-[10px] uppercase tracking-[0.16em] text-muted sm:block">
              Try the future before you merge it
            </div>
          </div>
        </div>
        <nav className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto">
          <ViewTab
            active={selectedView === "main"}
            onClick={() => switchView("main")}
            label="MAIN"
            hint={`rev ${revision}`}
          />
          {branches.map((branch) => (
            <ViewTab
              key={branch.id}
              active={
                selectedView === branch.id || selectedView === branch.name
              }
              onClick={() => switchView(branch.id)}
              label={branch.name}
              hint={branch.status}
            />
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          {mergeRegisteredFor ? (
            <Badge tone="info">Merge ready</Badge>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]",
              webmcpAvailable ? "text-pass" : "text-muted",
            )}
          >
            <Radio className="size-3.5" />
            WebMCP {webmcpAvailable ? "live" : "unavailable"}
          </span>
        </div>
      </div>
      {capabilityBanner ? (
        <div className="capability-banner flex items-center justify-between gap-3 px-3 py-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">
            Capability unlocked — merge_verified_branch is now available
          </span>
        </div>
      ) : null}
    </header>
  );
}

function ViewTab({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 min-w-11 shrink-0 flex-col justify-center rounded-md px-3 text-left",
        active
          ? "bg-surface-2 text-fg"
          : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.12em]">
        {label}
      </span>
      <span className="text-[10px] text-muted">{hint}</span>
    </button>
  );
}
