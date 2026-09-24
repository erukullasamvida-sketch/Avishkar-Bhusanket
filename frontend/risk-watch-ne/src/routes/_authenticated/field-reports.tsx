import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, MapPin } from "lucide-react";

import { AppShell, SectionCard } from "@/components/app-shell";
import { RiskBadge, StatusPill } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportsQuery } from "@/lib/api";
import { getLocations } from "@/lib/api/locations";
import { createFieldReport } from "@/lib/api/reports";
import { useProfile } from "@/hooks/use-profile";
import { formatDateTime } from "@/lib/risk";
import type { RiskLevel } from "@/lib/risk";

export const Route = createFileRoute("/_authenticated/field-reports")({
  head: () => ({
    meta: [
      { title: "Field Reports — BHUSANKET" },
      {
        name: "description",
        content:
          "Submit and review on-ground landslide field reports with location, severity, description and photo evidence.",
      },
      { property: "og:title", content: "Field Reports — BHUSANKET" },
      {
        property: "og:description",
        content: "Ground-truth reporting for landslide monitoring in NE India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FieldReportsPage,
});

const TYPES = [
  "Landslide",
  "Ground Crack",
  "Rockfall",
  "Road Blockage",
  "Waterlogging",
  "Slope Instability",
  "Other",
];
const SEVERITIES: RiskLevel[] = ["low", "moderate", "high", "critical"];

function FieldReportsPage() {
  const { data: profile } = useProfile();
  const { data: locations = [] } = useQuery({
    queryKey: ["field-report-locations"],
    queryFn: () => getLocations(),
  });
  const { data: reports = [] } = useQuery(reportsQuery);
  const queryClient = useQueryClient();

  const [locationId, setLocationId] = useState("");
  const [reportType, setReportType] = useState("Landslide");
  const [severity, setSeverity] = useState<RiskLevel>("moderate");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [useGps, setUseGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const location = locations.find((l) => String(l.id) === locationId);
    if (!location) {
      toast.error("Please select a location.");
      return;
    }
    setSubmitting(true);

    let latitude = location.latitude;
    let longitude = location.longitude;
    if (useGps && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
        );
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        toast.info("Current GPS was unavailable; using the selected location.");
      }
    }

    try {
      await createFieldReport({
        location_name: location.name,
        latitude,
        longitude,
        report_type: reportType,
        severity,
        description,
        image_url: null,
      });
    } catch {
      setSubmitting(false);
      toast.error("Could not submit the report. Please try again.");
      return;
    }

    setSubmitting(false);
    toast.success("Field report submitted");
    if (photo) {
      toast.info("Photo selection is kept for review, but image storage is not connected.");
    }
    setDescription("");
    setPhoto(null);
    await queryClient.invalidateQueries({ queryKey: ["field_reports"] });
  }

  return (
    <AppShell
      title="Field Reports"
      subtitle="Ground observations from officers across the monitored region"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_1fr]">
        <SectionCard title="Submit Field Report">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Click to select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} — {l.district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as RiskLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed description of what you observed..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Upload Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              {photo && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" /> {photo.name}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={useGps}
                onChange={(e) => setUseGps(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Use current GPS location
            </label>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Recent Field Reports" description={`${reports.length} submitted`}>
          <ul className="max-h-[620px] space-y-3 overflow-y-auto">
            {reports.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No field reports have been submitted yet.
              </p>
            ) : reports.map((r) => (
              <li key={r.id} className="rounded-md border border-border p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {r.report_type} · {r.location_name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <RiskBadge level={r.severity as RiskLevel} />
                    <StatusPill status={r.status} />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {r.reporter_name} · {formatDateTime(r.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
