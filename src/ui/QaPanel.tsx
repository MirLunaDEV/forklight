import { Button } from "@/components/ui/button";
import { useAppStore } from "@/state/appStore";
import { runQaAction } from "@/webmcp/toolWrapper";

export function QaPanel() {
  const branches = useAppStore((state) => state.branches);
  const selectedView = useAppStore((state) => state.selectedView);
  const mergeRegisteredFor = useAppStore((state) => state.mergeRegisteredFor);
  const qaLog = useAppStore((state) => state.qaLog);
  const selectedBranch = branches.find(
    (branch) => branch.id === selectedView || branch.name === selectedView,
  );

  return (
    <section className="rounded-lg bg-surface p-3">
      <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        QA controls
      </h2>
      <p className="mb-3 text-xs text-muted">
        Manual rehearsal path. These buttons call the same domain commands as
        WebMCP tools. They are not site tools.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            runQaAction("run_locked_demo", "Locked A/B/C demo", () => {
              const result = useAppStore.getState().runLockedDemo();
              const created = result.ok ? result.data.created : [];
              if (created[1]) useAppStore.getState().switchView(created[1]);
              return result;
            })
          }
          variant="primary"
        >
          Run locked A/B/C
        </Button>
        <Button
          onClick={() =>
            runQaAction("create_abc", "Create route-a/b/c", () => {
              const store = useAppStore.getState();
              store.createBranch("route-a");
              store.createBranch("route-b");
              return store.createBranch("route-c");
            })
          }
        >
          Create A/B/C
        </Button>
        <Button onClick={() => applyNamed("a", "route-a")}>Preset A</Button>
        <Button onClick={() => applyNamed("b", "route-b")}>Preset B</Button>
        <Button onClick={() => applyNamed("c", "route-c")}>Preset C</Button>
        <Button
          disabled={!selectedBranch}
          onClick={() => {
            if (!selectedBranch) return;
            runQaAction(
              "run_simulation",
              `Simulate ${selectedBranch.name}`,
              () =>
                useAppStore.getState().runSimulation(selectedBranch.id),
            );
          }}
        >
          Simulate
        </Button>
        <Button
          disabled={!selectedBranch}
          onClick={() => {
            if (!selectedBranch) return;
            runQaAction(
              "validate_branch",
              `Validate ${selectedBranch.name}`,
              () =>
                useAppStore.getState().validateBranch(selectedBranch.id),
            );
          }}
        >
          Validate
        </Button>
        <Button
          variant="pass"
          disabled={!mergeRegisteredFor}
          onClick={() => {
            if (!mergeRegisteredFor) return;
            runQaAction("merge_verified_branch", "Merge approved future", () =>
              useAppStore.getState().mergeVerifiedBranch(mergeRegisteredFor),
            );
          }}
        >
          Merge
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            runQaAction("reset_session", "Reset session", () => {
              useAppStore.getState().resetSession();
              return { ok: true };
            })
          }
        >
          Reset
        </Button>
      </div>
      {qaLog.length > 0 ? (
        <ol className="mt-3 max-h-20 space-y-1 overflow-y-auto font-mono text-[10px] text-muted">
          {qaLog
            .slice(-6)
            .reverse()
            .map((event) => (
              <li key={event.id}>
                QA {event.tool} {event.status} — {event.summary}
              </li>
            ))}
        </ol>
      ) : null}
    </section>
  );
}

function applyNamed(which: "a" | "b" | "c", name: string) {
  runQaAction(`preset_${which}`, `Apply future ${which.toUpperCase()}`, () => {
    const store = useAppStore.getState();
    let branch = store.branches.find((item) => item.name === name);
    if (!branch) {
      const created = store.createBranch(name);
      if (!created.ok) return created;
      branch = created.data.branch;
    }
    const applied = store.applyFuturePreset(which, branch.id);
    store.switchView(branch.id);
    return applied;
  });
}
