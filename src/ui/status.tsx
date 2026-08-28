import { Badge } from "@/components/ui/badge";
import type { BranchStatus } from "@/domain/world";

export function statusTone(
  status: BranchStatus,
): "neutral" | "pass" | "fail" | "warn" | "info" {
  if (status === "verified") return "pass";
  if (status === "failed") return "fail";
  if (status === "stale") return "warn";
  if (status === "merged") return "info";
  return "neutral";
}

export function StatusBadge({ status }: { status: BranchStatus }) {
  const label =
    status === "verified"
      ? "VERIFIED"
      : status === "failed"
        ? "FAIL"
        : status.toUpperCase();
  return <Badge tone={statusTone(status)}>{label}</Badge>;
}
