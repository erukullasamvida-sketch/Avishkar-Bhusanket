import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mountain, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { testBackend } from "@/lib/api/test";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BHUSANKET — AI Landslide Early Warning System" },
      {
        name: "description",
        content:
          "Sign in to BHUSANKET, an AI-based early warning and landslide risk monitoring system for the North Eastern Region of India.",
      },
      { property: "og:title", content: "BHUSANKET — AI Landslide Early Warning System" },
      {
        property: "og:description",
        content:
          "Monitor, predict and respond to landslide risk across Assam and the North Eastern Region of India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", email: "admin@bhusanket.in", name: "Admin" },
  {
    role: "dmo",
    label: "Disaster Management Officer",
    email: "dmo@bhusanket.in",
    name: "D. Sharma",
  },
  {
    role: "field_officer",
    label: "Field Officer",
    email: "field@bhusanket.in",
    name: "R. Terang",
  },
] as const;

function AuthPage() {
  useEffect(() => {
    testBackend()
      .then((data) => {
        console.log("BACKEND CONNECTED:", data);
      })
      .catch((error) => {
        console.error("BACKEND CONNECTION FAILED:", error);
      });
  }, []);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  async function enter() {
    await queryClient.invalidateQueries();
    navigate({ to: "/dashboard" });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy("login");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (error) {
        toast.error("Unable to sign in. Check your email and password, then try again.");
        return;
      }
      await enter();
    } catch {
      toast.error("Unable to sign in right now. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy("signup");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: signupName || signupEmail.split("@")[0], role: "field_officer" },
        },
      });
      if (error) {
        toast.error("Unable to create your account. Please check your details and try again.");
        return;
      }
      if (!data.session) {
        toast.success(
          "Account created. Please check your email and confirm your account before signing in.",
        );
        return;
      }
      await enter();
    } catch {
      toast.error("Unable to create your account right now. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function demoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    setBusy(account.role);
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
    if (!demoPassword) {
      setBusy(null);
      toast.error("Demo login is not configured.");
      return;
    }

    let { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: demoPassword,
    });
    if (error) {
      await supabase.auth.signUp({
        email: account.email,
        password: demoPassword,
        options: { data: { full_name: account.name, role: account.role } },
      });
      ({ error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: demoPassword,
      }));
    }
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    await enter();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_minmax(0,520px)]">
      <section className="relative hidden flex-col justify-between bg-navy p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary">
            <Mountain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">BHUSANKET</p>
            <p className="text-xs text-white/60">Government of India · NE Region</p>
          </div>
        </div>
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Detect Early. Warn Faster. Act Smarter.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Continuous monitoring of rainfall, soil moisture, slope and terrain across Assam and the
            North Eastern Region — with predictive alerts, GIS mapping and field reporting for
            disaster management teams.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              ["8", "Monitored locations"],
              ["0", "Active alerts"],
              ["24×7", "Monitoring"],
              ["8", "Key locations"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/40">
          Smarter Insights. Safer Communities. A Resilient North East.
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary">
              <Mountain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">BHUSANKET</p>
              <p className="text-xs text-muted-foreground">AI Risk Monitoring</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your monitoring account</p>

            <Tabs defaultValue="login" className="mt-5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="officer@bhusanket.in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy !== null}>
                    {busy === "login" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@department.gov.in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      required
                      minLength={8}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy !== null}>
                    {busy === "signup" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 border-t border-border pt-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Quick demo login
              </div>
              <div className="grid gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <Button
                    key={account.role}
                    variant="outline"
                    className="justify-start"
                    disabled={busy !== null}
                    onClick={() => demoLogin(account)}
                  >
                    {busy === account.role && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue as {account.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
