import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js Middleware entry point.
 * This intercepts incoming requests and delegates session refreshing & role checks
 * to the Supabase middleware module.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Configure the paths that should trigger this middleware.
 * We match all routes except:
 * - api (API routes, unless you specifically want to run middleware on them)
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon)
 * - Web assets (images, SVGs, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (data fetch endpoints)
     * - favicon.ico (favicon file)
     * - Web assets (png, svg, jpg, jpeg, gif, webp)
     */
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
