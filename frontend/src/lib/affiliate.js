import Affiliate from '@/models/Affiliate';

export const COMMISSION_RATE = 0.5;

/**
 * Generate a unique refCode based on the affiliate's name.
 * Retries until a non-colliding code is found.
 */
export async function generateRefCode(name) {
  const base = (name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 6) || 'user';

  let code;
  let exists = true;
  while (exists) {
    const suffix = Math.random().toString(36).substring(2, 6);
    code = `${base}${suffix}`;
    exists = await Affiliate.findOne({ refCode: code }).lean();
  }
  return code;
}

/**
 * Returns true if the given email is listed in the ADMIN_EMAILS env var.
 */
export function isAdmin(email) {
  if (!email || !process.env.ADMIN_EMAILS) return false;
  const admins = process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}
