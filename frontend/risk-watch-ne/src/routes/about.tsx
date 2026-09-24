import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — BHUSANKET" },
      {
        name: "description",
        content:
          "BHUSANKET combines AI-driven risk monitoring, early warning alerts, and field intelligence for landslide-prone regions.",
      },
      { property: "og:title", content: "About — BHUSANKET" },
      {
        property: "og:description",
        content:
          "Learn how BHUSANKET monitors landslide risk and supports rapid early warning decisions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell
      title="About BHUSANKET"
      subtitle="AI-led landslide early warning for the North Eastern Region"
    >
      <div className="space-y-6">
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Mission</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            BHUSANKET helps monitor vulnerable slopes, predict elevated landslide risk,
            and surface timely alerts to improve field response and public safety.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-foreground">AI Monitoring</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Live location data and risk modeling identify where conditions are moving into a dangerous range.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-foreground">Rapid Alerts</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Decision-makers can quickly assess critical areas and respond before conditions worsen.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-foreground">Ground Truth</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Field reports and observed conditions strengthen situational awareness across the region.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
