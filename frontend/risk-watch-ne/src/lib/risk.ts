export type RiskLevel = "low" | "moderate" | "high" | "critical";

export function riskLevel(score: number): RiskLevel {
  if (score >= 0.76) return "critical";
  if (score >= 0.56) return "high";
  if (score >= 0.31) return "moderate";
  return "low";
}

export function riskLevelFromBackend(level: string): RiskLevel {
  const normalized = level.trim().toLowerCase();
  if (normalized === "moderate" || normalized === "high" || normalized === "critical") {
    return normalized;
  }
  return "low";
}

export const riskLabel: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

/** Hex values for canvas/map usage where CSS variables are not available. */
export const riskHex: Record<RiskLevel, string> = {
  low: "#16A34A",
  moderate: "#F59E0B",
  high: "#F97316",
  critical: "#DC2626",
};

export const riskBadgeClass: Record<RiskLevel, string> = {
  low: "bg-risk-low-soft text-risk-low border-risk-low/30",
  moderate: "bg-risk-moderate-soft text-risk-moderate border-risk-moderate/30",
  high: "bg-risk-high-soft text-risk-high border-risk-high/30",
  critical: "bg-risk-critical-soft text-risk-critical border-risk-critical/30",
};

export const riskTextClass: Record<RiskLevel, string> = {
  low: "text-risk-low",
  moderate: "text-risk-moderate",
  high: "text-risk-high",
  critical: "text-risk-critical",
};

export const riskDotClass: Record<RiskLevel, string> = {
  low: "bg-risk-low",
  moderate: "bg-risk-moderate",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
