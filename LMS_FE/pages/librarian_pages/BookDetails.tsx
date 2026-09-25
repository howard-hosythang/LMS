import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Star,
  Trash2,
  Upload,
  X,
  XCircle
} from 'lucide-react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import publicationsService from '../../api/publicationsService';
import { Author, BookSearchItem, Category, Publisher, Tag, TocEntry } from '../../api/publicationTypes';
import AsyncCreatableSelectField from '../../components/AsyncCreatableSelectField';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useUpload } from '../../contexts/UploadContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

type FormState = {
  id: string;
  title: string;
  authors: { id: string | null; name: string }[];
  isbn: string;
  callNumber: string;
  publisher: { id: string | null; name: string };
  publicationYear: string;
  language: string;
  edition: string;
  publicationFormat: string;
  editionNote: string;
  size: string;
  weight: string;
  pages: string;
  subtitle: string;
  description: string;
  aiSummary: string;
  aiTargetAudience: string;
  fileUrl: string;
  categories: { id: string | null; name: string }[];
  tags: { id: string | null; name: string }[];
  coverImageUrl: string | null;
  tableOfContents: TocEntry[] | null;
  totalItems: number;
  availableItems: number;
  borrowedItems: number;
  averageRating: number;
  totalRatings: number;
  aiProcessingStatus: 'NOT_UPLOADED' | 'NOT_STARTED' | 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  aiProcessingError: string | null;
  aiChunksCount: number | null;
  aiVectorsCount: number | null;
  aiProcessedAt: string | null;
};

