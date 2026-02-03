'use client';

import { AuthProvider as DescopeAuthProvider } from '@descope/nextjs-sdk';

export default function AuthProvider({ children }) {
  return (
    <DescopeAuthProvider projectId={process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID}>
      {children}
    </DescopeAuthProvider>
  );
}
