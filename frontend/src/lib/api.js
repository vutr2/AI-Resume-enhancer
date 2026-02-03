// API Client for ResuMax VN - Serverless Backend
const API_BASE_URL = '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies
      ...options,
    };

    // Add auth token if available (for API calls from client)
    // Check both localStorage and sessionStorage
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Lỗi ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==========================================
  // Auth endpoints
  // ==========================================
  async login(email, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
    }
    return result;
  }

  async register(data) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
    }
    return result;
  }

  async logout() {
    const result = await this.request('/auth/logout', {
      method: 'POST',
    });
    localStorage.removeItem('token');
    return result;
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // ==========================================
  // Resume endpoints
  // ==========================================
  async getResumes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/resumes${queryString ? `?${queryString}` : ''}`);
  }

  async getResume(resumeId) {
    return this.request(`/resumes/${resumeId}`);
  }

  async createResume(data) {
    return this.request('/resumes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResume(resumeId, data) {
    return this.request(`/resumes/${resumeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResume(resumeId) {
    return this.request(`/resumes/${resumeId}`, {
      method: 'DELETE',
    });
  }

  async uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${this.baseUrl}/resumes/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload thất bại');
    }
    return data;
  }

  async toggleFavorite(resumeId, isFavorite) {
    return this.updateResume(resumeId, { isFavorite });
  }

  // ==========================================
  // AI endpoints
  // ==========================================

  // Combined parse + analyze in one API call (faster)
  async processResume(resumeId, jobDescription = null) {
    return this.request('/ai/process', {
      method: 'POST',
      body: JSON.stringify({ resumeId, jobDescription }),
    });
  }

  async parseResume(resumeId) {
    return this.request('/ai/parse', {
      method: 'POST',
      body: JSON.stringify({ resumeId }),
    });
  }

  async analyzeResume(resumeId, jobDescription = null) {
    return this.request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ resumeId, jobDescription }),
    });
  }

  async rewriteContent(content, contentType = 'experience', targetJob = null) {
    return this.request('/ai/rewrite', {
      method: 'POST',
      body: JSON.stringify({ content, contentType, targetJob }),
    });
  }

  async generateCoverLetter(data) {
    return this.request('/ai/cover-letter', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async matchJob(resumeId, jobDescription, jobTitle = null, companyName = null) {
    return this.request('/ai/match-job', {
      method: 'POST',
      body: JSON.stringify({ resumeId, jobDescription, jobTitle, companyName }),
    });
  }

  // ==========================================
  // Payment endpoints (VNPay & ZaloPay)
  // ==========================================

  // VNPay
  async createVNPayOrder(planId, billingCycle) {
    return this.request('/payments/vnpay/create', {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle }),
    });
  }

  async checkVNPayStatus(transactionId) {
    return this.request(`/payments/vnpay/status/${transactionId}`);
  }

  // ZaloPay (Coming Soon)
  async createZaloPayOrder(planId, billingCycle) {
    return this.request('/payments/zalopay/create', {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle }),
    });
  }

  async checkZaloPayStatus(transactionId) {
    return this.request(`/payments/zalopay/status/${transactionId}`);
  }

  async getPaymentHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payments/history${queryString ? `?${queryString}` : ''}`);
  }

  async cancelSubscription(reason = '') {
    return this.request('/payments/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ==========================================
  // Utility methods
  // ==========================================
  getPlanPrices() {
    return {
      basic: {
        monthly: 99000,
        yearly: 990000,
        features: [
          '10 CV mỗi tháng',
          '20 lượt viết lại AI',
          '20 lượt kiểm tra ATS',
          'Hỗ trợ qua email',
        ],
      },
      pro: {
        monthly: 199000,
        yearly: 1990000,
        features: [
          'Không giới hạn CV',
          'Không giới hạn AI',
          'Không giới hạn ATS',
          'Tạo thư ứng tuyển',
          'So khớp JD',
          'Hỗ trợ ưu tiên',
        ],
      },
      enterprise: {
        monthly: 499000,
        yearly: 4990000,
        features: [
          'Tất cả tính năng Pro',
          'API access',
          'Quản lý team',
          'Báo cáo chi tiết',
          'Hỗ trợ 24/7',
          'Đào tạo sử dụng',
        ],
      },
    };
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }
}

export const api = new ApiClient();
export default api;
