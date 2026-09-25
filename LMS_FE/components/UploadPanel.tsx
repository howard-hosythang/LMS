import { CheckCircle, RefreshCw, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUpload } from '../contexts/UploadContext';

const UploadPanel = () => {
  const { uploads, removeUpload, updateUpload } = useUpload();

  // Tự đóng sau 3 giây khi tất cả done
  useEffect(() => {
    const allDone = uploads.length > 0 && uploads.every(u => u.status === 'done');
    if (!allDone) return;
    const timer = setTimeout(() => {
      uploads.forEach(u => removeUpload(u.id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [uploads, removeUpload]);

  if (uploads.length === 0) return null;

  const uploadingCount = uploads.filter(u => u.status === 'uploading').length;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <span className="text-white text-sm font-semibold">Đang tải lên</span>
        <span className="text-slate-400 text-xs">
          {uploadingCount > 0 ? `${uploadingCount} đang xử lý` : 'Hoàn thành'}
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
        {uploads.map(item => (
          <div key={item.id} className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{item.label}</p>
              <p className="text-xs text-slate-400 truncate">{item.fileName}</p>
              {item.status === 'uploading' && (
                <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === 'error' && (
                <p className="text-xs text-red-500 mt-0.5">Tải lên thất bại</p>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center gap-1">
              {item.status === 'uploading' && (
                <>
                  <span className="text-xs text-slate-500 w-8 text-right">{item.progress}%</span>
                  {item.cancel && (
                    <button
                      onClick={item.cancel}
                      title="Hủy upload"
                      className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </>
              )}
              {item.status === 'done' && (
                <CheckCircle size={18} className="text-green-500" />
              )}
              {item.status === 'error' && (
                <>
                  <XCircle size={16} className="text-red-500" />
                  {item.retry && (
                    <button
                      onClick={() => {
                        updateUpload(item.id, { status: 'uploading', progress: 0 });
                        item.retry!();
                      }}
                      title="Thử lại"
                      className="p-0.5 text-slate-500 hover:text-slate-700"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => removeUpload(item.id)}
                    className="p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default UploadPanel;
