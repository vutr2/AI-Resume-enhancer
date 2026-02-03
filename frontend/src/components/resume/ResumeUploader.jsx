'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import { useResumeStore } from '@/store/useResumeStore';
import { useAuthStore } from '@/store/useAuthStore';
import OutOfCreditsModal from '../credits/OutOfCreditsModal';

// Progress steps configuration (giờ chỉ có 2 bước vì parse + analyze gộp thành 1)
const PROGRESS_STEPS = [
  { step: 1, label: 'Tải lên', icon: Upload },
  { step: 2, label: 'Phân tích AI', icon: FileText },
];

export default function ResumeUploader({ onUpload, isLoading = false }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const { uploadProgress } = useResumeStore();
  const { user } = useAuthStore();

  // Tính số credits còn lại
  const creditsRemaining = user?.creditsRemaining ?? (user?.isFirstMonth !== false ? 10 : 3);
  const maxCredits = user?.isFirstMonth !== false ? 10 : 3;
  const isUnlimited = creditsRemaining === -1;

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File quá lớn. Tối đa 10MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Chỉ chấp nhận file PDF hoặc DOCX.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleRemove = () => {
    setFile(null);
    setError('');
  };

  const handleUpload = () => {
    // Kiểm tra còn credits không (trừ khi unlimited)
    if (!isUnlimited && creditsRemaining <= 0) {
      setShowOutOfCreditsModal(true);
      return;
    }

    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={clsx(
            'dropzone',
            isDragActive && 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-5'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <div className="text-center">
              <p className="text-[var(--foreground)] font-medium mb-1">
                {isDragActive ? 'Thả file vào đây' : 'Kéo thả file CV vào đây'}
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                hoặc click để chọn file (PDF, DOCX - tối đa 10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--foreground)]">{file.name}</p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 hover:bg-[var(--background-secondary)] rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-[var(--foreground-muted)]" />
            </button>
          </div>
          {/* Progress Indicator */}
          {uploadProgress.step > 0 ? (
            <div className="mt-6">
              {/* Progress Bar */}
              <div className="relative">
                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
              </div>

              {/* Steps Indicator */}
              <div className="flex justify-between mt-4">
                {PROGRESS_STEPS.map((s) => {
                  const Icon = s.icon;
                  const isActive = uploadProgress.step === s.step;
                  const isCompleted = uploadProgress.step > s.step;
                  const isPending = uploadProgress.step < s.step;

                  return (
                    <div
                      key={s.step}
                      className={clsx(
                        'flex flex-col items-center gap-2 transition-all',
                        isActive && 'scale-105'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                          isCompleted && 'bg-[var(--success)] text-white',
                          isActive && 'bg-[var(--primary)] text-white',
                          isPending && 'bg-[var(--border)] text-[var(--foreground-muted)]'
                        )}
                      >
                        {isActive ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={clsx(
                          'text-xs font-medium',
                          isActive && 'text-[var(--primary)]',
                          isCompleted && 'text-[var(--success)]',
                          isPending && 'text-[var(--foreground-muted)]'
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Current Status Message */}
              <div className="mt-4 text-center">
                <p className="text-sm text-[var(--foreground-secondary)]">
                  {uploadProgress.message}
                </p>
                {uploadProgress.step === 4 && (
                  <p className="text-xs text-[var(--success)] mt-1">
                    ✓ CV đã được xử lý hoàn tất!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleUpload} loading={isLoading}>
                Phân tích CV
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-[var(--error)]">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Credits info */}
      {user && !isUnlimited && (
        <div className="mt-4 flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-[var(--foreground-secondary)]">
              Lượt còn lại: <strong>{creditsRemaining}/{maxCredits}</strong>
            </span>
          </div>
          {creditsRemaining <= 2 && (
            <span className="text-xs text-amber-500">
              {creditsRemaining === 0 ? 'Hết lượt!' : 'Sắp hết lượt'}
            </span>
          )}
        </div>
      )}

      {/* Out of credits modal */}
      <OutOfCreditsModal
        isOpen={showOutOfCreditsModal}
        onClose={() => setShowOutOfCreditsModal(false)}
        isFirstMonth={user?.isFirstMonth !== false}
      />
    </div>
  );
}
