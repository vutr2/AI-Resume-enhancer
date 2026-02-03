import { authMiddleware } from '@descope/nextjs-sdk/server';

// Descope middleware handles session validation automatically
// Protected routes require authentication
export default authMiddleware({
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
    '/api/payments/zalopay/callback',
    '/api/payments/vnpay/callback',
    '/api/auth/complete-profile',
  ],

  // Redirect unauthenticated users to login
  redirectUrl: '/login',
});

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
