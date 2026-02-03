// Descope Configuration
import DescopeClient from '@descope/node-sdk';

// Server-side Descope client for management operations
let descopeClient = null;

export function getDescopeClient() {
  if (!descopeClient) {
    descopeClient = DescopeClient({
      projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,
      managementKey: process.env.DESCOPE_MANAGEMENT_KEY,
    });
  }
  return descopeClient;
}

// Extract user info from Descope session token
export function extractUserFromToken(sessionToken) {
  if (!sessionToken) return null;

  try {
    // Decode JWT payload (Descope tokens are JWTs)
    const parts = sessionToken.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0],
      image: payload.picture,
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}
