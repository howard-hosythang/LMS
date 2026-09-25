import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface UploadItem {
  id: string;
  label: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  cancel?: () => void;
  retry?: () => void;
}

interface UploadContextType {
  uploads: UploadItem[];
  addUpload: (item: Omit<UploadItem, 'progress' | 'status'>) => void;
  updateUpload: (id: string, patch: Partial<UploadItem>) => void;
  removeUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

export const UploadProvider = ({ children }: { children: React.ReactNode }) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const addUpload = useCallback((item: Omit<UploadItem, 'progress' | 'status'>) => {
    setUploads(prev => [...prev, { ...item, progress: 0, status: 'uploading' }]);
  }, []);

  const updateUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  // Cảnh báo khi đóng tab trong lúc đang upload
  useEffect(() => {
    const isUploading = uploads.some(u => u.status === 'uploading');
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    if (isUploading) {
      window.addEventListener('beforeunload', handler);
    }
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploads]);

  return (
    <UploadContext.Provider value={{ uploads, addUpload, updateUpload, removeUpload }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used within UploadProvider');
  return ctx;
};
