import { authMiddleware } from '@descope/nextjs-sdk/server';

const descopeAuth = authMiddleware({
  projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,

  // Routes that require authentication
  publicRoutes: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/pricing',
    '/api/auth/descope-sync',
    '/api/auth/complete-profile',
    '/api/payments/sepay/create',
    '/api/payments/sepay/callback',
    '/api/payments/sepay/ipn',
  ],

  // Redirect unauthenticated users to login
  redirectUrl: '/login',
});

export default async function middleware(request) {
  const response = await descopeAuth(request);

  // Affiliate tracking: persist ?ref= as a 30-day cookie (last-touch)
  const ref = request.nextUrl.searchParams.get('ref');
  if (ref?.trim() && response) {
    response.cookies.set('aff_ref', ref.trim().toLowerCase(), {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
