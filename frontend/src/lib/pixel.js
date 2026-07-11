const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const isPixelEnabled = () =>
  typeof window !== 'undefined' &&
  !!PIXEL_ID &&
  typeof window.fbq === 'function';

export function pageview() {
  if (!isPixelEnabled()) return;
  window.fbq('track', 'PageView');
}

export function event(name, options = {}) {
  if (!isPixelEnabled()) return;
  window.fbq('track', name, options);
}

// Named helpers for each conversion event
export const trackCompleteRegistration = () => event('CompleteRegistration');

export const trackInitiateCheckout = ({ value, currency = 'VND' } = {}) =>
  event('InitiateCheckout', value != null ? { value, currency } : {});

export const trackPurchase = ({ value, currency = 'VND' }) =>
  event('Purchase', { value, currency });

export const trackLead = () => event('Lead');