const AI_STATUS_CONFIG = {
  NOT_UPLOADED: {
    label: 'Chưa upload file',
    description: 'Ấn phẩm chưa có file nội dung để AI xử lý.',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Clock,
  },
  NOT_STARTED: {
    label: 'Chưa chạy AI',
    description: 'File đã được lưu nhưng chưa có lượt xử lý AI nào.',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  QUEUED: {
    label: 'Đang chờ xử lý',
    description: 'Yêu cầu đã được gửi sang AI Service và đang chờ xử lý.',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
  },
  RUNNING: {
    label: 'AI đang chạy',
    description: 'AI đang trích xuất, làm sạch, tóm tắt và vector hóa nội dung.',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Loader2,
  },
  SUCCESS: {
    label: 'AI đã xử lý xong',
    description: 'Ấn phẩm đã có summary/tag/vector phục vụ tìm kiếm và gợi ý.',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  FAILED: {
    label: 'AI xử lý lỗi',
    description: 'AI chưa hoàn tất. Kiểm tra lỗi hoặc upload lại file để chạy lại.',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
} as const;

const FACULTY_TARGET_OPTIONS = [
  { value: 'TOAN_BO_SINH_VIEN_BKU', label: 'Toàn bộ sinh viên BKU' },
  { value: 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', label: 'Khoa Khoa học và Kỹ thuật Máy tính' },
  { value: 'KHOA_DIEN_DIEN_TU', label: 'Khoa Điện - Điện tử' },
  { value: 'KHOA_CO_KHI', label: 'Khoa Cơ khí' },
  { value: 'KHOA_KY_THUAT_HOA_HOC', label: 'Khoa Kỹ thuật Hóa học' },
  { value: 'KHOA_KY_THUAT_XAY_DUNG', label: 'Khoa Kỹ thuật Xây dựng' },
  { value: 'KHOA_KY_THUAT_GIAO_THONG', label: 'Khoa Kỹ thuật Giao thông' },
  { value: 'KHOA_QUAN_LY_CONG_NGHIEP', label: 'Khoa Quản lý Công nghiệp' },
  { value: 'KHOA_MOI_TRUONG_VA_TAI_NGUYEN', label: 'Khoa Môi trường và Tài nguyên' },
  { value: 'KHOA_CONG_NGHE_VAT_LIEU', label: 'Khoa Công nghệ Vật liệu' },
  { value: 'KHOA_KHOA_HOC_UNG_DUNG', label: 'Khoa Khoa học Ứng dụng' },
  { value: 'KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI', label: 'Khoa Kỹ thuật Địa chất và Dầu khí' },
];

const emptyForm: FormState = {
  id: '',
  title: '',
  authors: [{ id: null, name: '' }],
  isbn: '',
  callNumber: '',
  publisher: { id: null, name: '' },
  publicationYear: '',
  language: '',
  edition: '',
  publicationFormat: 'PRINT_BOOK',
  editionNote: '',
  size: '',
  weight: '',
  pages: '',
  subtitle: '',
  description: '',
  aiSummary: '',
  aiTargetAudience: '',
  fileUrl: '',
  categories: [],
  tags: [],
  coverImageUrl: null,
  tableOfContents: null,
  totalItems: 0,
  availableItems: 0,
  borrowedItems: 0,
  averageRating: 0,
  totalRatings: 0,
  aiProcessingStatus: 'NOT_UPLOADED',
  aiProcessingError: null,
  aiChunksCount: null,
  aiVectorsCount: null,
  aiProcessedAt: null,
};

const parseTableOfContents = (raw: string | TocEntry[] | null | undefined): TocEntry[] | null => {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const normalizeIsbn = (value: string) => value.replace(/[\s-]/g, '').toUpperCase();

const isValidIsbn = (value: string) => {
  const isbn = normalizeIsbn(value);
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = isbn
      .slice(0, 9)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
    const checkDigit = isbn[9] === 'X' ? 10 : Number(isbn[9]);
    return (sum + checkDigit) % 11 === 0;
  }

  if (/^\d{13}$/.test(isbn)) {
    const sum = isbn
      .slice(0, 12)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
    return (10 - (sum % 10)) % 10 === Number(isbn[12]);
  }

  return false;
};

const validateOptionalIsbn = (value: string) => {
  const isbn = value.trim();
  if (!isbn) return true;
  return isValidIsbn(isbn);
};

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dialog = useAppDialog();
  const isCreate = !id || id === 'new';
  const [loading, setLoading] = useState(!isCreate);
  const [form, setForm] = useState<FormState>(emptyForm);
  const { addUpload, updateUpload, removeUpload } = useUpload();

  // New Data States
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(isCreate);
  const [isLookingUpDDC, setIsLookingUpDDC] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [runningAiAction, setRunningAiAction] = useState<'vectorize' | 'metadata' | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // New Upload States
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [docUploadProgress, setDocUploadProgress] = useState(0);
  const [metadataSnapshot, setMetadataSnapshot] = useState<Partial<FormState> | null>(null);

  // Smart book lookup
  const [lookupQuery, setLookupQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isResolvingEntities, setIsResolvingEntities] = useState(false);
  const [lookupResults, setLookupResults] = useState<BookSearchItem[] | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lookupApplied, setLookupApplied] = useState<BookSearchItem | null>(null);

  type PendingEntity = { type: 'author' | 'publisher' | 'category'; name: string; checked: boolean };
  const [pendingEntities, setPendingEntities] = useState<PendingEntity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableCovers, setAvailableCovers] = useState<string[]>([]);

  const handleSmartLookup = async () => {
    const q = lookupQuery.trim();
    if (!q) return;
    setIsLookingUp(true);
    setLookupResults(null);
    setLookupApplied(null);
    try {
      const res = await publicationsService.bookLookup(q);
      if (res.code === 200 && res.data) {
        const { queryType, results } = res.data;
        if (results.length === 0) {
          toast.info('Không tìm thấy sách nào. Thử từ khóa khác.');
          return;
        }
        setLookupResults(results);
        if (queryType === 'ISBN') {
          await applyLookupResult(results[0]);
        } else {
          setShowResultsModal(true);
        }
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setIsLookingUp(false);
    }
  };

  const resolveAuthors = async (names: string[]) => {
    const found: { id: string; name: string }[] = [];
    const notFound: string[] = [];
    await Promise.all(names.map(async (name) => {
      try {
        const res = await publicationsService.searchAuthors(name);
        const match = (res.data || []).find((a: any) => a.name.toLowerCase() === name.toLowerCase());
        if (match) found.push({ id: String(match.id), name: match.name });
        else notFound.push(name);
      } catch { notFound.push(name); }
    }));
    return { found, notFound };
  };

  const resolvePublisher = async (name: string | null) => {
    if (!name) return { found: null, notFound: null };
    try {
      const res = await publicationsService.searchPublishers(name);
      const match = (res.data || []).find((p: any) => p.name.toLowerCase() === name.toLowerCase());
      if (match) return { found: { id: String(match.id), name: match.name }, notFound: null };
      return { found: null, notFound: name };
    } catch { return { found: null, notFound: name }; }
  };

  const resolveCategories = async (names: string[]) => {
    const found: { id: string; name: string }[] = [];
    const notFound: string[] = [];
    await Promise.all(names.map(async (name) => {
      try {
        const res = await publicationsService.searchCategories(name);
        const match = (res.data || []).find((c: any) =>
          (c.name || c.categoryName || '').toLowerCase() === name.toLowerCase()
        );
        if (match) found.push({ id: String(match.id), name: match.name || match.categoryName || name });
        else notFound.push(name);
      } catch { notFound.push(name); }
    }));
    return { found, notFound };
  };

  const handleCreatePendingEntities = async () => {
    setShowCreateModal(false);
    const toCreate = pendingEntities.filter(e => e.checked);
    if (!toCreate.length) { setPendingEntities([]); return; }

    setIsResolvingEntities(true);
    const newAuthors: { id: string; name: string }[] = [];
    let newPublisher: { id: string; name: string } | null = null;
    const newCategories: { id: string; name: string }[] = [];
    const failed: string[] = [];

    try {
      await Promise.all(toCreate.map(async (entity) => {
        try {
          if (entity.type === 'author') {
            const res = await publicationsService.createAuthor(entity.name);
            newAuthors.push({ id: res.data.id, name: res.data.name });
          } else if (entity.type === 'publisher') {
            const res = await publicationsService.createPublisher(entity.name);
            newPublisher = { id: res.data.id, name: res.data.name };
          } else {
            const res = await publicationsService.createCategory(entity.name);
            newCategories.push({ id: res.data.id, name: res.data.name });
          }
        } catch {
          failed.push(entity.name);
        }
      }));

      setForm(prev => ({
        ...prev,
        authors: newAuthors.length > 0 ? [...prev.authors.filter(a => a.id), ...newAuthors] : prev.authors,
        publisher: newPublisher ?? prev.publisher,
        categories: newCategories.length > 0 ? [...prev.categories.filter(c => c.id), ...newCategories] : prev.categories,
        tags: [],
      }));

      const created = toCreate.length - failed.length;
      if (created > 0) {
        const names = [...newAuthors, ...(newPublisher ? [newPublisher] : []), ...newCategories]
          .map(e => e.name).join(', ');
        toast.success(`Đã tạo và điền vào form: ${names}`);
      }
      if (failed.length > 0) {
        toast.error(`Tạo thất bại: ${failed.join(', ')}`);
      }
    } finally {
      setIsResolvingEntities(false);
      setPendingEntities([]);
    }
  };

  const applyLookupResult = async (item: BookSearchItem) => {
    setForm(prev => ({
      ...prev,
      isbn: item.isbn ?? prev.isbn,
      title: item.title ?? prev.title,
      subtitle: item.subtitle ?? prev.subtitle,
      description: item.description ?? prev.description,
      language: item.language ?? prev.language,
      pages: item.numberOfPages?.toString() ?? prev.pages,
      publicationYear: item.publicationYear?.toString() ?? prev.publicationYear,
      callNumber: item.callNumber ?? prev.callNumber,
      coverImageUrl: item.coverImageUrl ?? prev.coverImageUrl,
      tableOfContents: item.tableOfContents ?? prev.tableOfContents,
    }));
    setLookupApplied(item);
    setShowResultsModal(false);
    const covers = [item.coverImageUrl, item.alternativeCoverUrl].filter(Boolean) as string[];
    setAvailableCovers(covers);

    setIsResolvingEntities(true);
    try {
      const [authorsResult, publisherResult, categoriesResult] = await Promise.all([
        resolveAuthors(item.authorNames ?? []),
        resolvePublisher(item.publisherName ?? null),
        resolveCategories(item.categoryNames ?? []),
      ]);

      setForm(prev => ({
        ...prev,
        authors: authorsResult.found.length > 0 ? authorsResult.found : [{ id: null, name: '' }],
        publisher: publisherResult.found ?? { id: null, name: '' },
        categories: categoriesResult.found.length > 0 ? categoriesResult.found : [],
        tags: [],
      }));

      const pending: PendingEntity[] = [
        ...authorsResult.notFound.map(name => ({ type: 'author' as const, name, checked: true })),
        ...(publisherResult.notFound ? [{ type: 'publisher' as const, name: publisherResult.notFound, checked: true }] : []),
        ...categoriesResult.notFound.map(name => ({ type: 'category' as const, name, checked: true })),
      ];
      if (pending.length > 0) {
        setPendingEntities(pending);
        setShowCreateModal(true);
      }
    } finally {
      setIsResolvingEntities(false);
    }
  };

  const runCoverUpload = (pubId: string, file: File, title: string) => {
    const uploadId = `cover-${pubId}-${Date.now()}`;
    let controller = new AbortController();
    const cancel = () => { controller.abort(); removeUpload(uploadId); };
    addUpload({ id: uploadId, label: `Cover - ${title}`, fileName: file.name, cancel });
    const doUpload = () => {
      controller = new AbortController();
      return publicationsService.uploadCover(pubId, file, (p) => {
        updateUpload(uploadId, { progress: p });
        setCoverUploadProgress(p);
      }, controller.signal)
        .then(res => {
          updateUpload(uploadId, { status: 'done', progress: 100, cancel: undefined });
          setForm(prev => ({ ...prev, coverImageUrl: res.data }));
          return true;
        })
        .catch(err => {
          if (axios.isCancel(err) || err?.code === 'ERR_CANCELED') return false;
          updateUpload(uploadId, { status: 'error', cancel: undefined, retry: doUpload });
          return false;
        });
    };
    return doUpload();
  };

  const runDocumentUpload = (pubId: string, file: File, title: string) => {
    const uploadId = `doc-${pubId}-${Date.now()}`;
    let controller = new AbortController();
    const cancel = () => { controller.abort(); removeUpload(uploadId); };
    addUpload({ id: uploadId, label: `Tài liệu - ${title}`, fileName: file.name, cancel });
    const doUpload = () => {
      controller = new AbortController();
      return publicationsService.uploadDocument(pubId, file, (p) => {
        updateUpload(uploadId, { progress: p });
        setDocUploadProgress(p);
      }, controller.signal)
        .then(res => {
          updateUpload(uploadId, { status: 'done', progress: 100, cancel: undefined });
          setForm(prev => ({
            ...prev,
            fileUrl: res.data,
            aiProcessingStatus: 'QUEUED',
            aiProcessingError: null,
            aiChunksCount: null,
            aiVectorsCount: null,
            aiProcessedAt: null,
          }));
          setUploadedFileName(file.name);
          return true;
        })
        .catch(err => {
          if (axios.isCancel(err) || err?.code === 'ERR_CANCELED') return false;
          updateUpload(uploadId, { status: 'error', cancel: undefined, retry: doUpload });
          return false;
        });
    };
    return doUpload();
  };

  // Fetch publication by id
  useEffect(() => {
    const fetchData = async () => {
      if (isCreate) return;
      try {
        setLoading(true);
        const res = await publicationsService.getPublicationById(id);
        if (res.code === 200 && res.data) {
          const detail = res.data;
          const pub = detail.publication;
          setForm({
            id: id,
            title: pub.title ?? '',
            subtitle: pub.subtitle ?? '',
            authors: detail.authors?.length
              ? detail.authors.map((a: any) => ({ id: a.id, name: a.name }))
              : [{ id: null, name: '' }],
            isbn: pub.isbn ?? '',
            callNumber: pub.callNumber ?? '',
            publisher: detail.publisher
              ? { id: detail.publisher.id, name: detail.publisher.name }
              : { id: null, name: '' },
            publicationYear: pub.publicationYear?.toString() ?? '',
            language: pub.language ?? '',
            edition: pub.edition?.toString() ?? '',
            publicationFormat: pub.publicationFormat ?? 'PRINT_BOOK',
            editionNote: pub.editionNote ?? '',
            size: pub.size ?? '',
            weight: pub.weight?.toString() ?? '',
            pages: pub.numberOfPages?.toString() ?? '',
            description: pub.description ?? '',
            aiSummary: pub.aiSummary ?? '',
            aiTargetAudience: pub.aiTargetAudience ?? '',
            fileUrl: pub.fileUrl ?? '',
            categories: detail.categories?.length
              ? detail.categories.map((c: any) => ({ id: c.id, name: c.name }))
              : [{ id: null, name: '' }],
            tags: detail.tags?.length
              ? detail.tags.map((t: any) => ({ id: t.id, name: t.name }))
              : [{ id: null, name: '' }],
            coverImageUrl: pub.coverImageUrl ?? null,
            tableOfContents: parseTableOfContents(pub.tableOfContents),
            totalItems: detail.items?.totalItems ?? 0,
            availableItems: detail.items?.totalAvailableItems ?? 0,
            borrowedItems: detail.items?.totalBorrowedItems ?? 0,
            averageRating: detail.ratings?.averageRating ?? 0,
            totalRatings: detail.ratings?.totalRatings ?? 0,
            aiProcessingStatus: pub.aiProcessingStatus ?? (pub.fileUrl ? 'NOT_STARTED' : 'NOT_UPLOADED'),
            aiProcessingError: pub.aiProcessingError ?? null,
            aiChunksCount: pub.aiChunksCount ?? null,
            aiVectorsCount: pub.aiVectorsCount ?? null,
            aiProcessedAt: pub.aiProcessedAt ?? null,
          });
        }
      } catch (error) {
        console.error('Error fetching publication', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isCreate]);

  useEffect(() => {
    if (isCreate || !id || !['QUEUED', 'RUNNING'].includes(form.aiProcessingStatus)) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const res = await publicationsService.getPublicationById(id);
        if (res.code === 200 && res.data) {
          const pub = res.data.publication;
          setForm(prev => ({
            ...prev,
            aiSummary: pub.aiSummary ?? prev.aiSummary,
            aiTargetAudience: pub.aiTargetAudience ?? prev.aiTargetAudience,
            aiProcessingStatus: pub.aiProcessingStatus ?? prev.aiProcessingStatus,
            aiProcessingError: pub.aiProcessingError ?? null,
            aiChunksCount: pub.aiChunksCount ?? null,
            aiVectorsCount: pub.aiVectorsCount ?? null,
            aiProcessedAt: pub.aiProcessedAt ?? null,
            tags: res.data.tags?.length
              ? res.data.tags.map((t: any) => ({ id: t.id, name: t.name }))
              : prev.tags,
          }));
        }
      } catch (error) {
        console.error('Error polling AI processing status', error);
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [form.aiProcessingStatus, id, isCreate]);

  const authorsList = useMemo(
    () => (form.authors.length ? form.authors : [{ id: null, name: '' }]),
    [form.authors]
  );

  const processDocumentFile = (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File không được vượt quá 100MB');
      return;
    }

    if (isCreate) {
      setSelectedDocumentFile(file);
      return;
    }

    setUploadingFile(true);
    runDocumentUpload(id!, file, form.title || 'Ấn phẩm')
      .finally(() => setUploadingFile(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processDocumentFile(file);
  };

  const handleRunAiAction = async (action: 'vectorize' | 'metadata') => {
    if (!id || isCreate) return;
    if (action === 'metadata' && !(form.aiVectorsCount && form.aiVectorsCount > 0)) {
      toast.warning('Ấn phẩm chưa có vector. Hãy chạy reset vector hóa trước, sau khi xong mới sinh metadata.');
      return;
    }

    const confirmed = await dialog.confirm({
      title: action === 'vectorize' ? 'Reset vector hóa sách?' : 'Sinh metadata bằng AI?',
      message: action === 'vectorize'
        ? 'Hệ thống sẽ đọc lại file nội dung, xóa vector cũ và sinh vector mới. Tác vụ này có thể tốn CPU và mất vài phút với file lớn.\n\nSau khi vector hóa hoàn tất, bạn mới nên chạy bước sinh tag / summary / audience.'
        : 'Hệ thống sẽ dùng các vector hiện có để gọi LLM sinh tag, summary và audience. Tác vụ này có thể tốn quota/credit Gemini.\n\nChỉ chạy khi vector đã được sinh thành công.',
      confirmText: action === 'vectorize' ? 'Reset vector' : 'Sinh metadata',
      variant: action === 'vectorize' ? 'warning' : 'confirm',
    });
    if (!confirmed) return;

    setRunningAiAction(action);
    try {
      if (action === 'vectorize') {
        await publicationsService.rerunPublicationVectorization(id);
      } else {
        await publicationsService.generatePublicationAiMetadata(id);
      }
      setForm((prev) => ({
        ...prev,
        aiProcessingStatus: 'QUEUED',
        aiProcessingError: null,
        ...(action === 'vectorize' ? { aiChunksCount: null, aiVectorsCount: null } : {}),
        aiProcessedAt: null,
      }));
      toast.success(action === 'vectorize'
        ? 'Đã đưa ấn phẩm vào hàng đợi vector hóa.'
        : 'Đã đưa ấn phẩm vào hàng đợi sinh tag, summary và audience.');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể gửi yêu cầu AI. Hãy kiểm tra ấn phẩm đã có file nội dung chưa.');
    } finally {
      setRunningAiAction(null);
    }
  };

  const previewAuthors = useMemo(
    () => {
      const names = form.authors
        .map((a) => a.name?.trim())
        .filter((a) => a)
        .join(', ');
      return names || 'Chưa có tác giả';
    },
    [form.authors]
  );

  const loadAuthorOptions = async (input: string) => {
    const res = await publicationsService.searchAuthors(input);
    return (res.data || []).map((a: any) => ({
      value: a.id,
      label: a.name,
    }));
  };

  const createAuthorOption = async (name: string) => {
    const res = await publicationsService.createAuthor(name);
    return { value: res.data.id, label: res.data.name };
  };


  const loadCategoryOptions = async (input: string) => {
    const res = await publicationsService.searchCategories(input);
    return res.data.map((c: any) => ({
      value: c.id,
      label: c.name,
    }));
  };

  const createCategoryOption = async (name: string) => {
    const res = await publicationsService.createCategory(name);
    return { value: res.data.id, label: res.data.name };
  };

  const loadTagOptions = async (input: string) => {
    const res = await publicationsService.searchTags(input);
    return res.data.map((t: any) => ({
      value: t.id,
      label: t.name,
    }));
  };

  const createTagOption = async (name: string) => {
    const res = await publicationsService.createTag(name);
    return {
      value: res.data.id,
      label: res.data.name,
    };
  };

  const handleLookupDDC = async () => {
    const isbn = form.isbn?.trim();
    if (!isbn) { toast.error('Vui lòng nhập ISBN trước khi tra cứu.'); return; }
    setIsLookingUpDDC(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
      );
      const json = await res.json();
      const key = `ISBN:${isbn}`;
      const book = json[key];
      if (!book) { toast.info('Không tìm thấy thông tin DDC cho ISBN này.'); return; }
      const ddcList: string[] = book.dewey_decimal_class ?? [];
      if (ddcList.length === 0) { toast.info('Không có số phân loại DDC cho ISBN này.'); return; }
      setForm(prev => ({ ...prev, callNumber: ddcList[0] }));
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setIsLookingUpDDC(false);
    }
  };

  const loadPublisherOptions = async (input: string) => {
    const res = await publicationsService.searchPublishers(input);
    return res.data.map((p: any) => ({
      value: p.id,
      label: p.name,
    }));
  };

  const createPublisherOption = async (name: string) => {
    const res = await publicationsService.createPublisher(name);
    return { value: res.data.id, label: res.data.name };
  };

  const updateAuthor = (idx: string, name: string, matchedId?: string | null) => {
    setForm((prev) => {
      const next = [...authorsList];
      next[idx] = { id: matchedId ?? next[idx]?.id ?? null, name: name };
      return { ...prev, authors: next };
    });
  };

  const addAuthor = () => {
    // Check if last author is selected and duplicate
    const lastAuthor = authorsList[authorsList.length - 1];
    if (lastAuthor && lastAuthor.id) {
      // Check if this author id already exists in the list (except at the last position)
      const isDuplicate = authorsList.slice(0, -1).some(a => a.id === lastAuthor.id);
      if (isDuplicate) {
        toast.error('Tác giả này đã có trong danh sách. Vui lòng chọn tác giả khác.');
        return;
      }
    }
    setForm((prev) => ({ ...prev, authors: [...authorsList, { id: null, name: '' }] }));
  };

  const removeAuthor = (idx: number) =>
    setForm((prev) => {
      const next = authorsList.filter((_, i) => i !== idx);
      return { ...prev, authors: next.length ? next : [{ id: null, name: '' }] };
    });

  const processCoverFile = (file: File) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }

    if (isCreate) {
      setSelectedCoverFile(file);
      // Giả lập preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, coverImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
      return;
    }

    setIsUploadingCover(true);
    runCoverUpload(id!, file, form.title || 'Ấn phẩm')
      .finally(() => setIsUploadingCover(false));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCoverFile(file);
  };

  const handleUpdate = async () => {
    if (!id || id === 'new') return;

    if (!form.title.trim()) {
      toast.error('Tiêu đề không được để trống.');
      return;
    }
    if (!validateOptionalIsbn(form.isbn)) {
      toast.error('ISBN không hợp lệ. Vui lòng nhập ISBN-10 hoặc ISBN-13 đúng chuẩn.');
      return;
    }

    const payload = {
      // metadata
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || null,
      isbn: form.isbn.trim() ? normalizeIsbn(form.isbn) : null,
      callNumber: form.callNumber?.trim() || null,
      description: form.description || null,
      language: form.language || null,
      numberOfPages: form.pages ? Number(form.pages) : null,
      publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
      edition: form.edition ? Number(form.edition) : null,
      publicationFormat: form.publicationFormat || 'PRINT_BOOK',
      editionNote: form.editionNote?.trim() || null,
      size: form.size || null,
      weight: form.weight ? Number(form.weight) : null,
      aiTargetAudience: form.aiTargetAudience || null,
      coverImageUrl: form.coverImageUrl || null,
      // relations
      publisherId: form.publisher.id ?? null,
      authorIds: form.authors.filter(a => a.id).map(a => a.id),
      categoryIds: form.categories.filter(c => c.id).map(c => c.id),
      tagIds: form.tags.filter(t => t.id).map(t => t.id),
    };

    try {
      setSaving(true);
      const res = await publicationsService.updatePublication(id, payload as any);
      if (res.code === 200) {
        toast.success('Cập nhật ấn phẩm thành công!');
        window.location.reload();

      } else {
        toast.error(getFriendlyErrorMessage(res));
      }
    } catch (error) {
      console.error('Lỗi update', error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };


  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Tiêu đề không được để trống.');
      return;
    }
    if (!validateOptionalIsbn(form.isbn)) {
      toast.error('ISBN không hợp lệ. Vui lòng nhập ISBN-10 hoặc ISBN-13 đúng chuẩn.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || null,
      isbn: form.isbn.trim() ? normalizeIsbn(form.isbn) : null,
      callNumber: form.callNumber?.trim() || null,
      description: form.description || null,
      language: form.language || null,
      numberOfPages: form.pages ? Number(form.pages) : null,
      publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
      edition: form.edition ? Number(form.edition) : null,
      publicationFormat: form.publicationFormat || 'PRINT_BOOK',
      editionNote: form.editionNote?.trim() || null,
      size: form.size || null,
      weight: form.weight ? Number(form.weight) : null,
      aiTargetAudience: form.aiTargetAudience || null,
      // nếu có file upload thì URL sẽ bị ghi đè sau khi upload xong
      coverImageUrl: selectedCoverFile ? null : (form.coverImageUrl || null),
      publisherId: form.publisher.id ?? null,
      authorIds: form.authors.filter(a => a.id).map(a => a.id),
      categoryIds: form.categories.filter(c => c.id).map(c => c.id),
      tagIds: form.tags.filter(t => t.id).map(t => t.id),
      tableOfContents: form.tableOfContents ?? null,
    };

    try {
      setSaving(true);
      const res = await publicationsService.createPublication(payload as any);
      if (res.code === 201 && res.data) {
        const newId: string = res.data;
        const title = form.title;

        const uploadPromises = [];
        if (selectedCoverFile) uploadPromises.push(runCoverUpload(newId, selectedCoverFile, title));
        if (selectedDocumentFile) uploadPromises.push(runDocumentUpload(newId, selectedDocumentFile, title));

        let uploadsOk = true;
        if (uploadPromises.length > 0) {
          const uploadResults = await Promise.all(uploadPromises);
          uploadsOk = uploadResults.every(Boolean);
        }

        toast.success(`Tạo ấn phẩm "${title}" thành công!`);
        if (!uploadsOk) {
          toast.warning('Ấn phẩm đã được tạo nhưng có file tải lên thất bại. Bạn có thể thử lại trong khung upload.');
        }
        setIsEditingMetadata(false);
        navigate(`/librarianpage/books/${newId}`, { replace: true });
      } else {
        toast.error(getFriendlyErrorMessage(res));
      }
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const selectStyles = {
    control: (baseStyles: any) => ({
      ...baseStyles,
      borderColor: '#e2e8f0',
      borderRadius: '0.5rem',
      outline: 'none',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#cbd5e1',
      },
      '&:focus-within': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 1px #3b82f6',
      },
      minHeight: '42px',
      backgroundColor: '#ffffff',
    }),
    menu: (baseStyles: any) => ({
      ...baseStyles,
      borderRadius: '0.5rem',
      zIndex: 9999,
    }),
    option: (baseStyles: any, state: any) => ({
      ...baseStyles,
      backgroundColor: state.isSelected ? '#bfdbfe' : state.isFocused ? '#f1f5f9' : undefined,
      color: '#334155',
      '&:active': {
        backgroundColor: '#93c5fd',
      },
    }),
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
            <p className="mt-4 text-slate-600">Đang tải dữ liệu ấn phẩm...</p>
          </div>
        </div>
      </div>
    );
  }

  const aiStatus = AI_STATUS_CONFIG[form.aiProcessingStatus] ?? AI_STATUS_CONFIG.NOT_UPLOADED;
  const AiStatusIcon = aiStatus.icon;

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/librarianpage/books"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="text-sm text-slate-500 flex items-center gap-2">
              Đầu sách <span className="text-slate-300">/</span>{' '}
              {isCreate ? 'Thêm mới' : form.title || 'Đang tải'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isCreate ? 'Thêm đầu sách' : 'Chi Tiết Đầu Sách'}
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          {!isCreate && (
            <button
              onClick={() => navigate('/librarianpage/copies/new', { state: { publicationId: form.id } })}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Copy size={18} /> TẠO BẢN SAO MỚI
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-secondary px-6 py-3 border-b border-indigo-700 flex justify-between items-center">
              <div>
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Copy size={18} /> PULICATION METADATA
                </h2>
                <p className="text-indigo-200 text-xs">
                  Quản lý các thông tin cơ bản về ấn phẩm
                </p>
              </div>
              {!isCreate && (
                <div className="flex items-center gap-2">
                  {isEditingMetadata && (
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all bg-white text-secondary hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu Metadata'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditingMetadata) {
                        setMetadataSnapshot({
                          isbn: form.isbn,
                          callNumber: form.callNumber,
                          title: form.title,
                          subtitle: form.subtitle,
                          description: form.description,
                          language: form.language,
                          pages: form.pages,
                          publicationYear: form.publicationYear,
                          edition: form.edition,
                          size: form.size,
                          weight: form.weight,
                          aiTargetAudience: form.aiTargetAudience,
                          publisher: form.publisher,
                          authors: [...form.authors],
                          categories: [...form.categories],
                          tags: [...form.tags],
                        });
                      } else {
                        if (metadataSnapshot) setForm(prev => ({ ...prev, ...metadataSnapshot }));
                      }
                      setIsEditingMetadata(!isEditingMetadata);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${isEditingMetadata
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white text-secondary hover:bg-slate-50'
                    }`}
                  >
                    {isEditingMetadata ? (
                      <><X size={14} /> Hủy</>
                    ) : (
                      <><Edit2 size={14} /> Chỉnh Sửa</>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Smart Book Lookup */}
              {isEditingMetadata && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                    Tra cứu thông tin sách tự động
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lookupQuery}
                      onChange={e => setLookupQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSmartLookup()}
                      placeholder="Nhập ISBN (vd: 9780132350884) hoặc tên sách (vd: Clean Code)..."
                      className="flex-1 px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSmartLookup}
                      disabled={isLookingUp || !lookupQuery.trim()}
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap font-medium"
                    >
                      {isLookingUp ? 'Đang tìm...' : 'Tra cứu'}
                    </button>
                  </div>
                  {lookupApplied && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <span className="text-sm text-green-700">
                          Đã điền tự động từ <strong>"{lookupApplied.title}"</strong>
                          {isResolvingEntities && (
                            <span className="ml-2 text-indigo-600 animate-pulse">— Đang tra cứu tác giả & NXB...</span>
                          )}
                        </span>
                        {!isResolvingEntities && (
                          <button onClick={() => setLookupApplied(null)} className="text-green-500 hover:text-green-700 ml-2">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-indigo-500">
                    Nhập ISBN để điền tự động ngay · Nhập tên sách để chọn từ danh sách kết quả
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  readOnly={!isEditingMetadata}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                    }`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  readOnly={!isEditingMetadata}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="VD: A Handbook of Agile Software Craftsmanship"
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={form.isbn}
                    readOnly={!isEditingMetadata}
                    onChange={(e) => setForm((prev) => ({ ...prev, isbn: e.target.value }))}
                    placeholder="ISBN-10 hoặc ISBN-13 (không bắt buộc)"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                      form.isbn && !validateOptionalIsbn(form.isbn) ? 'border-red-300' : 'border-slate-200'
                    } ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                  />
                  {isEditingMetadata && form.isbn && !validateOptionalIsbn(form.isbn) && (
                    <p className="mt-1 text-xs text-red-600">
                      ISBN phải là ISBN-10 hoặc ISBN-13 hợp lệ.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Mã xếp giá (DDC)
                    <span className="ml-1 text-xs font-normal text-slate-400">VD: 813.083 M6237M</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.callNumber}
                      readOnly={!isEditingMetadata}
                      onChange={(e) => setForm((prev) => ({ ...prev, callNumber: e.target.value }))}
                      placeholder="Nhập hoặc tra cứu từ ISBN"
                      className={`flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                    />
                    {isEditingMetadata && (
                      <button
                        type="button"
                        onClick={handleLookupDDC}
                        disabled={isLookingUpDDC}
                        className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-medium disabled:opacity-50 whitespace-nowrap"
                      >
                        {isLookingUpDDC ? 'Đang tra...' : '🔍 Tra cứu DDC'}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Số trang
                  </label>
                  <input
                    type="number"
                    value={form.pages}
                    readOnly={!isEditingMetadata}
                    onChange={(e) => setForm((prev) => ({ ...prev, pages: e.target.value }))}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Năm xuất bản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.publicationYear}
                    readOnly={!isEditingMetadata}
                    onChange={(e) => setForm((prev) => ({ ...prev, publicationYear: e.target.value }))}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Ngôn ngữ <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={!isEditingMetadata}
                    value={form.language}
                    onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                  >
                    <option value="">Chọn ngôn ngữ</option>
                    <option value="Vietnamese">Tiếng Việt</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Tái bản lần thứ
                  </label>
                  <input
                    type="text"
                    value={form.edition}
                    readOnly={!isEditingMetadata}
                    onChange={(e) => setForm((prev) => ({ ...prev, edition: e.target.value }))}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Loại tài liệu
                  </label>
                  <select
                    disabled={!isEditingMetadata}
                    value={form.publicationFormat}
                    onChange={(e) => setForm((prev) => ({ ...prev, publicationFormat: e.target.value }))}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                  >
                    <option value="PRINT_BOOK">Sách in</option>
                    <option value="PHOTOCOPY">Bản photo</option>
                    <option value="EBOOK">Sách điện tử</option>
                    <option value="THESIS">Luận văn / đồ án</option>
                    <option value="REFERENCE">Tài liệu tham khảo</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Kích cỡ (A x A x A cm)
                  </label>
                  <input
                    type="text"
                    value={form.size}
                    readOnly={!isEditingMetadata}
                    onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Khối lượng (g)
                  </label>
                  <input
                    type="number"
                    value={form.weight}
                    readOnly={!isEditingMetadata}
                    onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Ghi chú ấn bản/tái bản
                </label>
                <input
                  type="text"
                  value={form.editionNote}
                  readOnly={!isEditingMetadata}
                  onChange={(e) => setForm((prev) => ({ ...prev, editionNote: e.target.value }))}
                  placeholder="VD: Tái bản lần 3, có sửa chữa và bổ sung"
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                    }`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Đặc tả
                </label>
                <textarea
                  rows={4}
                  readOnly={!isEditingMetadata}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                    }`}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>



              {/* Thay thế block aiSummary hiện tại bằng đoạn dưới */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Đối tượng độc giả (Khoa)
                </label>
                <select
                  disabled={!isEditingMetadata}
                  value={form.aiTargetAudience}
                  onChange={(e) => setForm((prev) => ({ ...prev, aiTargetAudience: e.target.value }))}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!isEditingMetadata ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                    }`}
                >
                  <option value="">-- Chưa phân loại --</option>
                  {FACULTY_TARGET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Khoa / ngành phù hợp với nội dung ấn phẩm này
                </p>
              </div>

              {form.aiSummary && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <Star size={16} className="text-yellow-500" /> AI Summary & Tóm Tắt Nội Dung
                  </label>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    {form.aiSummary}
                  </p>
                </div>
              )}

              <hr className="border-slate-200 my-4" />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Nhà xuất bản <span className="text-red-500">*</span>
                  </label>
                  <AsyncCreatableSelectField
                    isDisabled={!isEditingMetadata}
                    value={
                      form.publisher?.id
                        ? { value: form.publisher.id, label: form.publisher.name } as any
                        : null
                    }
                    loadOptions={loadPublisherOptions}
                    onCreate={createPublisherOption}
                    onChange={(option: any) => {
                      setForm((prev) => ({
                        ...prev,
                        publisher: option
                          ? {
                            id: option.value ?? null,
                            name: option.label ?? '',
                          }
                          : { id: null, name: '' },
                      }));
                    }}
                    placeholder="Chọn hoặc nhập nhà xuất bản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Tác giả <span className="text-red-500">*</span>
                  </label>
                  <AsyncCreatableSelectField
                    isMulti
                    isDisabled={!isEditingMetadata}
                    value={form.authors.filter(a => a.id).map(a => ({
                      value: a.id,
                      label: a.name,
                    })) as any}
                    loadOptions={loadAuthorOptions}
                    onCreate={createAuthorOption}
                    onChange={(selected: any[]) => {
                      const mapped = selected.map(s => ({
                        id: s.value !== undefined ? s.value : null,
                        name: s.label,
                      }));
                      setForm(prev => ({ ...prev, authors: mapped }));
                    }}
                    placeholder="Chọn hoặc nhập tác giả"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Danh mục
                  </label>
                  <AsyncCreatableSelectField
                    isMulti
                    isDisabled={!isEditingMetadata}
                    value={form.categories.filter(c => c.id).map(c => ({
                      value: c.id,
                      label: c.name,
                    })) as any}
                    loadOptions={loadCategoryOptions}
                    onCreate={createCategoryOption}
                    onChange={(selected: any[]) => {
                      const mapped = selected.map(s => ({
                        id: s.value !== undefined ? s.value : null,
                        name: s.label,
                      }));
                      setForm(prev => ({ ...prev, categories: mapped }));
                    }}
                    placeholder="Chọn hoặc nhập danh mục"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tags
                  </label>
                  <AsyncCreatableSelectField
                    isMulti
                    isDisabled={!isEditingMetadata}
                    value={form.tags.filter(t => t.id).map(t => ({
                      value: t.id,
                      label: t.name,
                    })) as any}
                    loadOptions={loadTagOptions}
                    onCreate={createTagOption}
                    onChange={(selected: any[]) => {
                      const mapped = selected.map(s => ({
                        id: s.value !== undefined ? s.value : null,
                        name: s.label,
                      }));
                      setForm(prev => ({ ...prev, tags: mapped }));
                    }}
                    placeholder="Chọn hoặc nhập tag"
                  />
                </div>
              </div>
            </div>
          </div>

            {/* Cover Image Management Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="bg-indigo-600 px-6 py-3 border-b border-indigo-700">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <ImageIcon size={18} /> QUẢN LÝ TRANG BÌA
              </h2>
              <p className="text-indigo-100 text-xs">
                Tải lên và thay đổi ảnh bìa của ấn phẩm
              </p>
            </div>
            <div className="p-6">
                <div
                  className="flex items-center gap-6 rounded-xl border border-dashed border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (file) processCoverFile(file);
                  }}
                >
                  <div className="w-32 h-44 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                    {form.coverImageUrl ? (
                      <img
                        src={form.coverImageUrl}
                        alt="Current cover"
                        className="w-full h-full object-cover transition-all hover:scale-105"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 mb-1">
                        {isCreate ? 'Chọn ảnh bìa cho ấn phẩm' : 'Cập nhật ảnh bìa mới'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Kéo thả hoặc tải lên một tệp hình ảnh để làm ảnh bìa cho ấn phẩm này.
                        Định dạng hỗ trợ: JPG, PNG, WEBP. Tối đa 5MB.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('cover-upload-input')?.click()}
                        disabled={isUploadingCover || saving}
                        className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        {isUploadingCover ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            Đang tải lên ({coverUploadProgress}%)
                          </>
                        ) : (
                          <>
                            <Upload size={16} /> {isCreate ? 'Chọn ảnh bìa' : 'Thay đổi ảnh bìa'}
                          </>
                        )}
                      </button>
                      <input
                        id="cover-upload-input"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCoverUpload}
                      />
                      {isCreate && selectedCoverFile && !isUploadingCover && (
                        <div className="text-xs text-amber-600 font-medium">
                          Sẵn sàng tải lên: {selectedCoverFile.name}
                        </div>
                      )}
                      {coverUploadProgress > 0 && coverUploadProgress < 100 && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-secondary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${coverUploadProgress}%` }}
                          />
                        </div>
                      )}
                      {form.coverImageUrl && (
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = await dialog.confirm({
                              title: 'Gỡ ảnh bìa',
                              message: 'Bạn có chắc chắn muốn gỡ bỏ ảnh bìa hiện tại?',
                              confirmText: 'Gỡ bỏ',
                              cancelText: 'Hủy',
                              variant: 'warning',
                            });
                            if (!confirmed) return;
                            setForm(prev => ({ ...prev, coverImageUrl: null }));
                            if (isCreate) setSelectedCoverFile(null);
                          }}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                          Gỡ bỏ
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              {/* Cover picker từ lookup */}
              {availableCovers.length > 1 && isEditingMetadata && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Chọn ảnh bìa từ kết quả tra cứu
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {availableCovers.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, coverImageUrl: url }))}
                        className={`relative w-20 h-28 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          form.coverImageUrl === url
                            ? 'border-indigo-500 shadow-md shadow-indigo-200'
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Cover option ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = ''; }}
                        />
                        {form.coverImageUrl === url && (
                          <div className="absolute inset-0 bg-indigo-500/20 flex items-end justify-center pb-1">
                            <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded font-medium">
                              Đang dùng
                            </span>
                          </div>
                        )}
                        <div className="absolute top-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                          {idx === 0 ? 'Google' : 'OpenLib'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File URL Management Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="bg-teal-600 px-6 py-3 border-b border-teal-700">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Upload size={18} /> QUẢN LÝ FILE ĐÍNH KÈM
              </h2>
              <p className="text-teal-100 text-xs">
                Tải file nội dung trực tiếp lên hệ thống (PDF, EPUB...)
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className={`rounded-lg border px-4 py-3 ${aiStatus.className}`}>
                {(() => {
                  const isAiBusy = !!runningAiAction || form.aiProcessingStatus === 'QUEUED' || form.aiProcessingStatus === 'RUNNING';
                  const canGenerateMetadata = !!form.aiVectorsCount && form.aiVectorsCount > 0 && !isAiBusy;
                  return (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <AiStatusIcon
                      size={20}
                      className={`mt-0.5 flex-shrink-0 ${form.aiProcessingStatus === 'RUNNING' ? 'animate-spin' : ''}`}
                    />
                    <div>
                      <p className="text-sm font-semibold">{aiStatus.label}</p>
                      <p className="text-xs opacity-80">{aiStatus.description}</p>
                      {form.aiProcessingError && (
                        <p className="mt-2 text-xs text-red-700">{form.aiProcessingError}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-xs opacity-80 sm:items-end sm:text-right">
                    {form.aiProcessedAt && (
                      <div>Cập nhật: {new Date(form.aiProcessedAt).toLocaleString('vi-VN')}</div>
                    )}
                    {form.aiProcessingStatus === 'SUCCESS' && (
                      <div>{form.aiChunksCount ?? 0} chunks / {form.aiVectorsCount ?? 0} vectors</div>
                    )}
                    {!isCreate && form.fileUrl && (
                      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleRunAiAction('vectorize')}
                          disabled={isAiBusy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={13} className={runningAiAction === 'vectorize' ? 'animate-spin' : ''} />
                          {runningAiAction === 'vectorize' ? 'Đang vector hóa...' : 'Reset vector'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunAiAction('metadata')}
                          disabled={!canGenerateMetadata}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          title={!form.aiVectorsCount ? 'Cần vector hóa sách trước khi sinh metadata' : undefined}
                        >
                          <Star size={13} className={runningAiAction === 'metadata' ? 'animate-spin' : ''} />
                          {runningAiAction === 'metadata' ? 'Đang sinh metadata...' : 'Sinh metadata'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                  );
                })()}
              </div>

              {!form.fileUrl ? (
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center transition-colors hover:border-teal-400 hover:bg-teal-50/40"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (file) processDocumentFile(file);
                  }}
                >
                  <Upload size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">Kéo thả file hoặc chọn file để upload</p>
                  <p className="text-xs text-slate-400 mt-1">Hỗ trợ PDF, EPUB, tối đa 100MB</p>
                  <button
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                    disabled={uploadingFile || saving}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
                  >
                    {uploadingFile ? `Đang tải lên (${docUploadProgress}%)` : 'Chọn file'}
                  </button>
                  <input
                    id="file-upload-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.epub"
                    onChange={handleFileUpload}
                  />
                  {isCreate && selectedDocumentFile && !uploadingFile && (
                     <div className="mt-2 text-sm text-amber-600 font-medium bg-amber-50 py-1 px-3 rounded-full inline-block">
                       📄 Sẵn sàng: {selectedDocumentFile.name}
                     </div>
                  )}
                  {docUploadProgress > 0 && docUploadProgress < 100 && (
                     <div className="w-64 mx-auto bg-slate-100 rounded-full h-1.5 mt-4">
                       <div
                         className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                         style={{ width: `${docUploadProgress}%` }}
                       />
                     </div>
                  )}
                </div>

              ) : (
                <div className="flex items-center gap-4 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-teal-100 rounded">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-teal-800 truncate">{uploadedFileName || 'File đã upload'}</p>
                    <p className="text-xs text-teal-600 truncate">{form.fileUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    {form.fileUrl.startsWith('http') && (
                      <a href={form.fileUrl} target="_blank" className="text-teal-600 hover:text-teal-800">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          fileUrl: '',
                          aiProcessingStatus: 'NOT_UPLOADED',
                          aiProcessingError: null,
                          aiChunksCount: null,
                          aiVectorsCount: null,
                          aiProcessedAt: null,
                        }));
                        setUploadedFileName(null);
                        if (isCreate) setSelectedDocumentFile(null);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => document.getElementById('file-upload-input')?.click()}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              )}

              {uploadingFile && (
                <div className="flex items-center gap-2 text-sm text-teal-600">
                  <div className="w-4 h-4 border-2 border-teal-300 border-t-teal-600 animate-spin rounded-full" />
                  Đang upload file...
                </div>
              )}
            </div>

          </div>

          {/* Button tạo ấn phẩm — nằm ngoài các section, ở dưới cùng */}
          {isCreate && (
            <div className="flex justify-end">
              <button
                className="px-8 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                onClick={handleCreate}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? 'Đang tạo...' : 'Tạo Ấn Phẩm'}
              </button>
            </div>
          )}

          {/* Advanced Actions — chỉ hiển thị khi đang xem/sửa, không hiển thị khi tạo mới */}
          {!isCreate && <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
            <div className="bg-orange-600 px-6 py-3 border-b border-orange-700">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle size={18} /> THAO TÁC QUẢN TRỊ
              </h2>
              <p className="text-orange-100 text-xs">
                Các thao tác có ảnh hưởng trực tiếp đến dữ liệu ấn phẩm.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-4">
                <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} /> VÙNG NGUY HIỂM
                </h3>
                <p className="text-xs text-red-600 mb-3">
                  Xóa vĩnh viễn ấn phẩm này và tất cả các mục liên quan. Hành
                  động này không thể hoàn tác.
                </p>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={async () => {
                    if (isCreate) {
                      toast.info('Ấn phẩm chưa được lưu, không có gì để xoá.');
                      return;
                    }
                    const confirmed = await dialog.confirm({
                      title: 'Xóa ấn phẩm',
                      message: 'Bạn chắc chắn muốn xoá ấn phẩm này? Hành động không thể hoàn tác.',
                      confirmText: 'Xóa',
                      cancelText: 'Hủy',
                      variant: 'danger',
                    });
                    if (!confirmed) return;
                    try {
                      setSaving(true);
                      const res = await publicationsService.deletePublication(id as string);
                      if (res.code === 200) {
                        toast.success('Đã xoá ấn phẩm.');
                        navigate('/librarianpage/books');
                      } else {
                        toast.error(getFriendlyErrorMessage(res));
                      }
                    } catch (error: any) {
                      const msg = error?.response?.data?.message || error?.message;
                      if (msg?.includes('items still exist')) {
                        toast.error('Không thể xoá: ấn phẩm này còn bản sao vật lý. Hãy xoá tất cả bản sao trước.');
                      } else if (msg?.includes('active reservations')) {
                        toast.error('Không thể xoá: ấn phẩm này đang có đặt trước. Hãy huỷ các đặt trước trước.');
                      } else {
                        toast.error(getFriendlyErrorMessage(error));
                      }
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  <Trash2 size={16} /> {saving ? 'Đang xoá...' : 'Xóa ấn phẩm'}
                </button>
              </div>
            </div>
          </div>}
        </div>

        {/* Right Preview Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg sticky top-6">
            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
              <Eye className="text-white" size={20} />
              <span className="text-white font-semibold">XEM TRƯỚC</span>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-48 h-64 rounded-lg shadow-2xl mb-6 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {form.coverImageUrl ? (
                  <img
                    src={form.coverImageUrl}
                    alt={form.title || 'Book cover'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full p-4 relative flex flex-col justify-between text-white text-opacity-90">
                    <div className="text-2xl font-bold tracking-widest border-b-2 border-white pb-2 mb-2 line-clamp-3">
                      {form.title || 'Chưa có tiêu đề'}
                    </div>
                    <div className="text-xs opacity-80 line-clamp-2">
                      {form.publisher.name || 'Chưa có NXB'}
                    </div>
                    <div className="mt-auto text-xs font-mono opacity-70">
                      {form.publicationYear || '----'}
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {form.title || 'Chưa có tiêu đề'}
              </h3>
              <p className="text-slate-400 text-sm mb-3">
                {previewAuthors} • {form.publicationYear || 'N/A'}
              </p>

              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={
                      s <= Math.round(Number(form.averageRating) || 0)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-600'
                    }
                  />
                ))}
                <span className="text-slate-400 text-xs ml-2">
                  {form.averageRating} ({form.totalRatings} đánh giá)
                </span>
              </div>

              <div className="w-full space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Available:</span>
                  <span className="text-green-400 font-medium">{form.availableItems} bản sao</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">On Loan:</span>
                  <span className="text-yellow-400 font-medium">{form.borrowedItems} bản sao</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                  <span className="text-white">Total:</span>
                  <span className="text-white font-medium">{form.totalItems} bản sao</span>
                </div>
              </div>

              <Link
                to={`/publicpage/book/${form.id || id}`}
                className="w-full py-3 bg-secondary hover:bg-indigo-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink size={18} /> XEM TRANG CÔNG KHAI
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Confirm Create Missing Entities Modal */}
    {showCreateModal && pendingEntities.length > 0 && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Không tìm thấy trong hệ thống</h3>
            <p className="text-sm text-slate-500 mt-1">Chọn các mục bạn muốn tạo mới:</p>
          </div>
          <div className="px-6 py-4 space-y-3">
            {pendingEntities.map((entity, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={entity.checked}
                  onChange={() => setPendingEntities(prev =>
                    prev.map((e, i) => i === idx ? { ...e, checked: !e.checked } : e)
                  )}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  entity.type === 'author' ? 'bg-blue-100 text-blue-700' :
                  entity.type === 'publisher' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {entity.type === 'author' ? 'Tác giả' : entity.type === 'publisher' ? 'NXB' : 'Danh mục'}
                </span>
                <span className="text-sm text-slate-700 group-hover:text-slate-900">{entity.name}</span>
              </label>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={() => { setShowCreateModal(false); setPendingEntities([]); }}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
            >
              Bỏ qua tất cả
            </button>
            <button
              onClick={handleCreatePendingEntities}
              disabled={!pendingEntities.some(e => e.checked)}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              Tạo mục đã chọn
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Title Search Results Modal */}
    {showResultsModal && lookupResults && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">
              Kết quả tìm kiếm — chọn cuốn sách cần điền
            </h3>
            <button onClick={() => setShowResultsModal(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {lookupResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { applyLookupResult(item); }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-indigo-50 text-left transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-16 bg-slate-100 rounded overflow-hidden">
                  {item.coverImageUrl
                    ? <img src={item.coverImageUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No cover</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{item.title}</p>
                  {item.authorNames?.length > 0 && (
                    <p className="text-sm text-slate-500 truncate">{item.authorNames.join(', ')}</p>
                  )}
                  <div className="flex gap-2 mt-1 text-xs text-slate-400">
                    {item.publisherName && <span>{item.publisherName}</span>}
                    {item.publicationYear && <span>· {item.publicationYear}</span>}
                    {item.language && <span>· {item.language}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default BookDetails;
