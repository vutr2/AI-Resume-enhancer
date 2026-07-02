import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/Affiliate', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/affiliate', () => ({
  generateRefCode: vi.fn().mockResolvedValue('alice1234'),
}));

import { POST } from '@/app/api/affiliate/register/route';
import { getCurrentUser } from '@/lib/auth';
import Affiliate from '@/models/Affiliate';

// Helper: build a Request-like object
function makeReq(body) {
  return { json: async () => body };
}

const VALID_BODY = {
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  accountHolder: 'NGUYEN VAN A',
};

const MOCK_USER = {
  descopeId: 'desc_123',
  email: 'alice@example.com',
  name: 'Alice',
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
});

describe('POST /api/affiliate/register', () => {
  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 when bank info is missing', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockResolvedValue(null);

    const res = await POST(makeReq({ bankName: '', accountNumber: '123', accountHolder: 'A' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 when accountNumber is missing', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    const res = await POST(makeReq({ bankName: 'VCB', accountNumber: '', accountHolder: 'A' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 when user already has an affiliate record', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockResolvedValue({ _id: 'existing', refCode: 'alice123' });

    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 201 with refCode and affiliateLink on success', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockResolvedValue(null);
    Affiliate.create.mockResolvedValue({
      refCode: 'alice1234',
    });

    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.refCode).toBe('alice1234');
    expect(body.data.affiliateLink).toBe('http://localhost:3000?ref=alice1234');
  });

  it('creates affiliate with trimmed bank info', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockResolvedValue(null);
    Affiliate.create.mockResolvedValue({ refCode: 'alice1234' });

    await POST(makeReq({
      bankName: '  Vietcombank  ',
      accountNumber: '  1234567890  ',
      accountHolder: '  NGUYEN VAN A  ',
    }));

    expect(Affiliate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payoutInfo: {
          bankName: 'Vietcombank',
          accountNumber: '1234567890',
          accountHolder: 'NGUYEN VAN A',
        },
      })
    );
  });

  it('returns 500 on unexpected error', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockRejectedValue(new Error('DB down'));

    const res = await POST(makeReq(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
