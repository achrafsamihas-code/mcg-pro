import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { UserRole, ROLE_DASHBOARD_ROUTES, isValidRole } from "@/types";
import PortalGateway from "@/components/portal/PortalGateway";

/**
 * Smart Router / Portal Gateway — application root (`/`).
 *
 * 1. If a Supabase session exists, resolve the user's role and redirect to the
 *    matching dashboard route group.
 * 2. Otherwise (or when Supabase isn't configured yet), render the premium
 *    development gateway so every role's live dashboard is reachable on Vercel.
 *
 * Server Component: auth resolution happens before any HTML is sent, so there
 * is no flash of the gateway for authenticated users.
 */

// Always evaluate per-request (session cookies must not be cached).
export const dynamic = "force-dynamic";

/**
 * Maps any role string — canonical enum values or the spec's alternate names
 * (warehouse_owner / driver / buyer / admin) — to a dashboard route.
 */
function resolveDashboard(role: string | undefined | null): string | null {
  if (!role) return null;

  // Canonical values defined by the UserRole enum.
  if (isValidRole(role)) {
    return ROLE_DASHBOARD_ROUTES[role];
  }

  // Tolerate alternate naming so redirects work regardless of how the role
  // was seeded into the database / JWT.
  const aliases: Record<string, UserRole> = {
    admin: UserRole.SUPER_ADMIN,
    ceo: UserRole.SUPER_ADMIN,
    warehouse_owner: UserRole.WAREHOUSE,
    driver: UserRole.LOGISTICS,
    buyer: UserRole.CUSTOMER,
  };

  const mapped = aliases[role.toLowerCase()];
  return mapped ? ROLE_DASHBOARD_ROUTES[mapped] : null;
}

export default async function RootPage() {
  // No backend configured (e.g. preview without env): show the gateway.
  if (!isSupabaseConfigured) {
    return <PortalGateway />;
  }

  const supabase = await createClient();

  // getUser() revalidates the token server-side (never trust getSession alone).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Fast path: role from server-controlled JWT app_metadata.
    let role = (user.app_metadata?.role as string | undefined) ?? null;

    // Fallback: read role from the accounts table.
    if (!role) {
      const { data: account } = await supabase
        .from("accounts")
        .select("role")
        .eq("id", user.id)
        .single();
      role = account?.role ?? null;
    }

    const destination = resolveDashboard(role);
    if (destination) {
      redirect(destination);
    }
    // Authenticated but no resolvable role — fall through to the gateway.
  }

  return <PortalGateway />;
}
