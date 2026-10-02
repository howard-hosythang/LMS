import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Copy as CopyIcon,
  ExternalLink,
  FileText,
  History,
  PenTool,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'sonner';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

// Đảm bảo đường dẫn này đúng với project của bạn
import { Publication } from '@/api/publicationTypes';

export interface Transaction {
  transactionId: string;
  userId: string;
  fullName: string;
  studentId: string;
  fineAmount: number | null;
  borrowedDate: string | null;
  dueDate: string | null;
  returnedDate: string | null;
  status: string;
}

export interface TransactionsPage {
  content: Transaction[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface BookCopy {
  id: number;
  barcode: string;
  status: 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'IN_MAINTENANCE' | 'LOST' | string;
  condition: string;
  copyType?: string | null;
  bindingType?: string | null;
  conditionNote?: string | null;
  location: string;
  branch: string;
  acquiredDate?: string;
  acquisitionSource?: string | null;
  publication: Publication;
}

type CopyForm = {
  barcode?: string;
  branch: string; 
  condition: string;
  copyType: string;
  bindingType: string;
  conditionNote: string;
  acquiredDate: string;
  acquisitionSource: string;
  status: string;
  location: string; 
  internalNote: string;
};

const CopyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dialog = useAppDialog();

  const isCreate = id === 'new';
  const statePublicationId = location.state?.publicationId;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [copyData, setCopyData] = useState<BookCopy | null>(null);
  const [isEditing, setIsEditing] = useState(isCreate);

  const [transactionsData, setTransactionsData] = useState<TransactionsPage | null>(null);
  const [transactionPage, setTransactionPage] = useState(0);

  const [form, setForm] = useState<CopyForm>({
    barcode: '',
    branch: '',
    condition: 'NEW',
    copyType: 'ORIGINAL',
    bindingType: 'UNKNOWN',
    conditionNote: '',
    acquiredDate: '',
    acquisitionSource: '',
    status: 'AVAILABLE',
    location: '',
    internalNote: '',
  });

  // Shortcut
  const publication = copyData?.publication;

  // Generate barcode bars once (avoid Math.random each render)
  const barcodeBars = useMemo(() => {
    return Array.from({ length: 30 }).map(() => (Math.random() > 0.5 ? 2 : 4));
  }, [copyData?.barcode]); // đổi barcode thì regenerate

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || id === 'new') {
        setCopyData(null);
        setError(null);
        setLoading(false);
        setForm({
          barcode: '',
          branch: '',
          condition: 'NEW',
          copyType: 'ORIGINAL',
          bindingType: 'UNKNOWN',
          conditionNote: '',
          acquiredDate: '',
          acquisitionSource: '',
          status: 'AVAILABLE',
          location: '',
          internalNote: '',
        });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch actual item data from API
        const res: any = await axiosInstance.get(`/items/${id}`);
        const data = res?.data || res; // Extract the actual data payload

        if (data) {
          setCopyData(data);
          setForm({
            branch: data.branch || '',
            condition: data.condition || 'NEW',
            copyType: data.copyType || 'ORIGINAL',
            bindingType: data.bindingType || 'UNKNOWN',
            conditionNote: data.conditionNote || '',
            acquiredDate: data.acquiredDate || '',
            acquisitionSource: data.acquisitionSource || '',
            status: data.status || 'AVAILABLE',
            location: data.location || '',
            internalNote: '',
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Fetch item failed', err);
        setError('Không tải được thông tin bản sao.');
        setCopyData(null);
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id || id === 'new') return;
      try {
        const transRes: any = await axiosInstance.get(`/transactions/items/${id}`, {
          params: { page: transactionPage, size: 10 }
        });
        const data = transRes?.data || transRes;
        if (data && typeof data === 'object') {
          // ensure data matches the expected paging structure
          setTransactionsData(data.content ? data : { content: data, currentPage: 0, pageSize: 10, totalElements: data.length, totalPages: 1, first: true, last: true });
        }
      } catch (e) {
        console.error("Lỗi tải lịch sử mượn", e);
      }
    };
    fetchHistory();
  }, [id, transactionPage]);

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Có sẵn';
      case 'BORROWED':
        return 'Đang mượn';
      case 'LOST':
        return 'Mất';
      case 'RESERVED':
        return 'Đã đặt trước';
      case 'IN_MAINTENANCE':
        return 'Đang bảo trì';
      default:
        return status || 'N/A';
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'LOST':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'BORROWED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'RESERVED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN_MAINTENANCE':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const logDotClass = (color: string) => {
    // Tailwind MUST be static strings
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'blue':
        return 'bg-blue-500';
      case 'slate':
        return 'bg-slate-500';
      case 'red':
        return 'bg-red-500';
      case 'purple':
        return 'bg-purple-500';
      default:
        return 'bg-slate-400';
    }
  };

  const onChange = <K extends keyof CopyForm>(key: K, value: CopyForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!copyData && !isCreate) return;

    try {
      setSaving(true);
      setError(null);

      if (isCreate) {
        if (!statePublicationId) {
          setError('Không tìm thấy thông tin ấn phẩm (publicationId).');
          return;
        }
        const payload = {
          publicationId: statePublicationId,
          barcode: form.barcode,
          branch: form.branch,
          location: form.location,
          condition: form.condition,
          copyType: form.copyType,
          bindingType: form.bindingType,
          conditionNote: form.conditionNote || null,
          acquiredDate: form.acquiredDate || null,
          acquisitionSource: form.acquisitionSource || null,
        };
        const res: any = await axiosInstance.post(`/items`, payload);
        
        if (res && res.code === 200) {
          toast.success(res.message || 'Tạo bản sao thành công.');
          
          if (res.data && res.data.id) {
            navigate(`/librarianpage/copies/${res.data.id}`, { replace: true });
          } else {
            navigate('/librarianpage/copies');
          }
        } else {
          setError(getFriendlyErrorMessage(res));
        }
      } else {
        const payload = {
          condition: form.condition,
          status: form.status,
          location: form.location,
          branch: form.branch,
          copyType: form.copyType,
          bindingType: form.bindingType,
          conditionNote: form.conditionNote || null,
          acquiredDate: form.acquiredDate || null,
          acquisitionSource: form.acquisitionSource || null,
        };

        if (copyData) {
          await axiosInstance.put(`/items/${copyData.id}`, payload);
        }
        setIsEditing(false);

        // update local state (optimistic refresh)
        setCopyData((prev) =>
          prev
            ? ({
                ...prev,
                condition: payload.condition,
                status: payload.status,
                location: payload.location,
                branch: payload.branch,
                copyType: payload.copyType,
                bindingType: payload.bindingType,
                conditionNote: payload.conditionNote,
                acquiredDate: payload.acquiredDate || undefined,
                acquisitionSource: payload.acquisitionSource,
              } as BookCopy)
            : prev
        );
      }
    } catch (e) {
      console.error(e);
      setError(getFriendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!copyData) return;
    const ok = await dialog.confirm({
      title: 'Xóa bản sao',
      message: 'Bạn chắc chắn muốn xóa bản sao này? Hành động không thể hoàn tác.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      setDeleting(true);
      setError(null);

      await axiosInstance.delete(`/items/${copyData.id}`);
      toast.success('Đã xóa bản sao.');
      navigate('/librarianpage/copies');
    } catch (e) {
      console.error(e);
      setError(getFriendlyErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleClone = async () => {
    if (!copyData) return;

    try {
      // Tùy backend: bạn có thể có endpoint clone riêng.
      // Ở đây mình làm mẫu: POST /items (tạo item mới) từ item cũ
      const payload = {
        publicationId: publication?.id,
        // barcode bắt buộc unique -> backend tự sinh hoặc user nhập
        condition: form.condition,
        copyType: form.copyType,
        bindingType: form.bindingType,
        conditionNote: form.conditionNote || null,
        acquiredDate: form.acquiredDate || null,
        acquisitionSource: form.acquisitionSource || null,
        status: 'AVAILABLE',
        location: form.location,
        branch: form.branch,
      };

      const res = await axiosInstance.post(`/items`, payload);
      const newId = res?.data?.data?.id ?? res?.data?.id;

      if (newId) navigate(`/librarianpage/copies/${newId}`);
      else toast.warning('Nhân bản thành công nhưng không lấy được ID bản sao mới.');
    } catch (e) {
      console.error(e);
      setError(getFriendlyErrorMessage(e));
    }
  };

  const handleExportHistory = () => {
    const rows = transactionsData?.content || [];
    if (rows.length === 0) return;

    const headers = ['Ma giao dich', 'Nguoi muon', 'MSSV', 'Ngay muon', 'Han tra', 'Ngay tra', 'Trang thai'];
    const csv = [headers, ...rows.map((row) => [
      row.transactionId,
      row.fullName,
      row.studentId,
      row.borrowedDate || '',
      row.dueDate || '',
      row.returnedDate || '',
      row.status,
    ])]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lich-su-ban-sao-${copyData?.barcode || id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintBarcode = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 pb-20">
      {loading && <div className="text-center text-slate-500 py-10">Đang tải bản sao...</div>}

      {!loading && error && <div className="text-center text-red-600 py-10">{error}</div>}

      {!loading && !error && !copyData && !isCreate && (
        <div className="text-center text-slate-500 py-10">Bản sao không tồn tại.</div>
      )}

      {!loading && (copyData || isCreate) && (
        <>
          {/* Breadcrumb & Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/librarianpage/dashboard" className="hover:text-blue-600">
                Trang chủ
              </Link>
              <span>&gt;</span>
              <Link to="/librarianpage/copies" className="hover:text-blue-600">
                Bản sao
              </Link>
              <span>&gt;</span>
              <span className="text-slate-800 font-medium">{isCreate ? 'Trang thêm mới' : copyData?.barcode}</span>
            </div>

            <div className="flex justify-between items-end mt-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{isCreate ? 'Thêm mới bản sao' : 'Chi tiết bản sao'}</h1>
                {!isCreate && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusBadgeClass(
                      form.status
                    )}`}
                  >
                    {getStatusLabel(form.status)}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {!isCreate && (
                  <button
                    onClick={() => document.getElementById('copy-borrow-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm"
                  >
                    <History size={18} /> Xem lịch sử
                  </button>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || !isEditing}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-60"
                >
                  <Save size={18} /> {saving ? (isCreate ? 'Đang tạo...' : 'Đang lưu...') : (isCreate ? 'Tạo bản sao mới' : 'Lưu thay đổi')}
                </button>
              </div>
            </div>

            <p className="text-slate-500">Thông tin đầy đủ và các tùy chọn quản lý cho tài liệu thư viện này</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* 1. Copy Info Form */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <h2 className="font-bold text-lg text-slate-800">Thông tin bản sao</h2>
                  </div>
                  
                  {!isCreate && (
                    !isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded flex items-center gap-2"
                      >
                        <PenTool size={14} /> Chỉnh sửa
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-sm border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded flex items-center gap-2"
                      >
                        Hủy
                      </button>
                    )
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Barcode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={isCreate ? form.barcode : copyData?.barcode || ''}
                      onChange={(e) => isCreate && onChange('barcode', e.target.value)}
                      className={`w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono ${!isCreate ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                      readOnly={!isCreate}
                      placeholder={isCreate ? 'VD: 193819405' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Vị trí thư viện (Cơ sở) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.branch}
                      onChange={(e) => onChange('branch', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="">-- Chọn cơ sở --</option>
                      <option value="Cơ sở 1 - Lý Thường Kiệt">Cơ sở 1 - Lý Thường Kiệt</option>
                      <option value="Cơ sở 2 - Dĩ An">Cơ sở 2 - Dĩ An</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tình trạng</label>
                    <select
                      value={form.condition}
                      onChange={(e) => onChange('condition', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="NEW">Mới</option>
                      <option value="GOOD">Tốt</option>
                      <option value="OLD">Cũ</option>
                      <option value="WORN">Mòn / xuống cấp nhẹ</option>
                      <option value="DAMAGED">Hư hỏng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại bản sao</label>
                    <select
                      value={form.copyType}
                      onChange={(e) => onChange('copyType', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="ORIGINAL">Bản gốc</option>
                      <option value="PHOTOCOPY">Bản photo</option>
                      <option value="REPRINT">Bản tái bản/in lại</option>
                      <option value="DIGITAL_PRINT">Bản in kỹ thuật số</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kiểu bìa/đóng gáy</label>
                    <select
                      value={form.bindingType}
                      onChange={(e) => onChange('bindingType', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="UNKNOWN">Chưa rõ</option>
                      <option value="HARDCOVER">Bìa cứng</option>
                      <option value="PAPERBACK">Bìa mềm</option>
                      <option value="SPIRAL">Đóng lò xo</option>
                      <option value="STAPLED">Đóng ghim</option>
                      <option value="LOOSE_LEAF">Tờ rời</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => onChange('status', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="AVAILABLE">Có sẵn</option>
                      <option value="BORROWED">Đang mượn</option>
                      <option value="RESERVED">Đã đặt trước</option>
                      <option value="IN_MAINTENANCE">Đang bảo trì</option>
                      <option value="LOST">Mất</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí vật lý (Tòa / Phòng)</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => onChange('location', e.target.value)}
                      disabled={!isEditing}
                      placeholder="VD: H6 - 603"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhập kho</label>
                    <input
                      type="date"
                      value={form.acquiredDate}
                      onChange={(e) => onChange('acquiredDate', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn nhập</label>
                    <input
                      type="text"
                      value={form.acquisitionSource}
                      onChange={(e) => onChange('acquisitionSource', e.target.value)}
                      disabled={!isEditing}
                      placeholder="VD: Mua mới, tặng, chuyển kho"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú tình trạng bản sao</label>
                  <textarea
                    value={form.conditionNote}
                    onChange={(e) => onChange('conditionNote', e.target.value)}
                    disabled={!isEditing}
                    placeholder="VD: Mép bìa hơi cong, trang 12 có ghi chú bút chì..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* 2. Publication Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <ExternalLink size={20} />
                    </div>
                    <h2 className="font-bold text-lg text-slate-800">Ấn phẩm</h2>
                  </div>

                  <Link
                    to={`/librarianpage/books/${(publication as any)?.publication?.id || publication?.id || statePublicationId || ''}`}
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-2 hover:bg-blue-700"
                  >
                    <ExternalLink size={14} /> Xem ấn phẩm
                  </Link>
                </div>
                <div className="flex gap-6">
                  <div className="w-24 h-36 bg-slate-200 rounded-lg shrink-0 overflow-hidden shadow-sm">
                    {((publication as any)?.publication?.coverImageUrl || (publication as any)?.coverImageUrl) ? (
                      <img
                        src={(publication as any)?.publication?.coverImageUrl || (publication as any)?.coverImageUrl}
                        alt={(publication as any)?.publication?.title || (publication as any)?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-2 text-center">
                        <span className="text-white font-bold text-xs uppercase tracking-widest opacity-80">
                          {((publication as any)?.publication?.title || (publication as any)?.title || 'NO COVER').substring(0, 15)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">
                        {(publication as any)?.publication?.title || (publication as any)?.title}
                      </h3>

                      {((publication as any)?.publication?.subtitle || (publication as any)?.subtitle) && (
                        <p className="text-slate-500 text-sm italic">
                          {(publication as any)?.publication?.subtitle || (publication as any)?.subtitle}
                        </p>
                      )}

                      <div className="mt-1">
                        {Array.isArray((publication as any)?.authors) &&
                          (publication as any).authors.map((author: any, index: number) => (
                            <span key={author?.id ?? index} className="text-slate-600 font-medium">
                              {author?.name ?? author?.authorName ?? 'Unknown'}
                              {index < (publication as any).authors.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                      </div>

                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1 font-semibold">
                          <ExternalLink size={12} />{' '}
                          {(publication as any)?.publisher?.name ??
                            (publication as any)?.publisher?.publisherName ??
                            (publication as any)?.publisherName ??
                            'N/A'}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>{(publication as any)?.publication?.publicationYear ?? (publication as any)?.publicationYear ?? 'N/A'}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>{(publication as any)?.publication?.language ?? (publication as any)?.language ?? 'N/A'}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">ISBN</p>
                        <p className="text-sm font-semibold text-slate-800">{(publication as any)?.publication?.isbn ?? (publication as any)?.isbn ?? 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Mã xếp giá (DDC)</p>
                        <p className="text-sm font-semibold text-slate-800 font-mono">
                          {(publication as any)?.publication?.callNumber ?? (publication as any)?.callNumber ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Số trang</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {(publication as any)?.publication?.numberOfPages ?? (publication as any)?.numberOfPages ?? 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {Array.isArray((publication as any)?.tags) &&
                        (publication as any).tags.map((tag: any, idx: number) => (
                          <span
                            key={tag?.id ?? idx}
                            className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium"
                          >
                            {tag?.name ?? tag?.tagName ?? 'Tag'}
                          </span>
                        ))}

                      {Array.isArray((publication as any)?.categories) &&
                        (publication as any).categories.map((cat: any, idx: number) => (
                          <span
                            key={cat?.id ?? idx}
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100 font-medium"
                          >
                            {cat?.name ?? cat?.categoryName ?? 'Category'}
                          </span>
                        ))}
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed text-justify line-clamp-3">
                      {(publication as any)?.publication?.description ?? (publication as any)?.description ?? 'Chưa có mô tả cho ấn phẩm này.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Extras (Hidden on create) */}
              {!isCreate && (
                <>
                  {/* 3. Borrowing History */}
                  <div id="copy-borrow-history" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <History className="text-purple-600" size={20} />
                        <h2 className="font-bold text-lg text-slate-800">Lịch sử mượn</h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleExportHistory}
                          disabled={!transactionsData?.content?.length}
                          className="px-3 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Printer size={14} /> Tải xuống
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="px-4 py-3 font-semibold">T/A ID</th>
                            <th className="px-4 py-3 font-semibold">Người mượn</th>
                            <th className="px-4 py-3 font-semibold">Ngày mượn</th>
                            <th className="px-4 py-3 font-semibold">Hạn trả</th>
                            <th className="px-4 py-3 font-semibold">Ngày trả</th>
                            <th className="px-4 py-3 font-semibold">Trạng thái</th>
                            <th className="px-4 py-3 font-semibold">Phí</th>
                            <th className="px-4 py-3 font-semibold text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {transactionsData && transactionsData.content && transactionsData.content.length > 0 ? (
                            transactionsData.content.map((row) => {
                              const isOverdue = row.status === 'OVERDUE';
                              const statusClass = 
                                row.status === 'RETURNED' ? 'bg-green-100 text-green-700' :
                                row.status === 'BORROWING' ? 'bg-blue-100 text-blue-700' :
                                row.status === 'WAITING_FOR_PICKUP' ? 'bg-amber-100 text-amber-700' :
                                isOverdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700';

                              return (
                                <tr key={row.transactionId} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 font-mono text-slate-600 text-xs">{row.transactionId}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                        {(row.fullName || 'U').charAt(0)}
                                      </div>
                                      <div>
                                        <div className="font-medium text-slate-900">{row.fullName}</div>
                                        <div className="text-[10px] text-slate-500">{row.studentId}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {row.borrowedDate ? new Date(row.borrowedDate).toLocaleDateString('vi-VN') : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString('vi-VN') : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {row.returnedDate ? new Date(row.returnedDate).toLocaleDateString('vi-VN') : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusClass}`}>
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {row.fineAmount && row.fineAmount > 0 ? `${row.fineAmount.toLocaleString('vi-VN')}đ` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button className="text-blue-600 hover:text-blue-800">
                                      <ExternalLink size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                Chưa có lịch sử mượn
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {transactionsData && transactionsData.totalPages > 0 && (
                      <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                        <span className="text-xs text-slate-500">
                          Trang {transactionsData.currentPage + 1} / {transactionsData.totalPages} (Tổng {transactionsData.totalElements} lượt)
                        </span>
                        <div className="flex gap-1">
                          <button 
                            disabled={transactionsData.first}
                            onClick={() => setTransactionPage(p => Math.max(0, p - 1))}
                            className={`w-16 h-7 flex items-center justify-center border rounded text-xs ${transactionsData.first ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                          >
                            Trước
                          </button>
                          <button 
                            disabled={transactionsData.last}
                            onClick={() => setTransactionPage(p => p + 1)}
                            className={`w-16 h-7 flex items-center justify-center border rounded text-xs ${transactionsData.last ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                          >
                            Tiếp
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Analytics (MOCK) */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                      <TrendingUp className="text-blue-600" size={20} />
                      <h2 className="font-bold text-lg text-slate-800">Circulation Analytics</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-4">Số lượt mượn theo tháng (2024)</h4>
                        <div className="h-40 flex items-end justify-between gap-1">
                          {[2, 3, 4, 3, 5, 6, 4, 3, 5, 2, 1, 3].map((h, i) => (
                            <div
                              key={i}
                              className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors relative group"
                              style={{ height: `${h * 15}%` }}
                            >
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 opacity-0 group-hover:opacity-100">
                                {h}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-slate-500 uppercase font-medium">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                            <span key={m}>{m}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-4">Phân bố người mượn</h4>
                        <div className="flex items-center gap-6">
                          <div
                            className="w-32 h-32 rounded-full relative flex-shrink-0"
                            style={{
                              background:
                                'conic-gradient(#3b82f6 0% 31.9%, #10b981 31.9% 57.4%, #f59e0b 57.4% 74.4%, #ef4444 74.4% 89.3%, #6366f1 89.3% 100%)',
                            }}
                          >
                            <div className="absolute inset-0 m-8 bg-white rounded-full"></div>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Computer Science (31.9%)
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span> Engineering (25.5%)
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Business (17.0%)
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span> Medicine (14.9%)
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Other (10.6%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Maintenance & Log (MOCK) */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                      <AlertTriangle className="text-blue-600" size={20} />
                      <h2 className="font-bold text-lg text-slate-800">Tình trạng & bảo trì bản sao</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 relative">
                        <div className="absolute top-4 right-4 text-emerald-600">
                          <CheckCircle size={20} className="fill-emerald-200" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Tình trạng tổng quan</p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">Tốt</h3>
                        <p className="text-[10px] text-slate-500 mt-2">Lần kiểm tra gần nhất: 01/12/2024</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative">
                        <div className="absolute top-4 right-4 text-blue-600">
                          <PenTool size={20} className="fill-blue-200" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Hạn bảo trì</p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">Không</h3>
                        <p className="text-[10px] text-slate-500 mt-2">Lần kiểm tra tiếp theo: 01/03/2025</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 relative">
                        <div className="absolute top-4 right-4 text-purple-600">
                          <span className="font-bold text-lg">$</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Giá trị ước tính</p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">405,000 VND</h3>
                        <p className="text-[10px] text-slate-500 mt-2">90% của tổng giá gốc</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg text-slate-800">Nhật ký hoạt động</h4>
                        <button
                          onClick={() => document.getElementById('copy-borrow-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Xem lịch sử
                        </button>
                      </div>

                      <div className="space-y-3">
                        {[
                          {
                            title: 'Bản sao được mượn bởi Phạm Minh Tuấn',
                            sub: 'Loan ID: LN-2024-0892 - Returned on time, no fines',
                            date: 'Dec 5, 2024 14:23',
                            color: 'green',
                          },
                          {
                            title: 'Việc kiểm tra tình trạng đã hoàn tất',
                            sub: 'Kiểm tra định kỳ bởi Nguyễn Văn A - Tình trạng: Xuất sắc',
                            date: 'Dec 1, 2024 09:15',
                            color: 'blue',
                          },
                          {
                            title: 'Sản phẩm đã được kiểm tra cho Phạm Minh Tuấn',
                            sub: 'Loan ID: LN-2024-0892 - Due date: Dec 15, 2024',
                            date: 'Nov 15, 2024 10:45',
                            color: 'slate',
                          },
                        ].map((log, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${logDotClass(log.color)}`} />
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{log.title}</p>
                              <p className="text-xs text-slate-500">{log.sub}</p>
                            </div>
                            <span className="text-xs text-slate-400 tabular-nums shrink-0">{log.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 6. Danger Zone */}
              {!isCreate && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                  <div className="flex items-center gap-2 mb-2 text-red-700">
                    <AlertTriangle size={20} />
                    <h3 className="font-bold">Vùng nguy hiểm</h3>
                  </div>
                  <p className="text-sm text-red-600 mb-4">
                    Những hành động không thể hoàn tác, đòi hỏi sự cân nhắc kỹ lưỡng.
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-red-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Xóa bản sao</h4>
                      <p className="text-xs text-slate-500">
                        Xóa vĩnh viễn bản sao này khỏi hệ thống. Hành động này không thể hoàn tác.
                      </p>
                    </div>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"
                    >
                      <Trash2 size={16} /> {deleting ? 'Đang xóa...' : 'Xóa bản sao'}
                    </button>
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Quay lại trang danh sách bản sao
                </button>

                <div className="flex gap-2">
                  {!isCreate && (
                    <button
                      onClick={handleClone}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                    >
                      <CopyIcon size={16} /> Nhân bản bản sao
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/librarianpage/copies')}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
                  >
                    <Save size={16} /> {saving ? (isCreate ? 'Đang tạo...' : 'Đang lưu...') : (isCreate ? 'Tạo bản sao mới' : 'Lưu thay đổi')}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4">Thống kê nhanh</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <RotateCcw size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Tổng số lượt mượn</p>
                      <p className="text-xl font-bold text-slate-900">{transactionsData?.totalElements || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Trạng thái hiện tại</p>
                      <p className="text-xl font-bold text-slate-900">{getStatusLabel(form.status)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Ngày trả gần nhất</p>
                      <p className="text-lg font-bold text-slate-900">-</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode Preview */}
              <div className="bg-blue-600 rounded-xl shadow-lg p-6 text-center text-white">
                <h3 className="font-bold mb-4">Item Barcode</h3>

                <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                  <div className="h-12 w-48 flex items-end justify-center gap-[2px]">
                    {barcodeBars.map((w, i) => (
                      <div key={i} className="bg-black" style={{ width: `${w}px`, height: '100%' }} />
                    ))}
                  </div>
                  <p className="text-black font-mono text-sm mt-1 font-bold">{isCreate ? form.barcode || 'NO BARCODE' : copyData?.barcode}</p>
                </div>

                <button
                  onClick={handlePrintBarcode}
                  className="w-full bg-white text-blue-600 font-bold py-2.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Printer size={18} /> In nhãn barcode
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CopyDetails;
