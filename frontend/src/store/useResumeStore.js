import { create } from 'zustand';
import api from '@/lib/api';

export const useResumeStore = create((set, get) => ({
  // State
  currentResume: null,
  resumes: [],
  pagination: null,
  isLoading: false,
  isUploading: false,
  isAnalyzing: false,
  error: null,

  // Upload Progress - để hiển thị tiến trình xử lý
  uploadProgress: {
    step: 0, // 0: idle, 1: uploading, 2: parsing, 3: analyzing, 4: done
    message: '',
    percent: 0,
  },

  // Scores & Analysis
  scores: null,
  analysis: null,

  // Job Match
  jobMatches: [],
  currentJobMatch: null,

  // Cover Letters
  coverLetters: [],

  // ==========================================
  // Resume Actions
  // ==========================================
  setUploadProgress: (step, message, percent) => {
    set({ uploadProgress: { step, message, percent } });
  },

  resetUploadProgress: () => {
    set({ uploadProgress: { step: 0, message: '', percent: 0 } });
  },

  uploadResume: async (file, autoParse = true) => {
    const { setUploadProgress, resetUploadProgress } = get();

    set({ isUploading: true, error: null });
    setUploadProgress(1, 'Đang tải lên CV...', 10);

    try {
      const response = await api.uploadResume(file);
      if (response.success) {
        const resume = response.data.resume;
        setUploadProgress(1, 'Tải lên thành công!', 25);

        set((state) => ({
          currentResume: resume,
          resumes: [resume, ...state.resumes],
          isUploading: false,
        }));

        // Tự động xử lý CV (parse + analyze trong 1 lần gọi AI)
        if (autoParse && resume._id) {
          setUploadProgress(2, 'Đang phân tích CV bằng AI...', 40);

          const processResult = await get().processResume(resume._id);
          if (processResult.success) {
            setUploadProgress(4, 'Hoàn tất! CV đã sẵn sàng.', 100);
            console.log('CV processed with scores:', processResult.scores);

            // Reset progress sau 2 giây
            setTimeout(() => resetUploadProgress(), 2000);
          } else {
            setUploadProgress(4, 'Hoàn tất (có lỗi khi phân tích)', 100);
            setTimeout(() => resetUploadProgress(), 2000);
          }
        } else {
          resetUploadProgress();
        }

        return { success: true, resume };
      }
      throw new Error(response.message || 'Upload thất bại');
    } catch (error) {
      set({ error: error.message, isUploading: false });
      setUploadProgress(0, '', 0);
      return { success: false, error: error.message };
    }
  },

  loadResumes: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getResumes(params);
      if (response.success) {
        set({
          resumes: response.data.resumes,
          pagination: response.data.pagination,
          isLoading: false,
        });
        return { success: true };
      }
      throw new Error(response.message || 'Không thể tải danh sách CV');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  selectResume: async (resumeId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getResume(resumeId);
      if (response.success) {
        const resume = response.data.resume;
        set({
          currentResume: resume,
          scores: resume.scores || null,
          analysis: resume.analysis || null,
          isLoading: false,
        });
        return { success: true, resume };
      }
      throw new Error(response.message || 'Không tìm thấy CV');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateResume: async (resumeId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.updateResume(resumeId, data);
      if (response.success) {
        const resume = response.data.resume;
        set((state) => ({
          currentResume: state.currentResume?._id === resumeId ? resume : state.currentResume,
          resumes: state.resumes.map((r) => (r._id === resumeId ? resume : r)),
          isLoading: false,
        }));
        return { success: true, resume };
      }
      throw new Error(response.message || 'Cập nhật thất bại');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteResume: async (resumeId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.deleteResume(resumeId);
      if (response.success) {
        set((state) => ({
          currentResume: state.currentResume?._id === resumeId ? null : state.currentResume,
          resumes: state.resumes.filter((r) => r._id !== resumeId),
          isLoading: false,
        }));
        return { success: true };
      }
      throw new Error(response.message || 'Xóa CV thất bại');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  toggleFavorite: async (resumeId) => {
    const resume = get().resumes.find((r) => r._id === resumeId);
    if (!resume) return { success: false };

    try {
      const response = await api.toggleFavorite(resumeId, !resume.isFavorite);
      if (response.success) {
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r._id === resumeId ? { ...r, isFavorite: !r.isFavorite } : r
          ),
        }));
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // AI Actions
  // ==========================================

  // Combined parse + analyze (faster - single AI call)
  processResume: async (resumeId, jobDescription = null) => {
    set({ isAnalyzing: true, error: null });
    try {
      const response = await api.processResume(resumeId, jobDescription);
      if (response.success) {
        const { parsedData, scores, analysis, creditsRemaining } = response.data;
        set((state) => ({
          scores,
          analysis,
          isAnalyzing: false,
          currentResume: state.currentResume?._id === resumeId
            ? { ...state.currentResume, parsedData, scores, analysis, status: 'analyzed' }
            : state.currentResume,
          resumes: state.resumes.map((r) =>
            r._id === resumeId ? { ...r, parsedData, scores, analysis, status: 'analyzed' } : r
          ),
        }));

        // Cập nhật credits trong auth store nếu có
        if (creditsRemaining !== undefined) {
          const { useAuthStore } = await import('@/store/useAuthStore');
          useAuthStore.getState().updateCreditsRemaining(creditsRemaining);
        }

        return { success: true, parsedData, scores, analysis, creditsRemaining };
      }
      throw new Error(response.message || 'Xử lý CV thất bại');
    } catch (error) {
      set({ error: error.message, isAnalyzing: false });
      return { success: false, error: error.message };
    }
  },

  parseResume: async (resumeId) => {
    set({ isAnalyzing: true, error: null });
    try {
      const response = await api.parseResume(resumeId);
      if (response.success) {
        // Reload the resume to get updated parsed data
        await get().selectResume(resumeId);
        set({ isAnalyzing: false });
        return { success: true, parsedData: response.data.parsedData };
      }
      throw new Error(response.message || 'Phân tích CV thất bại');
    } catch (error) {
      set({ error: error.message, isAnalyzing: false });
      return { success: false, error: error.message };
    }
  },

  analyzeResume: async (resumeId, jobDescription = null) => {
    set({ isAnalyzing: true, error: null });
    try {
      const response = await api.analyzeResume(resumeId, jobDescription);
      if (response.success) {
        const newScores = response.data.scores;
        const newAnalysis = response.data.analysis;
        set((state) => ({
          scores: newScores,
          analysis: newAnalysis,
          isAnalyzing: false,
          // Cập nhật scores trong currentResume
          currentResume: state.currentResume?._id === resumeId
            ? { ...state.currentResume, scores: newScores, analysis: newAnalysis }
            : state.currentResume,
          // Cập nhật scores trong danh sách resumes
          resumes: state.resumes.map((r) =>
            r._id === resumeId ? { ...r, scores: newScores, analysis: newAnalysis } : r
          ),
        }));
        return { success: true, scores: newScores, analysis: newAnalysis };
      }
      throw new Error(response.message || 'Phân tích CV thất bại');
    } catch (error) {
      set({ error: error.message, isAnalyzing: false });
      return { success: false, error: error.message };
    }
  },

  rewriteContent: async (content, contentType, targetJob) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.rewriteContent(content, contentType, targetJob);
      if (response.success) {
        set({ isLoading: false });
        return { success: true, data: response.data };
      }
      throw new Error(response.message || 'Viết lại nội dung thất bại');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // Job Match Actions
  // ==========================================
  matchJob: async (resumeId, jobDescription, jobTitle, companyName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.matchJob(resumeId, jobDescription, jobTitle, companyName);
      if (response.success) {
        const jobMatch = response.data;
        set((state) => ({
          currentJobMatch: jobMatch,
          jobMatches: [jobMatch, ...state.jobMatches],
          isLoading: false,
        }));
        return { success: true, jobMatch };
      }
      throw new Error(response.message || 'So khớp CV thất bại');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // Cover Letter Actions
  // ==========================================
  generateCoverLetter: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.generateCoverLetter(data);
      if (response.success) {
        const coverLetter = response.data.coverLetter;
        const creditsRemaining = response.data.creditsRemaining;
        set((state) => ({
          coverLetters: [coverLetter, ...state.coverLetters],
          isLoading: false,
        }));

        // Cập nhật credits trong auth store nếu có
        if (creditsRemaining !== undefined) {
          const { useAuthStore } = await import('@/store/useAuthStore');
          useAuthStore.getState().updateCreditsRemaining(creditsRemaining);
        }

        return { success: true, coverLetter, keyPoints: response.data.keyPoints };
      }
      throw new Error(response.message || 'Tạo thư ứng tuyển thất bại');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // Utility Actions
  // ==========================================
  setCurrentResume: (resume) => set({ currentResume: resume }),

  analyzeATS: async (resumeId, jobDescription = null) => {
    return get().analyzeResume(resumeId, jobDescription);
  },

  rewriteResume: async (resumeId, style, tone) => {
    set({ isLoading: true, error: null });
    try {
      // Lấy resume từ state hoặc fetch
      let resume = get().currentResume;
      if (!resume || resume._id !== resumeId) {
        resume = get().resumes.find((r) => r._id === resumeId);
      }

      if (!resume) {
        throw new Error('Không tìm thấy CV');
      }

      // Lấy nội dung CV để viết lại
      const content = resume.rawText || JSON.stringify(resume.parsedData || {});

      // Tạo targetJob từ style và tone
      const targetJob = `Phong cách: ${style}, Giọng điệu: ${tone}`;

      const response = await api.rewriteContent(content, 'CV', targetJob);
      if (response.success) {
        set({ isLoading: false });
        // Trả về kết quả với format mà RewriteTab mong đợi
        // Đảm bảo content luôn là string
        let rewrittenText = '';
        if (typeof response.data.rewrittenContent === 'string') {
          rewrittenText = response.data.rewrittenContent;
        } else if (typeof response.data.content === 'string') {
          rewrittenText = response.data.content;
        } else if (response.data.rewrittenContent) {
          // Nếu là object, stringify nó
          rewrittenText = JSON.stringify(response.data.rewrittenContent, null, 2);
        } else {
          // Fallback: stringify toàn bộ data
          rewrittenText = JSON.stringify(response.data, null, 2);
        }
        return {
          success: true,
          optimizedVersion: {
            content: rewrittenText,
            changes: response.data.changes || [],
            improvements: response.data.improvements || [],
          },
        };
      }
      throw new Error(response.message || 'Viết lại CV thất bại');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  clearCurrentResume: () =>
    set({
      currentResume: null,
      scores: null,
      analysis: null,
      currentJobMatch: null,
    }),

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      currentResume: null,
      resumes: [],
      pagination: null,
      isLoading: false,
      isUploading: false,
      isAnalyzing: false,
      error: null,
      scores: null,
      analysis: null,
      jobMatches: [],
      currentJobMatch: null,
      coverLetters: [],
    }),
}));
