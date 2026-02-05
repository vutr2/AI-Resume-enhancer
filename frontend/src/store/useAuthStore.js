import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Set user from Descope session
      setUser: (user) => {
        set({ user, isInitialized: true });
      },

      // Clear user on logout
      clearUser: () => {
        set({ user: null, isInitialized: true });
      },

      // Logout - clear user and call logout API
      logout: async () => {
        try {
          await api.logout();
        } catch (error) {
          console.error('Logout API error:', error);
        }
        // Clear local storage token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
        set({ user: null, isInitialized: true });

        // Reset resume store to free memory
        const { useResumeStore } = await import('@/store/useResumeStore');
        useResumeStore.getState().reset();
      },

      // Load user profile from our database (after Descope auth)
      loadUserProfile: async () => {
        set({ isLoading: true });
        try {
          const response = await api.getProfile();
          if (response.success) {
            set({ user: response.data.user, isLoading: false, isInitialized: true });
            return { success: true, user: response.data.user };
          }
          throw new Error(response.message || 'Failed to load profile');
        } catch (error) {
          set({ error: error.message, isLoading: false, isInitialized: true });
          return { success: false, error: error.message };
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.updateProfile(data);
          if (response.success) {
            set({ user: response.data.user, isLoading: false });
            return { success: true };
          }
          throw new Error(response.message || 'Cập nhật thất bại');
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.changePassword(currentPassword, newPassword);
          if (response.success) {
            set({ isLoading: false });
            return { success: true, message: response.message };
          }
          throw new Error(response.message || 'Đổi mật khẩu thất bại');
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Cập nhật số credits còn lại sau khi sử dụng
      updateCreditsRemaining: (creditsRemaining, maxCredits) => {
        const user = get().user;
        if (user) {
          const updatedUser = {
            ...user,
            creditsRemaining,
          };
          // Update maxCredits if provided by server
          if (maxCredits !== undefined) {
            updatedUser.maxCredits = maxCredits;
          }
          // Calculate monthlyCreditsUsed from server values
          if (creditsRemaining !== -1 && updatedUser.maxCredits > 0) {
            updatedUser.monthlyCreditsUsed = updatedUser.maxCredits - creditsRemaining;
          }
          set({ user: updatedUser });
        }
      },

      // Helper getters
      isAuthenticated: () => !!get().user,
      isPremium: () => {
        const user = get().user;
        return user && ['basic', 'pro', 'enterprise'].includes(user.plan);
      },
      getPlan: () => get().user?.plan || 'free',
      getCreditsRemaining: () => {
        const user = get().user;
        if (!user) return 0;
        if (user.isUnlimited || user.creditsRemaining === -1) return -1;
        return user.creditsRemaining ?? 0;
      },
      getMaxCredits: () => {
        const user = get().user;
        if (!user) return 5; // free plan default
        if (user.isUnlimited || user.maxCredits === -1) return -1;
        return user.maxCredits ?? 5;
      },
      hasFeature: (featureName) => {
        const user = get().user;
        if (!user?.features) return false;
        return user.features[featureName] === true;
      },

      clearError: () => set({ error: null }),
      setInitialized: (value) => set({ isInitialized: value }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      storage: typeof window !== 'undefined'
        ? {
            getItem: (name) => {
              const value = sessionStorage.getItem(name);
              return value ? JSON.parse(value) : null;
            },
            setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
            removeItem: (name) => sessionStorage.removeItem(name),
          }
        : undefined,
    }
  )
);
