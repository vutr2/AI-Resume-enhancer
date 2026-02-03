import { cookies } from 'next/headers';
import { session } from '@descope/nextjs-sdk/server';

// Get current user from Descope session
export async function getCurrentUser() {
  try {
    // Get Descope session from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('DS')?.value;

    if (!sessionToken) {
      return null;
    }

    // Validate Descope session
    const sessionData = await session();

    if (!sessionData?.token?.sub) {
      return null;
    }

    return {
      descopeId: sessionData.token.sub,
      email: sessionData.token.email,
      name: sessionData.token.name,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Get user ID from Descope session (for database queries)
export async function getDescopeUserId() {
  try {
    const sessionData = await session();
    return sessionData?.token?.sub || null;
  } catch (error) {
    console.error('Error getting Descope user ID:', error);
    return null;
  }
}
