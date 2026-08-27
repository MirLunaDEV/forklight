import { Button } from "@/components/ui/button";
import { compareBranches } from "@/domain/commands";
import { useAppStore } from "@/state/appStore";
import { formatPct } from "@/lib/utils";
import { runQaAction } from "@/webmcp/toolWrapper";
import { StatusBadge } from "./status";

export function BranchPanel() {
  const branches = useAppStore((state) => state.branches);
  const selectedView = useAppStore((state) => state.selectedView);
  const approval = useAppStore((state) => state.approval);
  const main = useAppStore((state) => state.main);
  const switchView = useAppStore((state) => state.switchView);
  const comparison = compareBranches({
    main,
    branches,
    nextBranchSeq: 0,
    approval,
    mergeRegisteredFor: null,
  });

  return (
    <section className="rounded-lg bg-surface p-3">
      <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        Futures
      </h2>
      {branches.length === 0 ? (
        <p className="text-sm text-muted">
          No candidates yet. Create isolated futures from MAIN, then simulate
          and validate before any merge.
        </p>
      ) : (
        <ul className="space-y-2">
          {branches.map((branch) => {
            const row = comparison.ok
              ? comparison.data.branches.find((item) => item.id === branch.id)
              : null;
            const selected =
              selectedView === branch.id || selectedView === branch.name;
            const canApprove =
              branch.status === "verified" &&
              branch.baseRevision === main.revision;
            const approved = approval.branchId === branch.id;
            return (
              <li
                key={branch.id}
                className={`rounded-md bg-surface-2 p-2.5 ${
                  selected ? "ring-1 ring-accent/40" : ""
                } ${branch.status === "stale" ? "opacity-50" : ""}`}
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-2 text-left"
                  onClick={() => switchView(branch.id)}
                >
                  <div>
                    <div className="text-sm text-fg">{branch.name}</div>
                    <div className="font-mono text-[10px] text-muted">
                      {branch.id} · base rev {branch.baseRevision}
                    </div>
                  </div>
                  <StatusBadge status={branch.status} />
                </button>
                {row ? (
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-muted">
                    <span>Thru {formatPct(row.throughputImprovement)}</span>
                    <span>Dist {formatPct(row.distanceIncrease)}</span>
                    <span>Prot {row.protectedMoved}</span>
                    <span>
                      Cong{" "}
                      {row.congestionRatio == null
                        ? "—"
                        : row.congestionRatio.toFixed(2)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <Button
                    variant={approved ? "pass" : "primary"}
                    disabled={!canApprove || approved}
                    onClick={() => {
                      runQaAction(
                        "approve_branch",
                        `Approve ${branch.name}`,
                        () => useAppStore.getState().approveBranch(branch.id),
                      );
                    }}
                  >
                    {approved ? "Approved" : "Approve"}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!approved}
                    onClick={() => {
                      runQaAction("revoke_approval", "Revoke approval", () =>
                        useAppStore.getState().revokeApproval(),
                      );
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
