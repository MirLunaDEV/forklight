import { CONSTRAINT_COPY } from "@/constraints/rules";
import { useAppStore } from "@/state/appStore";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export function ConstraintPanel() {
  const selectedView = useAppStore((state) => state.selectedView);
  const branches = useAppStore((state) => state.branches);
  const branch =
    selectedView === "main"
      ? null
      : branches.find(
          (item) => item.id === selectedView || item.name === selectedView,
        );
  const checks = branch?.validationResult?.checks;

  return (
    <section className="rounded-lg bg-surface p-3">
      <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        Hard constraints
      </h2>
      <ul className="space-y-1.5">
        {CONSTRAINT_COPY.map((item) => {
          const check = checks?.find((entry) => entry.id === item.id);
          const passed = check?.passed;
          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-sm bg-surface-2 px-2.5 py-2"
            >
              <div>
                <div className="text-sm text-fg">{item.label}</div>
                <div className="font-mono text-[10px] text-muted">
                  {item.required}
                </div>
                {check ? (
                  <div className="mt-0.5 font-mono text-[10px] text-muted">
                    {check.message}
                  </div>
                ) : null}
              </div>
              <span
                className={cn(
                  "mt-0.5 inline-flex size-6 items-center justify-center rounded-full",
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
                  <Check className="size-3.5" />
                ) : passed === false ? (
                  <X className="size-3.5" />
                ) : (
                  <span className="text-[10px]">—</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
