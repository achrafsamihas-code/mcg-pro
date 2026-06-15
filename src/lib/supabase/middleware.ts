import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UserRole, ROLE_DASHBOARD_ROUTES, isValidRole } from '@/types';

// Configuration: Adjust these routes according to your application routing structure
const LOGIN_ROUTE = '/login';
const UNAUTHORIZED_ROUTE = '/unauthorized';

// Map dashboard path prefixes to the UserRole that is authorized to access them.
const ROUTE_ROLE_REQUIREMENT: { prefix: string; role: UserRole }[] = [
  { prefix: '/admin/dashboard', role: UserRole.SUPER_ADMIN },
  { prefix: '/supplier/dashboard', role: UserRole.SUPPLIER },
  { prefix: '/warehouse/dashboard', role: UserRole.WAREHOUSE },
  { prefix: '/logistics/dashboard', role: UserRole.LOGISTICS },
  { prefix: '/customer/dashboard', role: UserRole.CUSTOMER },
];

/**
 * Resolves the user's role from app_metadata or the fallback 'profiles' database table.
 */
async function getUserRole(supabase: SupabaseClient, userId: string, appMetadataRole?: string): Promise<UserRole | null> {
  // 1. Fast Path: Check secure App Metadata (recommended production setup to avoid DB query overhead)
  if (appMetadataRole && isValidRole(appMetadataRole)) {
    return appMetadataRole;
  }

  // 2. Fallback Path: Query the accounts table (source of truth for role).
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data?.role && isValidRole(data.role)) {
      return data.role;
    }
  } catch (err) {
    console.error('Middleware: Failed to fetch user role from accounts table:', err);
  }

  return null;
}

/**
 * Updates the user's session and enforces role-based access control (RBAC).
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is a dashboard route requiring role-based access
  const activeRouteRequirement = ROUTE_ROLE_REQUIREMENT.find((route) =>
    pathname.startsWith(route.prefix)
  );

  // If this is not a protected dashboard route, let Next.js handle it normally
  if (!activeRouteRequirement) {
    return NextResponse.next({ request });
  }

  // Create an unmodified response container
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Initialize server-side Supabase client inside Next.js Middleware context
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Authenticate user securely (getUser is a secure server call, do not use getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Force authentication: Redirect to login if user is not authenticated
  if (!user) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Resolve role: Query user role from auth metadata or profile table
  const userRole = await getUserRole(supabase, user.id, user.app_metadata?.role);

  // 3. Handle unassigned/invalid role cases
  if (!userRole) {
    const unauthorizedUrl = new URL(UNAUTHORIZED_ROUTE, request.url);
    unauthorizedUrl.searchParams.set('error', 'role_not_assigned');
    return NextResponse.redirect(unauthorizedUrl);
  }

  // 4. Role Authorization: Check if user has permission for the current path
  if (activeRouteRequirement.role !== userRole) {
    // User is authenticated but is trying to access another role's dashboard.
    // Redirect them to their authorized dashboard root.
    const authorizedDashboard = ROLE_DASHBOARD_ROUTES[userRole];
    const redirectUrl = new URL(authorizedDashboard, request.url);
    
    // Log the redirection for audit/debugging purposes
    console.warn(
      `Middleware RBAC: Redirecting User ${user.id} (${userRole}) from "${pathname}" to "${authorizedDashboard}"`
    );

    return NextResponse.redirect(redirectUrl);
  }

  // Session has been refreshed and user is authorized to proceed
  return supabaseResponse;
}
