/**
 * Security: Input Validation on Sensitive Operations
 *
 * Sensitive endpoints must reject malformed or incomplete input before
 * touching the database. These tests verify that validation happens at
 * the route layer — not only inside the DB model.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/lib/affiliate', () => ({ generateRefCode: vi.fn(), isAdmin: vi.fn() }));
vi.mock('@/models/Affiliate', () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('@/models/User', () => ({ default: { findById: vi.fn() } }));

import { getCurrentUser } from '@/lib/auth';
import { POST as affiliateRegisterPost } from '@/app/api/affiliate/register/route';
import { POST as changePasswordPost } from '@/app/api/auth/change-password/route';
import Affiliate from '@/models/Affiliate';

const MOCK_USER = { descopeId: 'user_1', email: 'user@test.com', name: 'Test User' };
function makeReq(body) {
  return { json: async () => body };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(MOCK_USER);
});

// ── Affiliate registration ────────────────────────────────────────────────

describe('POST /api/affiliate/register — bank info validation', () => {
  beforeEach(() => {
    Affiliate.findOne.mockResolvedValue(null); // not yet an affiliate
  });

  it('rejects when bankName is missing', async () => {
    const res = await affiliateRegisterPost(makeReq({ bankName: '', accountNumber: '123', accountHolder: 'A' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rejects when accountNumber is missing', async () => {
    const res = await affiliateRegisterPost(makeReq({ bankName: 'VCB', accountNumber: '   ', accountHolder: 'A' }));
    expect(res.status).toBe(400);
  });

  it('rejects when accountHolder is missing', async () => {
    const res = await affiliateRegisterPost(makeReq({ bankName: 'VCB', accountNumber: '123', accountHolder: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects when all fields are whitespace-only', async () => {
    const res = await affiliateRegisterPost(makeReq({ bankName: '  ', accountNumber: '  ', accountHolder: '  ' }));
    expect(res.status).toBe(400);
  });

  it('rejects when body is completely empty', async () => {
    const res = await affiliateRegisterPost(makeReq({}));
    expect(res.status).toBe(400);
  });
});

// ── Change password ────────────────────────────────────────────────────────

describe('POST /api/auth/change-password — password validation', () => {
  it('rejects when currentPassword is missing', async () => {
    const res = await changePasswordPost(makeReq({ currentPassword: '', newPassword: 'newpass123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rejects when newPassword is missing', async () => {
    const res = await changePasswordPost(makeReq({ currentPassword: 'oldpass', newPassword: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects when newPassword is shorter than 6 characters', async () => {
    const res = await changePasswordPost(makeReq({ currentPassword: 'oldpass', newPassword: '12345' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('accepts when newPassword is exactly 6 characters', async () => {
    const { default: User } = await import('@/models/User');
    User.findById.mockResolvedValue({
      comparePassword: vi.fn().mockResolvedValue(true),
      password: 'old',
      save: vi.fn().mockResolvedValue(true),
    });
    const res = await changePasswordPost(makeReq({ currentPassword: 'oldpass', newPassword: '123456' }));
    // Should pass validation (may fail later due to mock but not a 400)
    expect(res.status).not.toBe(400);
  });
});
