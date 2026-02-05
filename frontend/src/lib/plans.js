/**
 * Centralized plan configuration
 * All plan limits and feature flags in one place
 */

export const PLANS = {
  free: {
    name: 'Miễn phí',
    monthlyAICredits: 5,
    monthlyCVUploads: 3,
    features: {
      atsBasic: true,
      atsAdvanced: false,
      atsDetailed: false,
      rewriteCV: false,
      matchJob: false,
      coverLetter: false,
      exportPDF: false,
      prioritySupport: false,
    },
  },
  basic: {
    name: 'Basic',
    monthlyAICredits: 20,
    monthlyCVUploads: 10,
    features: {
      atsBasic: true,
      atsAdvanced: true,
      atsDetailed: false,
      rewriteCV: true,
      matchJob: false,
      coverLetter: false,
      exportPDF: true,
      prioritySupport: false,
    },
  },
  pro: {
    name: 'Pro',
    monthlyAICredits: -1, // unlimited
    monthlyCVUploads: -1, // unlimited
    features: {
      atsBasic: true,
      atsAdvanced: true,
      atsDetailed: true,
      rewriteCV: true,
      matchJob: true,
      coverLetter: true,
      exportPDF: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    monthlyAICredits: -1,
    monthlyCVUploads: -1,
    features: {
      atsBasic: true,
      atsAdvanced: true,
      atsDetailed: true,
      rewriteCV: true,
      matchJob: true,
      coverLetter: true,
      exportPDF: true,
      prioritySupport: true,
    },
  },
};

/**
 * Get plan config for a user, checking expiration
 */
export function getUserPlan(user) {
  const planKey = user?.plan || 'free';
  const config = PLANS[planKey] || PLANS.free;

  // Check if paid plan has expired
  if (planKey !== 'free') {
    const expiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
    if (!expiresAt || new Date() >= expiresAt) {
      return { ...PLANS.free, planKey: 'free', expired: true };
    }
  }

  return { ...config, planKey, expired: false };
}

/**
 * Get max AI credits for a user's current plan
 */
export function getMaxAICredits(user) {
  const plan = getUserPlan(user);
  return plan.monthlyAICredits;
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeature(user, featureName) {
  const plan = getUserPlan(user);
  return plan.features[featureName] === true;
}
