import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { getLocalDemoSession } from "@/lib/demo-auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  roleLabel: string;
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "System Admin",
  dmo: "Disaster Management Officer",
  field_officer: "Field Officer",
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    staleTime: 60_000,
    queryFn: async (): Promise<CurrentUser | null> => {
      const demoSession = getLocalDemoSession();
      if (demoSession) {
        return {
          id: `local-demo-${demoSession.role}`,
          email: "",
          name: demoSession.name,
          phone: "",
          role: demoSession.role,
          roleLabel: ROLE_LABELS[demoSession.role] ?? "Officer",
        };
      }

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();
      const role = profile?.role ?? (user.user_metadata?.["role"] as string) ?? "field_officer";
      return {
        id: user.id,
        email: user.email ?? "",
        name:
          profile?.full_name ??
          (user.user_metadata?.["full_name"] as string) ??
          (user.email ?? "Officer").split("@")[0]!,
        phone:
          typeof user.user_metadata?.["phone"] === "string"
            ? user.user_metadata["phone"]
            : "",
        role,
        roleLabel: ROLE_LABELS[role] ?? "Officer",
      };
    },
  });
}
