import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/state/appStore";
import {
  Check,
  LockKeyhole,
  Pencil,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

export function ConstraintPanel() {
  const selectedView = useAppStore((state) => state.selectedView);
  const branches = useAppStore((state) => state.branches);
  const main = useAppStore((state) => state.main);
  const policy = useAppStore((state) => state.policy);
  const lockPolicy = useAppStore((state) => state.lockPolicy);
  const editPolicy = useAppStore((state) => state.editPolicy);
  const branch =
    selectedView === "main"
      ? null
      : branches.find(
          (item) => item.id === selectedView || item.name === selectedView,
        );
  const checks = branch?.validationResult?.checks;
  const locked = policy.status === "locked";
  const protectedEquipment = main.entities
    .filter((entity) => entity.protected)
    .sort(
      (left, right) =>
        Number(right.type === "machine") - Number(left.type === "machine"),
    )
    .map((entity) => entity.name);
  const rules = [
    {
      id: "throughput" as const,
      label: "Minimum throughput",
      required: `≥ +${Math.round(policy.minThroughputImprovement * 100)}%`,
      detail: "versus MAIN baseline",
    },
    {
      id: "distance" as const,
      label: "Route distance",
      required: `≤ +${Math.round(policy.maxDistanceIncrease * 100)}%`,
      detail: "average planned travel",
    },
    {
      id: "protected" as const,
      label: "Protected equipment",
      required: `${policy.maxProtectedMoved} moves`,
      detail: `${protectedEquipment.slice(0, 2).join(", ")} + ${Math.max(0, protectedEquipment.length - 2)} core assets`,
    },
    {
      id: "congestion" as const,
      label: "Congestion",
      required: "≤ baseline",
      detail: "locked for challenge demo",
    },
  ];

  return (
    <section
      className="rounded-lg bg-surface p-3"
      aria-labelledby="human-policy-heading"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-capability">
            <UserRound className="size-3" />
            Defined by human
          </div>
          <h2
            id="human-policy-heading"
            className="font-display text-sm uppercase tracking-[0.12em] text-fg"
          >
            Human policy
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Define the boundaries an agent must respect.
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
            locked ? "bg-pass/15 text-pass" : "bg-warn/15 text-warn",
          )}
        >
          {locked ? "Policy locked" : "Draft policy"}
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-1.5">
        {rules.map((item) => {
          const check = checks?.find((entry) => entry.id === item.id);
          const passed = check?.passed;
          return (
            <li key={item.id} className="rounded-sm bg-surface-2 px-2.5 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-fg">{item.label}</div>
                  <div className="mt-0.5 font-mono text-sm text-fg">
                    {item.required}
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                    passed === true
                      ? "bg-pass/15 text-pass"
                      : passed === false
                        ? "bg-fail/15 text-fail"
                        : "bg-bg text-muted",
                  )}
                  aria-label={
                    passed === true
                      ? `${item.label} passed`
                      : passed === false
                        ? `${item.label} failed`
                        : `${item.label} pending`
                  }
                >
                  {passed === true ? (
                    <Check className="size-3" />
                  ) : passed === false ? (
                    <X className="size-3" />
                  ) : item.id === "protected" ? (
                    <ShieldCheck className="size-3" />
                  ) : (
                    <span className="text-[9px]">—</span>
                  )}
                </span>
              </div>
              <div className="mt-1 truncate font-mono text-[9px] text-muted">
                {check?.message ?? item.detail}
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className={cn(
          "mt-2.5 rounded-md border p-2.5",
          locked ? "border-pass/25 bg-pass/5" : "border-warn/25 bg-warn/5",
        )}
      >
        <div className="flex items-start gap-2">
          <LockKeyhole
            className={cn(
              "mt-0.5 size-4 shrink-0",
              locked ? "text-pass" : "text-warn",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg">
              {locked ? "Agent exploration enabled" : "Exploration paused"}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {locked
                ? "Policy locked. The agent can explore isolated futures."
                : "Review the challenge boundaries, then lock policy to let the agent begin."}
            </p>
          </div>
        </div>
        <Button
          className="mt-2.5 w-full"
          variant={locked ? "secondary" : "primary"}
          onClick={() => (locked ? editPolicy() : lockPolicy())}
        >
          {locked ? (
            <Pencil className="size-3.5" />
          ) : (
            <LockKeyhole className="size-3.5" />
          )}
          {locked ? "Edit policy" : "Lock policy"}
        </Button>
        {locked && branches.length > 0 ? (
          <p className="mt-1.5 text-center text-[9px] text-muted">
            Editing invalidates verification and merge permission.
          </p>
        ) : null}
      </div>
    </section>
  );
}
