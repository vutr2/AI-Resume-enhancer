/**
 * POST /api/auth/descope-sync — referral tracking on new user signup
 *
 * When a new user signs up via an affiliate link, the aff_ref cookie must be
 * read and a Referral document created. Self-referrals must be blocked.
 * The route also validates the Bearer token and request body.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock state (available inside vi.mock factories) ───────────────
const { mockCollection, mockValidateSession, mockAffiliateFindOne, mockReferralCreate } =
  vi.hoisted(() => ({
    mockCollection: {
      findOne:   vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
    },
    mockValidateSession: vi.fn(),
    mockAffiliateFindOne: vi.fn(),
    mockReferralCreate:   vi.fn(),
  }));

vi.mock('@/lib/db', () => ({
  default: vi.fn(),
  getDb: vi.fn().mockResolvedValue({ collection: () => mockCollection }),
}));

vi.mock('@/lib/descope', () => ({
  getDescopeClient: () => ({ validateSession: mockValidateSession }),
}));

vi.mock('@/lib/plans', () => ({
  getUserPlan: vi.fn().mockReturnValue({ planKey: 'free', features: {} }),
}));

vi.mock('@/models/Affiliate', () => ({
  default: { findOne: (...a) => mockAffiliateFindOne(...a) },
}));

vi.mock('@/models/Referral', () => ({
  default: { create: (...a) => mockReferralCreate(...a) },
}));

import { POST } from '@/app/api/auth/descope-sync/route';

// ── Helpers ───────────────────────────────────────────────────────────────

const VALID_TOKEN  = 'valid-jwt-token';
const DESCOPE_ID   = 'U123';
const USER_EMAIL   = 'user@test.com';

function makeRequest({ body = {}, authHeader = `Bearer ${VALID_TOKEN}`, cookies = {} } = {}) {
  return {
    headers: { get: (h) => (h === 'Authorization' ? authHeader : null) },
    json: async () => body,
    cookies: { get: (name) => cookies[name] ? { value: cookies[name] } : undefined },
  };
}

const defaultBody = { userId: DESCOPE_ID, email: USER_EMAIL, name: 'Test User' };

// ── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/auth/descope-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: valid session
    mockValidateSession.mockResolvedValue({ token: { sub: DESCOPE_ID } });

    // Default: existing user (isNewUser = false)
    mockCollection.findOne.mockResolvedValue({
      _id: { toString: () => 'db-user-id' },
      descopeId: DESCOPE_ID,
      email: USER_EMAIL,
      name: 'Test User',
      plan: 'free',
      onboardingCompleted: true,
    });
    mockCollection.updateOne.mockResolvedValue({});
  });

  // ── Auth validation ──────────────────────────────────────────────────────

  it('returns 401 when Authorization header is missing', async () => {
    const res = await POST(makeRequest({ authHeader: null }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when Bearer token is invalid', async () => {
    mockValidateSession.mockRejectedValue(new Error('invalid'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 400 when userId is missing from body', async () => {
    const res = await POST(makeRequest({ body: { email: USER_EMAIL } }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing from body', async () => {
    const res = await POST(makeRequest({ body: { userId: DESCOPE_ID } }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when userId does not match the token sub', async () => {
    const res = await POST(makeRequest({ body: { userId: 'DIFFERENT-ID', email: USER_EMAIL } }));
    expect(res.status).toBe(403);
  });

  // ── Existing user ────────────────────────────────────────────────────────

  it('returns isNewUser=false for an existing user', async () => {
    const res = await POST(makeRequest({ body: defaultBody }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.isNewUser).toBe(false);
  });

  it('does not create a referral for an existing user', async () => {
    await POST(makeRequest({ body: defaultBody, cookies: { aff_ref: 'someref' } }));
    expect(mockReferralCreate).not.toHaveBeenCalled();
  });

  // ── New user + referral tracking ─────────────────────────────────────────

  it('returns isNewUser=true when user is created for the first time', async () => {
    mockCollection.findOne.mockResolvedValue(null); // no existing user
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-db-id' });
    mockAffiliateFindOne.mockResolvedValue(null);

    const res = await POST(makeRequest({ body: defaultBody }));
    const data = await res.json();
    expect(data.data.isNewUser).toBe(true);
  });

  it('creates a Referral when new user signed up via affiliate link', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-db-id' });
    mockAffiliateFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'aff-id', descopeUserId: 'OTHER-USER' }),
    });
    mockReferralCreate.mockResolvedValue({});

    await POST(makeRequest({ body: defaultBody, cookies: { aff_ref: 'ref123' } }));

    expect(mockReferralCreate).toHaveBeenCalledWith(expect.objectContaining({
      affiliateId: 'aff-id',
      refCode: 'ref123',
      referredUserId: DESCOPE_ID,
    }));
  });

  it('blocks self-referral: does not create Referral when affiliate === signing-up user', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-db-id' });
    // Affiliate's descopeUserId matches the new user's descopeId
    mockAffiliateFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'aff-id', descopeUserId: DESCOPE_ID }),
    });

    await POST(makeRequest({ body: defaultBody, cookies: { aff_ref: 'myownref' } }));

    expect(mockReferralCreate).not.toHaveBeenCalled();
  });

  it('skips referral creation when aff_ref cookie is not present', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-db-id' });

    await POST(makeRequest({ body: defaultBody })); // no cookies
    expect(mockReferralCreate).not.toHaveBeenCalled();
  });

  it('skips referral when affiliate refCode is not found in DB', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-db-id' });
    mockAffiliateFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null), // no affiliate with that refCode
    });

    await POST(makeRequest({ body: defaultBody, cookies: { aff_ref: 'unknown-code' } }));
    expect(mockReferralCreate).not.toHaveBeenCalled();
  });
});
