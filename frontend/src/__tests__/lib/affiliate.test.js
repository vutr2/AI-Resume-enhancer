import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Affiliate model before importing the module under test
vi.mock('@/models/Affiliate', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import { COMMISSION_RATE, isAdmin, generateRefCode } from '@/lib/affiliate';
import Affiliate from '@/models/Affiliate';

describe('COMMISSION_RATE', () => {
  it('is exactly 0.5 (50%)', () => {
    expect(COMMISSION_RATE).toBe(0.5);
  });
});

describe('isAdmin', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'admin@example.com, boss@company.vn';
  });

  it('returns true for an email in ADMIN_EMAILS', () => {
    expect(isAdmin('admin@example.com')).toBe(true);
  });

  it('returns true for the second admin email', () => {
    expect(isAdmin('boss@company.vn')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAdmin('ADMIN@EXAMPLE.COM')).toBe(true);
  });

  it('returns false for a non-admin email', () => {
    expect(isAdmin('user@example.com')).toBe(false);
  });

  it('returns false when email is empty', () => {
    expect(isAdmin('')).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it('returns false when ADMIN_EMAILS env var is not set', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdmin('admin@example.com')).toBe(false);
  });
});

describe('generateRefCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // findOne().lean() chain — no collision by default
    Affiliate.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
  });

  it('returns a non-empty string', async () => {
    const code = await generateRefCode('Nguyễn Văn A');
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });

  it('starts with a slug derived from the name', async () => {
    const code = await generateRefCode('Alice');
    expect(code).toMatch(/^alice/);
  });

  it('contains only lowercase alphanumeric characters', async () => {
    const code = await generateRefCode('Test User 123');
    expect(code).toMatch(/^[a-z0-9]+$/);
  });

  it('retries until a unique code is found', async () => {
    // First call: collision; second call: unique
    const leanCollide = vi.fn().mockResolvedValueOnce({ refCode: 'taken' }).mockResolvedValueOnce(null);
    Affiliate.findOne.mockReturnValue({ lean: leanCollide });

    const code = await generateRefCode('Bob');
    expect(code).toBeTruthy();
    expect(Affiliate.findOne).toHaveBeenCalledTimes(2);
  });

  it('falls back to "user" base when name is empty', async () => {
    const code = await generateRefCode('');
    expect(code).toMatch(/^user/);
  });
});
