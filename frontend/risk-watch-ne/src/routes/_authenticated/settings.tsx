import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell, SectionCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhoneNumber } from "@/lib/phone";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — BHUSANKET" },
      {
        name: "description",
        content:
          "Manage your BHUSANKET profile, notification preferences and language for landslide monitoring alerts.",
      },
      { property: "og:title", content: "Settings — BHUSANKET" },
      {
        property: "og:description",
        content: "Profile, notifications and language preferences for BHUSANKET.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

type Prefs = {
  critical_alerts: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  realtime_alerts: boolean;
  language: string;
};

const DEFAULT_PREFS: Prefs = {
  critical_alerts: true,
  email_notifications: true,
  sms_notifications: false,
  realtime_alerts: true,
  language: "en",
};

function SettingsPage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("field_officer");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setRole(profile.role);
    }
  }, [profile]);

  const { data: stored } = useQuery({
    queryKey: ["settings", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async (): Promise<Prefs> => {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", profile!.id)
        .maybeSingle();
      return data ? ({ ...DEFAULT_PREFS, ...data } as Prefs) : DEFAULT_PREFS;
    },
  });

  useEffect(() => {
    if (stored) setPrefs(stored);
  }, [stored]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, role })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile updated");
  }

  async function savePhoneNumber() {
    if (!profile) return;
    const normalizedPhone = phone.trim() ? normalizePhoneNumber(phone) : null;
    if (phone.trim() && !normalizedPhone) {
      toast.error("Enter a valid mobile number with country code, such as +91 98765 43210.");
      return;
    }

    setSavingPhone(true);
    const { error } = await supabase.auth.updateUser({
      data: { phone: normalizedPhone },
    });
    setSavingPhone(false);
    if (error) {
      toast.error("Could not save your mobile number.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Mobile number updated");
  }

  async function savePref(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    if (!profile) return;
    const { error } = await supabase
      .from("settings")
      .upsert({ user_id: profile.id, ...next, updated_at: new Date().toISOString() });
    if (error) {
      toast.error("Could not save this preference.");
      return;
    }
    toast.success("Preference saved");
  }

  const toggles: [keyof Prefs, string, string][] = [
    ["realtime_alerts", "Enable real-time alerts", "Show live alerts as monitoring data arrives"],
    ["critical_alerts", "Critical alerts", "Always notify me about critical risk areas"],
    ["email_notifications", "Email notifications", "Send alert summaries to my email"],
    ["sms_notifications", "SMS notifications", "Allow SMS alerts"],
  ];

  return (
    <AppShell
      title="Settings"
      subtitle="Account, notifications and system preferences"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Account Information">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {(profile?.name ?? "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{profile?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname">Full name</Label>
              <Input id="fullname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-number">Mobile number</Label>
              <Input
                id="mobile-number"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
              <p className="text-xs text-muted-foreground">
                Include your country code. This number is used for alerts, not login.
              </p>
              <Button onClick={savePhoneNumber} disabled={savingPhone}>
                Save mobile number
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveProfile} disabled={saving}>
              Save profile
            </Button>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Notifications">
            <div className="space-y-4">
              {toggles.map(([key, label, description]) => (
                <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={Boolean(prefs[key])}
                    onCheckedChange={(checked) => savePref({ [key]: checked } as Partial<Prefs>)}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="System Preferences">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={prefs.language} onValueChange={(v) => savePref({ language: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="as">অসমীয়া (Assamese)</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Alert messages and reports will be issued in the selected language.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
