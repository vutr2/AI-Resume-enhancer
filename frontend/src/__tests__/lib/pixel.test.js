/**
 * pixel.js — Meta Pixel tracking helpers
 *
 * Tests verify that fbq is called with the correct event names and options,
 * and that all helpers are safely no-ops when fbq is not loaded or PIXEL_ID
 * is not configured.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── helpers ──────────────────────────────────────────────────────────────────

function setupPixel(pixelId = '123456789') {
  process.env.NEXT_PUBLIC_META_PIXEL_ID = pixelId;
  window.fbq = vi.fn();
}

function teardownPixel() {
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
  delete window.fbq;
}

// Re-import pixel module fresh each test so env var is picked up at load time.
// pixel.js reads NEXT_PUBLIC_META_PIXEL_ID at module scope — we need dynamic import.
async function loadPixel() {
  vi.resetModules();
  return import('@/lib/pixel');
}

// ── isPixelEnabled ────────────────────────────────────────────────────────────

describe('isPixelEnabled', () => {
  afterEach(teardownPixel);

  it('returns false when fbq is not on window', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123';
    const { isPixelEnabled } = await loadPixel();
    expect(isPixelEnabled()).toBe(false);
  });

  it('returns false when PIXEL_ID env var is not set', async () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    window.fbq = vi.fn();
    const { isPixelEnabled } = await loadPixel();
    expect(isPixelEnabled()).toBe(false);
  });

  it('returns true when both fbq and PIXEL_ID are present', async () => {
    setupPixel();
    const { isPixelEnabled } = await loadPixel();
    expect(isPixelEnabled()).toBe(true);
  });
});

// ── pageview ─────────────────────────────────────────────────────────────────

describe('pageview', () => {
  afterEach(teardownPixel);

  it('calls fbq("track", "PageView") when pixel is enabled', async () => {
    setupPixel();
    const { pageview } = await loadPixel();
    pageview();
    expect(window.fbq).toHaveBeenCalledWith('track', 'PageView');
  });

  it('does nothing when fbq is absent', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123';
    // no window.fbq
    const { pageview } = await loadPixel();
    expect(() => pageview()).not.toThrow();
  });
});

// ── event ─────────────────────────────────────────────────────────────────────

describe('event', () => {
  afterEach(teardownPixel);

  it('calls fbq("track", name, options)', async () => {
    setupPixel();
    const { event } = await loadPixel();
    event('CustomEvent', { foo: 'bar' });
    expect(window.fbq).toHaveBeenCalledWith('track', 'CustomEvent', { foo: 'bar' });
  });

  it('defaults options to empty object', async () => {
    setupPixel();
    const { event } = await loadPixel();
    event('AnotherEvent');
    expect(window.fbq).toHaveBeenCalledWith('track', 'AnotherEvent', {});
  });
});

// ── trackCompleteRegistration ─────────────────────────────────────────────────

describe('trackCompleteRegistration', () => {
  afterEach(teardownPixel);

  it('tracks CompleteRegistration with no extra options', async () => {
    setupPixel();
    const { trackCompleteRegistration } = await loadPixel();
    trackCompleteRegistration();
    expect(window.fbq).toHaveBeenCalledWith('track', 'CompleteRegistration', {});
  });

  it('is a no-op when pixel is disabled', async () => {
    // pixel disabled — no fbq
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123';
    const { trackCompleteRegistration } = await loadPixel();
    expect(() => trackCompleteRegistration()).not.toThrow();
  });
});

// ── trackInitiateCheckout ─────────────────────────────────────────────────────

describe('trackInitiateCheckout', () => {
  afterEach(teardownPixel);

  it('includes value and currency when value is provided', async () => {
    setupPixel();
    const { trackInitiateCheckout } = await loadPixel();
    trackInitiateCheckout({ value: 99000, currency: 'VND' });
    expect(window.fbq).toHaveBeenCalledWith('track', 'InitiateCheckout', {
      value: 99000,
      currency: 'VND',
    });
  });

  it('defaults currency to VND', async () => {
    setupPixel();
    const { trackInitiateCheckout } = await loadPixel();
    trackInitiateCheckout({ value: 990000 });
    expect(window.fbq).toHaveBeenCalledWith('track', 'InitiateCheckout', {
      value: 990000,
      currency: 'VND',
    });
  });

  it('sends empty options when value is undefined', async () => {
    setupPixel();
    const { trackInitiateCheckout } = await loadPixel();
    trackInitiateCheckout();
    expect(window.fbq).toHaveBeenCalledWith('track', 'InitiateCheckout', {});
  });

  it('sends empty options when value is explicitly null', async () => {
    setupPixel();
    const { trackInitiateCheckout } = await loadPixel();
    trackInitiateCheckout({ value: null });
    expect(window.fbq).toHaveBeenCalledWith('track', 'InitiateCheckout', {});
  });
});

// ── trackPurchase ─────────────────────────────────────────────────────────────

describe('trackPurchase', () => {
  afterEach(teardownPixel);

  it('sends Purchase event with value and currency', async () => {
    setupPixel();
    const { trackPurchase } = await loadPixel();
    trackPurchase({ value: 99000, currency: 'VND' });
    expect(window.fbq).toHaveBeenCalledWith('track', 'Purchase', {
      value: 99000,
      currency: 'VND',
    });
  });

  it('defaults currency to VND', async () => {
    setupPixel();
    const { trackPurchase } = await loadPixel();
    trackPurchase({ value: 990000 });
    expect(window.fbq).toHaveBeenCalledWith('track', 'Purchase', {
      value: 990000,
      currency: 'VND',
    });
  });

  it('is a no-op when pixel is disabled', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123';
    const { trackPurchase } = await loadPixel();
    expect(() => trackPurchase({ value: 99000 })).not.toThrow();
  });
});

// ── trackLead ─────────────────────────────────────────────────────────────────

describe('trackLead', () => {
  afterEach(teardownPixel);

  it('tracks Lead with no extra options', async () => {
    setupPixel();
    const { trackLead } = await loadPixel();
    trackLead();
    expect(window.fbq).toHaveBeenCalledWith('track', 'Lead', {});
  });

  it('is a no-op when pixel is disabled', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123';
    const { trackLead } = await loadPixel();
    expect(() => trackLead()).not.toThrow();
  });
});
