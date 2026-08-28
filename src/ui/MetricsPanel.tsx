import { useAppStore } from "@/state/appStore";
import { formatFixed, formatPct } from "@/lib/utils";
import { derivedDeltas } from "@/constraints/validator";

export function MetricsPanel() {
  const main = useAppStore((state) => state.main);
  const selectedView = useAppStore((state) => state.selectedView);
  const branches = useAppStore((state) => state.branches);
  const branch =
    selectedView === "main"
      ? null
      : branches.find(
          (item) => item.id === selectedView || item.name === selectedView,
        );
  const metrics = branch?.metrics ?? main.baselineMetrics;
  const baseline = main.baselineMetrics;
  const deltas =
    branch?.metrics && baseline
      ? derivedDeltas(branch.metrics, baseline)
      : null;

  return (
    <section className="rounded-lg bg-surface p-3">
      <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        {branch ? `${branch.name} metrics` : "MAIN baseline"}
      </h2>
      <dl className="grid grid-cols-2 gap-2">
        <Metric
          label="Throughput"
          value={formatFixed(metrics?.throughput)}
          hint={deltas ? formatPct(deltas.throughputImprovement) : "baseline"}
        />
        <Metric
          label="Avg distance"
          value={formatFixed(metrics?.averageDistance, 2)}
          hint={deltas ? formatPct(deltas.distanceIncrease) : "m"}
        />
        <Metric
          label="Completed"
          value={
            metrics ? `${metrics.completed}/${metrics.packages}` : "—"
          }
        />
        <Metric
          label="Congestion"
          value={formatFixed(metrics?.congestionScore, 4)}
          hint={
            deltas
              ? `×${deltas.congestionRatio.toFixed(2)}`
              : "baseline"
          }
        />
      </dl>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-sm bg-surface-2 px-2.5 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className="font-mono text-sm tabular-nums text-fg">
        {value}
        {hint ? (
          <span className="ml-1 text-[10px] text-muted">{hint}</span>
        ) : null}
      </dd>
    </div>
  );
}
