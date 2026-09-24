import { cn } from "@/lib/utils";
import { riskBadgeClass, riskDotClass, riskLabel, riskLevel, type RiskLevel } from "@/lib/risk";

export function RiskBadge({
  score,
  level,
  className,
  showScore = false,
}: {
  score?: number;
  level?: RiskLevel;
  className?: string;
  showScore?: boolean;
}) {
  const lvl = level ?? riskLevel(score ?? 0);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold",
        riskBadgeClass[lvl],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", riskDotClass[lvl])} />
      {riskLabel[lvl]}
      {showScore && score !== undefined ? ` ${(score * 100).toFixed(1)}%` : ""}
    </span>
  );
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const map: Record<string, string> = {
    active: "bg-risk-critical-soft text-risk-critical border-risk-critical/30",
    acknowledged: "bg-risk-moderate-soft text-risk-moderate border-risk-moderate/30",
    resolved: "bg-risk-low-soft text-risk-low border-risk-low/30",
    pending: "bg-muted text-muted-foreground border-border",
    in_review: "bg-risk-moderate-soft text-risk-moderate border-risk-moderate/30",
    verified: "bg-risk-low-soft text-risk-low border-risk-low/30",
    connected: "bg-risk-low-soft text-risk-low border-risk-low/30",
    degraded: "bg-risk-moderate-soft text-risk-moderate border-risk-moderate/30",
    offline: "bg-risk-critical-soft text-risk-critical border-risk-critical/30",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        map[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
