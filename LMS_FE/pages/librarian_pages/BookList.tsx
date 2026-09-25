import { AlertTriangle, BookOpen, CheckCircle, Clock, Edit2, Eye, Loader2, Plus, RotateCcw, Search, Star, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import publicationsService from '../../api/publicationsService';
import { LibrarianPublicationResponse, Category } from '../../api/publicationTypes';
import { Book } from '../../types';
import categoriesService from '../../api/categoriesService';
import Select from 'react-select';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppDialog } from '../../contexts/AppDialogContext';

const copy = {
  vi: {
    loadingData: 'Đang tải dữ liệu...',
    title: 'Danh sách ấn phẩm',
    subtitle: 'Quản lý danh mục ấn phẩm thư viện.',
    addBook: 'Thêm đầu sách mới',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tìm theo tiêu đề / tác giả / ISBN...',
    category: 'Chủ đề',
    allCategories: 'Tất cả chủ đề',
    categoryPlaceholder: 'Chọn một hoặc nhiều chủ đề...',
    publicationYear: 'Năm xuất bản',
    yearFrom: 'Từ năm',
    yearTo: 'Đến năm',
    allYears: 'Tất cả năm',
    aiStatus: 'Trạng thái AI',
    allAiStatuses: 'Tất cả trạng thái AI',
    sort: 'Sắp xếp',
    ascending: 'Tăng dần',
    descending: 'Giảm dần',
    summaryTotal: 'Tổng đầu sách',
    summaryAi: 'AI đã xong',
    summaryAiSub: 'đầu sách hoàn tất metadata/vector',
    summaryHasCopies: 'Có bản sao',
    summaryNoCopies: 'Chưa có bản sao',
    summaryFiltered: 'Đang hiển thị',
    all: 'Tất cả',
    hasCopies: 'Có bản sao',
    noCopies: 'Chưa có bản sao',
    clearFilters: 'Xóa bộ lọc',
    apply: 'Áp dụng',
    tableTitle: 'Tiêu Đề',
    tableAuthor: 'Tác Giả',
    tableYear: 'Năm',
    tableCount: 'Số lượng',
    tableCreated: 'Ngày tạo',
    tableAiStatus: 'Trạng thái AI',
    actions: 'Thao tác',
    loading: 'Đang tải...',
    noData: 'Không tìm thấy dữ liệu',
    viewDetails: 'Xem chi tiết',
    edit: 'Chỉnh sửa',
    addCopy: 'Thêm bản sao',
    showing: 'Hiển thị',
    inTotal: 'trong tổng số',
    books: 'đầu sách',
    notAvailable: 'N/A',
  },
  en: {
    loadingData: 'Loading data...',
    title: 'Publications',
    subtitle: 'Manage the library publication catalog',
    addBook: 'Add new publication',
    search: 'Search',
    searchPlaceholder: 'Search by title / author / ISBN...',
    category: 'Topic',
    allCategories: 'All topics',
    categoryPlaceholder: 'Select one or more topics...',
    publicationYear: 'Publication year',
    yearFrom: 'From year',
    yearTo: 'To year',
    allYears: 'All years',
    aiStatus: 'AI status',
    allAiStatuses: 'All AI statuses',
    sort: 'Sort',
    ascending: 'Ascending',
    descending: 'Descending',
    summaryTotal: 'Total publications',
    summaryAi: 'AI completed',
    summaryAiSub: 'publications with completed AI metadata/vectors',
    summaryHasCopies: 'With copies',
    summaryNoCopies: 'No copies yet',
    summaryFiltered: 'Showing now',
    all: 'All',
    hasCopies: 'Has copies',
    noCopies: 'No copies yet',
    clearFilters: 'Clear filters',
    apply: 'Apply',
    tableTitle: 'Title',
    tableAuthor: 'Author',
    tableYear: 'Year',
    tableCount: 'Copies',
    tableCreated: 'Created at',
    tableAiStatus: 'AI status',
    actions: 'Actions',
    loading: 'Loading...',
    noData: 'No data found',
    viewDetails: 'View details',
    edit: 'Edit',
    addCopy: 'Add copy',
    showing: 'Showing',
    inTotal: 'of',
    books: 'publications',
    notAvailable: 'N/A',
  },
};

const AI_STATUS_CONFIG = {
  NOT_UPLOADED: { label: { vi: 'Chưa upload', en: 'Not uploaded' }, className: 'bg-slate-100 text-slate-600', icon: Clock },
  NOT_STARTED: { label: { vi: 'Chưa chạy', en: 'Not started' }, className: 'bg-amber-50 text-amber-700', icon: Clock },
  QUEUED: { label: { vi: 'Đang chờ', en: 'Queued' }, className: 'bg-blue-50 text-blue-700', icon: Clock },
  RUNNING: { label: { vi: 'Đang chạy', en: 'Running' }, className: 'bg-indigo-50 text-indigo-700', icon: Loader2 },
  SUCCESS: { label: { vi: 'Đã xong', en: 'Completed' }, className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
  FAILED: { label: { vi: 'Lỗi AI', en: 'AI failed' }, className: 'bg-red-50 text-red-700', icon: XCircle },
} as const;

type AiStatusKey = keyof typeof AI_STATUS_CONFIG;

const SORT_OPTIONS = [
  { value: 'createdAt', labels: { vi: 'Ngày tạo', en: 'Created date' } },
  { value: 'publicationYear', labels: { vi: 'Năm xuất bản', en: 'Publication year' } },
  { value: 'title', labels: { vi: 'Tiêu đề A-Z', en: 'Title A-Z' } },
  { value: 'authorNames', labels: { vi: 'Tác giả A-Z', en: 'Author A-Z' } },
];

const AiStatusBadge = ({ status, language }: { status?: Book['aiProcessingStatus']; language: 'vi' | 'en' }) => {
  const cfg = AI_STATUS_CONFIG[status || 'NOT_UPLOADED'] ?? AI_STATUS_CONFIG.NOT_UPLOADED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}>
      <Icon size={13} className={status === 'RUNNING' ? 'animate-spin' : ''} />
      {cfg.label[language]}
    </span>
  );
};

const BookList = () => {
  const { language } = useLanguage();
  const dialog = useAppDialog();
  const c = copy[language];
  const [isDarkMode, setIsDarkMode] = useState(false);
  // State cho data
  const [books, setBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho sorting
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [direction, setDirection] = useState<'ASC' | 'DESC'>('DESC');

  // State cho search & filters
  const [searchInput, setSearchInput] = useState(''); // Input tạm
  const [keyword, setKeyword] = useState(''); // Keyword thực tế gửi lên API
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [appliedCategoryIds, setAppliedCategoryIds] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [appliedYearFrom, setAppliedYearFrom] = useState<number | undefined>(undefined);
  const [appliedYearTo, setAppliedYearTo] = useState<number | undefined>(undefined);
  const [selectedAiStatuses, setSelectedAiStatuses] = useState<AiStatusKey[]>([]);
  const [appliedAiStatuses, setAppliedAiStatuses] = useState<AiStatusKey[]>([]);

  // State cho hasItems filter
  const [hasItems, setHasItems] = useState<boolean | undefined>(undefined);

  // State cho categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // State cho pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [runningAiAction, setRunningAiAction] = useState<{ id: string; action: 'vectorize' | 'metadata' } | null>(null);

  // Fetch categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoriesService.getAllCategories();
        if (response.code === 200 && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const syncDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    syncDarkMode();
    const observer = new MutationObserver(syncDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const selectStyles = useMemo(() => ({
    control: (baseStyles: any, state: any) => ({
      ...baseStyles,
      minHeight: '42px',
      borderRadius: '0.5rem',
      borderColor: state.isFocused
        ? '#3b82f6'
        : isDarkMode ? '#334155' : '#e2e8f0',
      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      outline: 'none',
      '&:hover': {
        borderColor: state.isFocused
          ? '#3b82f6'
          : isDarkMode ? '#475569' : '#cbd5e1',
      },
    }),
    menu: (baseStyles: any) => ({
      ...baseStyles,
      zIndex: 9999,
      overflow: 'hidden',
      borderRadius: '0.5rem',
      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
      backgroundColor: isDarkMode ? '#111827' : '#ffffff',
      boxShadow: isDarkMode
        ? '0 18px 45px rgba(0, 0, 0, 0.35)'
        : '0 18px 45px rgba(15, 23, 42, 0.12)',
    }),
    menuList: (baseStyles: any) => ({
      ...baseStyles,
      padding: '4px',
      backgroundColor: isDarkMode ? '#111827' : '#ffffff',
    }),
    option: (baseStyles: any, state: any) => ({
      ...baseStyles,
      borderRadius: '0.375rem',
      backgroundColor: state.isSelected
        ? '#2563eb'
        : state.isFocused
          ? isDarkMode ? '#1e293b' : '#f1f5f9'
          : 'transparent',
      color: state.isSelected ? '#ffffff' : isDarkMode ? '#e2e8f0' : '#334155',
      '&:active': {
        backgroundColor: state.isSelected ? '#2563eb' : isDarkMode ? '#334155' : '#dbeafe',
      },
    }),
    valueContainer: (baseStyles: any) => ({
      ...baseStyles,
      padding: '2px 12px',
      overflow: 'hidden',
    }),
    input: (baseStyles: any) => ({
      ...baseStyles,
      margin: 0,
      padding: 0,
      color: isDarkMode ? '#e2e8f0' : '#0f172a',
    }),
    placeholder: (baseStyles: any) => ({
      ...baseStyles,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    }),
    multiValue: (baseStyles: any) => ({
      ...baseStyles,
      borderRadius: '0.375rem',
      backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
    }),
    multiValueLabel: (baseStyles: any) => ({
      ...baseStyles,
      color: isDarkMode ? '#bfdbfe' : '#1e40af',
      fontWeight: 600,
    }),
    multiValueRemove: (baseStyles: any) => ({
      ...baseStyles,
      color: isDarkMode ? '#bfdbfe' : '#1e40af',
      ':hover': {
        backgroundColor: isDarkMode ? '#1d4ed8' : '#bfdbfe',
        color: isDarkMode ? '#ffffff' : '#1e3a8a',
      },
    }),
    clearIndicator: (baseStyles: any) => ({
      ...baseStyles,
      color: isDarkMode ? '#94a3b8' : '#94a3b8',
      ':hover': {
        color: isDarkMode ? '#e2e8f0' : '#475569',
      },
    }),
    dropdownIndicator: (baseStyles: any) => ({
      ...baseStyles,
      color: isDarkMode ? '#94a3b8' : '#94a3b8',
      ':hover': {
        color: isDarkMode ? '#e2e8f0' : '#475569',
      },
    }),
    indicatorSeparator: (baseStyles: any) => ({
      ...baseStyles,
      backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
    }),
  }), [isDarkMode]);

  const mapPublicationToBook = (pub: LibrarianPublicationResponse): Book => ({
    id: pub.publicationId,
    title: pub.subtitle ? `${pub.title}: ${pub.subtitle}` : pub.title,
    author: pub.authorNames?.join(', ') || c.notAvailable,
    isbn: pub.isbn || c.notAvailable,
    year: pub.publicationYear,
    publisher: pub.publisherName || c.notAvailable,
    totalCopies: pub.totalItems,
    availableCopies: pub.availableItems ?? 0,
    createdAt: pub.createdAt,
    category: pub.categoryNames || c.notAvailable,
    thumbnail: pub.coverImageUrl || '',
    aiProcessingStatus: pub.aiProcessingStatus,
    aiProcessingError: pub.aiProcessingError,
    aiChunksCount: pub.aiChunksCount ?? null,
    aiVectorsCount: pub.aiVectorsCount ?? null,
    aiProcessedAt: pub.aiProcessedAt,
  });

  // Fetch data từ API. Client-side filtering below enables multi-select filters without BE changes.
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const baseParams = {
          keyword: keyword || undefined,
          hasItems: hasItems,
          sortBy: 'createdAt',
          sortDir: 'DESC' as const,
        };
        const firstResponse = await publicationsService.getAllPublications({
          ...baseParams,
          page: 0,
          size: 200,
        });

        if (firstResponse.code === 200 && firstResponse.data) {
          const total = firstResponse.data.totalPages || 1;
          const restResponses = total > 1
            ? await Promise.all(
              Array.from({ length: total - 1 }, (_, index) =>
                publicationsService.getAllPublications({
                  ...baseParams,
                  page: index + 1,
                  size: 200,
                }).catch(() => null)
              )
            )
            : [];
          const content = [
            ...firstResponse.data.content,
            ...restResponses.flatMap((response) => response?.data?.content ?? []),
          ];

          setAllBooks(content.map(mapPublicationToBook));
        } else {
          setAllBooks([]);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        setAllBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [keyword, hasItems, c.notAvailable]);

  const filteredBooks = useMemo(() => {
    const selectedCategoryNames = categories
      .filter(category => appliedCategoryIds.includes(String(category.id)))
      .map(category => category.name || category.categoryName || '')
      .filter(Boolean);

    const filtered = allBooks.filter((book) => {
      const categoryMatch = selectedCategoryNames.length === 0
        || selectedCategoryNames.some(categoryName => book.category?.includes(categoryName));
      const yearMatch = (appliedYearFrom === undefined || book.year >= appliedYearFrom)
        && (appliedYearTo === undefined || book.year <= appliedYearTo);
      const aiStatus = (book.aiProcessingStatus || 'NOT_UPLOADED') as AiStatusKey;
      const aiMatch = appliedAiStatuses.length === 0 || appliedAiStatuses.includes(aiStatus);
      return categoryMatch && yearMatch && aiMatch;
    });

    return [...filtered].sort((a, b) => {
      const directionFactor = direction === 'ASC' ? 1 : -1;
      if (sortBy === 'publicationYear') return ((a.year || 0) - (b.year || 0)) * directionFactor;
      if (sortBy === 'totalItems') return (((a.totalCopies ?? 0) - (b.totalCopies ?? 0))) * directionFactor;
      if (sortBy === 'title') return a.title.localeCompare(b.title, language === 'vi' ? 'vi' : 'en') * directionFactor;
      if (sortBy === 'authorNames') return a.author.localeCompare(b.author, language === 'vi' ? 'vi' : 'en') * directionFactor;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (aTime - bTime) * directionFactor;
    });
  }, [allBooks, appliedAiStatuses, appliedCategoryIds, appliedYearFrom, appliedYearTo, categories, direction, language, sortBy]);

  const summary = useMemo(() => {
    const aiCompleted = allBooks.filter(book => book.aiProcessingStatus === 'SUCCESS').length;
    const hasCopiesCount = allBooks.filter(book => (book.totalCopies ?? 0) > 0).length;
    return {
      total: allBooks.length,
      aiCompleted,
      hasCopies: hasCopiesCount,
      noCopies: allBooks.length - hasCopiesCount,
      filtered: filteredBooks.length,
    };
  }, [allBooks, filteredBooks.length]);

  useEffect(() => {
    const nextTotalPages = Math.ceil(filteredBooks.length / pageSize);
    const safePage = nextTotalPages === 0 ? 0 : Math.min(currentPage, nextTotalPages - 1);
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
      return;
    }
    setBooks(filteredBooks.slice(safePage * pageSize, safePage * pageSize + pageSize));
    setTotalElements(filteredBooks.length);
    setTotalPages(nextTotalPages);
  }, [currentPage, filteredBooks, pageSize]);

  // Handler để toggle sort khi click header
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle direction
      setDirection(direction === 'DESC' ? 'ASC' : 'DESC');
    } else {
      // Set new sort field với DESC
      setSortBy(field);
      setDirection('DESC');
    }
    setCurrentPage(0); // Reset về trang đầu
  };

  // Handler cho nút "Áp dụng"
  const handleApplyFilters = () => {
    setKeyword(searchInput);
    setAppliedCategoryIds(selectedCategoryIds);
    setAppliedAiStatuses(selectedAiStatuses);
    const currentYear = new Date().getFullYear();
    const parsedFrom = yearFrom ? parseInt(yearFrom, 10) : undefined;
    const parsedTo = yearTo ? parseInt(yearTo, 10) : undefined;
    setAppliedYearFrom(!Number.isNaN(parsedFrom) ? parsedFrom : undefined);
    setAppliedYearTo(!Number.isNaN(parsedTo) ? parsedTo : yearFrom ? currentYear : undefined);
    setCurrentPage(0); // Reset về trang đầu khi search
  };

  // Handler cho nút "Xóa bộ lọc"
  const handleClearFilters = () => {
    setSearchInput('');
    setKeyword('');
    setSelectedCategoryIds([]);
    setAppliedCategoryIds([]);
    setYearFrom('');
    setYearTo('');
    setAppliedYearFrom(undefined);
    setAppliedYearTo(undefined);
    setSelectedAiStatuses([]);
    setAppliedAiStatuses([]);
    setHasItems(undefined);
    setSortBy('createdAt');
    setDirection('DESC');
    setCurrentPage(0);
  };

  const applySummaryFilter = (filter: 'all' | 'aiCompleted' | 'hasCopies' | 'noCopies' | 'filtered') => {
    if (filter === 'filtered') {
      setCurrentPage(0);
      return;
    }

    setSearchInput('');
    setKeyword('');
    setSelectedCategoryIds([]);
    setAppliedCategoryIds([]);
    setYearFrom('');
    setYearTo('');
    setAppliedYearFrom(undefined);
    setAppliedYearTo(undefined);
    setSelectedAiStatuses([]);
    setAppliedAiStatuses([]);
    setHasItems(undefined);

    if (filter === 'aiCompleted') {
      setSelectedAiStatuses(['SUCCESS']);
      setAppliedAiStatuses(['SUCCESS']);
    }
    if (filter === 'hasCopies') {
      setHasItems(true);
    }
    if (filter === 'noCopies') {
      setHasItems(false);
    }

    setCurrentPage(0);
  };

  const handleRunAiAction = async (book: Book, action: 'vectorize' | 'metadata') => {
    if (action === 'metadata' && !(book.aiVectorsCount && book.aiVectorsCount > 0)) {
      toast.warning(language === 'vi'
        ? 'Ấn phẩm chưa có vector. Hãy chạy reset vector hóa trước, sau khi xong mới sinh metadata.'
        : 'This publication has no vectors yet. Run vectorization first, then generate metadata.');
      return;
    }

    const confirmed = await dialog.confirm({
      title: action === 'vectorize'
        ? (language === 'vi' ? 'Reset vector hóa sách?' : 'Reset book vectorization?')
        : (language === 'vi' ? 'Sinh metadata bằng AI?' : 'Generate AI metadata?'),
      message: action === 'vectorize'
        ? (language === 'vi'
          ? 'Hệ thống sẽ đọc lại file nội dung, xóa vector cũ và sinh vector mới. Tác vụ này có thể tốn CPU và mất vài phút với file lớn.\n\nSau khi vector hóa hoàn tất, bạn mới nên chạy bước sinh tag / summary / audience.'
          : 'The system will reread the document, clear old vectors and generate new vectors. This can use CPU and take a few minutes for large files.\n\nAfter vectorization completes, run tags / summary / audience generation.')
        : (language === 'vi'
          ? 'Hệ thống sẽ dùng các vector hiện có để gọi LLM sinh tag, summary và audience. Tác vụ này có thể tốn quota/credit Gemini.\n\nChỉ chạy khi vector đã được sinh thành công.'
          : 'The system will use existing vectors to call the LLM for tags, summary and audience. This may consume Gemini quota/credit.\n\nOnly run this after vectors have been generated successfully.'),
      confirmText: action === 'vectorize'
        ? (language === 'vi' ? 'Reset vector' : 'Reset vectors')
        : (language === 'vi' ? 'Sinh metadata' : 'Generate metadata'),
      variant: action === 'vectorize' ? 'warning' : 'confirm',
    });
    if (!confirmed) return;

    setRunningAiAction({ id: book.id, action });
    try {
      if (action === 'vectorize') {
        await publicationsService.rerunPublicationVectorization(book.id);
      } else {
        await publicationsService.generatePublicationAiMetadata(book.id);
      }
      setBooks((current) => current.map((item) => item.id === book.id
        ? {
          ...item,
          aiProcessingStatus: 'QUEUED',
          aiProcessingError: null,
          aiProcessedAt: null,
          ...(action === 'vectorize' ? { aiChunksCount: null, aiVectorsCount: null } : {}),
        }
        : item));
      toast.success(action === 'vectorize'
        ? (language === 'vi' ? 'Đã đưa ấn phẩm vào hàng đợi vector hóa.' : 'Vectorization has been queued.')
        : (language === 'vi' ? 'Đã đưa ấn phẩm vào hàng đợi sinh metadata AI.' : 'AI metadata generation has been queued.'));
    } catch (error: any) {
      toast.error(error?.message || (language === 'vi' ? 'Không thể gửi yêu cầu AI. Hãy kiểm tra ấn phẩm đã có file nội dung chưa.' : 'Cannot send AI request. Please check that the publication has a document file.'));
    } finally {
      setRunningAiAction(null);
    }
  };

  // Handler cho pagination
  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  // Handler cho Enter key trong search box
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Hiển thị loading
  if (loading && books.length === 0) {
    return (
      <div className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
            <p className="mt-4 text-slate-600">{c.loadingData}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {c.title}
          </h1>
          <p className="text-slate-500">
            {c.subtitle}
          </p>
        </div>
        <Link
          to="/librarianpage/books/new"
          className="bg-secondary hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          <Plus size={20} /> {c.addBook}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: c.summaryTotal, value: summary.total, helper: c.books, icon: BookOpen, tone: 'blue', filter: 'all' as const },
          { label: c.summaryAi, value: `${summary.aiCompleted}/${summary.total || 0}`, helper: c.summaryAiSub, icon: CheckCircle, tone: 'emerald', filter: 'aiCompleted' as const },
          { label: c.summaryHasCopies, value: summary.hasCopies, helper: c.hasCopies, icon: BookOpen, tone: 'indigo', filter: 'hasCopies' as const },
          { label: c.summaryNoCopies, value: summary.noCopies, helper: c.noCopies, icon: AlertTriangle, tone: 'amber', filter: 'noCopies' as const },
          { label: c.summaryFiltered, value: summary.filtered, helper: c.books, icon: Search, tone: 'slate', filter: 'filtered' as const },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => applySummaryFilter(item.filter)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                item.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600'
                  : item.tone === 'indigo' ? 'bg-indigo-50 text-indigo-600'
                    : item.tone === 'amber' ? 'bg-amber-50 text-amber-600'
                      : item.tone === 'slate' ? 'bg-slate-100 text-slate-600'
                        : 'bg-blue-50 text-blue-600'
              }`}>
                <item.icon size={20} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4 relative">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
              {c.search}
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder={c.searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
              {c.category}
            </label>
            <Select
              isMulti
              options={categories.map(cat => ({ value: String(cat.id), label: cat.name || cat.categoryName || '' }))}
              value={categories
                .filter(cat => selectedCategoryIds.includes(String(cat.id)))
                .map(cat => ({ value: String(cat.id), label: cat.name || cat.categoryName || '' }))}
              onChange={(options) => {
                setSelectedCategoryIds((options as any[]).map(option => String(option.value)));
              }}
              isLoading={categoriesLoading}
              isClearable
              placeholder={c.categoryPlaceholder}
              className="text-sm"
              classNamePrefix="react-select"
              styles={selectStyles}
            />
          </div>
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
              {c.publicationYear}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                placeholder={c.yearFrom}
                className="px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                min="1000"
                max={new Date().getFullYear()}
                onKeyDown={handleKeyDown}
              />
              <input
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder={c.yearTo}
                className="px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                min="1000"
                max={new Date().getFullYear()}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
              {c.aiStatus}
            </label>
            <Select
              isMulti
              options={(Object.keys(AI_STATUS_CONFIG) as AiStatusKey[]).map(status => ({
                value: status,
                label: AI_STATUS_CONFIG[status].label[language],
              }))}
              value={selectedAiStatuses.map(status => ({
                value: status,
                label: AI_STATUS_CONFIG[status].label[language],
              }))}
              onChange={(options) => setSelectedAiStatuses((options as any[]).map(option => option.value as AiStatusKey))}
              isClearable
              placeholder={c.allAiStatuses}
              className="text-sm"
              classNamePrefix="react-select"
              styles={selectStyles}
            />
          </div>
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
              {c.sort}
            </label>
            <div className="grid grid-cols-[1fr_150px] gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.labels[language]}</option>
                ))}
              </select>
              <select
                value={direction}
                onChange={(e) => {
                  setDirection(e.target.value as 'ASC' | 'DESC');
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                <option value="DESC">{c.descending}</option>
                <option value="ASC">{c.ascending}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center border-t border-slate-100 pt-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="hasItemsFilter"
                checked={hasItems === undefined}
                onChange={() => setHasItems(undefined)}
                className="text-blue-600 focus:ring-blue-500"
              />
              {c.all}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="hasItemsFilter"
                checked={hasItems === true}
                onChange={() => setHasItems(true)}
                className="text-blue-600 focus:ring-blue-500"
              />
              {c.hasCopies}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="hasItemsFilter"
                checked={hasItems === false}
                onChange={() => setHasItems(false)}
                className="text-blue-600 focus:ring-blue-500"
              />
              {c.noCopies}
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearFilters}
              className="text-slate-500 text-sm font-medium hover:text-slate-700 px-3 py-2"
            >
              {c.clearFilters}
            </button>
            <button
              onClick={handleApplyFilters}
              className="bg-secondary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              {c.apply}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th
                className="px-6 py-4 font-semibold min-w-[110px] cursor-pointer hover:text-slate-700 select-none"
                onClick={() => handleSort('title')}
              >
                {c.tableTitle} {sortBy === 'title' && (direction === 'DESC' ? '↓' : '↑')}
              </th>
              <th
                className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700 select-none"
                onClick={() => handleSort('authorNames')}
              >
                {c.tableAuthor} {sortBy === 'authorNames' && (direction === 'DESC' ? '↓' : '↑')}
              </th>
              <th
                className="px-6 py-4 font-semibold w-24 cursor-pointer hover:text-slate-700 select-none"
                onClick={() => handleSort('publicationYear')}
              >
                {c.tableYear} {sortBy === 'publicationYear' && (direction === 'DESC' ? '↓' : '↑')}
              </th>
              <th
                className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700 select-none"
                onClick={() => handleSort('totalItems')}
              >
                {c.tableCount} {sortBy === 'totalItems' && (direction === 'DESC' ? '↓' : '↑')}
              </th>
              <th
                className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700 select-none"
                onClick={() => handleSort('createdAt')}
              >
                {c.tableCreated} {sortBy === 'createdAt' && (direction === 'DESC' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-4 font-semibold min-w-[150px]">{c.tableAiStatus}</th>
              <th className="px-4 py-4 font-semibold text-right min-w-[100px]">{c.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
                    <span className="ml-3 text-slate-600">{c.loading}</span>
                  </div>
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  {c.noData}
                </td>
              </tr>
            ) : (
              books.map((book) => (
                (() => {
                  const isAiBusy = runningAiAction?.id === book.id || book.aiProcessingStatus === 'QUEUED' || book.aiProcessingStatus === 'RUNNING';
                  const canGenerateMetadata = !!book.aiVectorsCount && book.aiVectorsCount > 0 && !isAiBusy;
                  return (
                <tr
                  key={book.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-4 min-w-[320px]">
                    <div className="flex items-start gap-4">
                      <Link
                        to={`/librarianpage/books/${book.id}`}
                        className={`w-10 h-14 rounded shadow-sm flex-shrink-0 block overflow-hidden ${
                          !book.thumbnail ? [
                            'bg-blue-500',
                            'bg-green-500',
                            'bg-orange-500',
                            'bg-pink-500',
                            'bg-cyan-500',
                          ][book.id] : ''
                        }`}
                      >
                        {book.thumbnail && (
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="w-full h-full object-cover block"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </Link>
                      <div>
                        <Link
                          to={`/librarianpage/books/${book.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 line-clamp-2"
                        >
                          {book.title}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 min-w-[220px]">
                    {book.author}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {book.year}
                  </td>
                  <td className="px-6 py-4 min-w-[110px]">
                    <div className="text-sm font-medium">
                      <span className="text-green-600">{book.availableCopies}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-900">{book.totalCopies}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 min-w-[150px]">
                    {book.createdAt ? new Date(book.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    }) : c.notAvailable}
                  </td>
                  <td className="px-6 py-4 min-w-[150px]">
                    <AiStatusBadge status={book.aiProcessingStatus} language={language} />
                    {book.aiVectorsCount != null && book.aiVectorsCount > 0 && (
                      <p className="mt-1 text-xs text-slate-500">{book.aiVectorsCount} vectors</p>
                    )}
                    {book.aiProcessingStatus === 'FAILED' && book.aiProcessingError && (
                      <p className="mt-1 max-w-[180px] truncate text-xs text-red-500" title={book.aiProcessingError}>
                        {book.aiProcessingError}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right min-w-[100px]">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/librarianpage/books/${book.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title={c.viewDetails}
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        to={`/librarianpage/books/${book.id}`}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title={c.edit}
                      >
                        <Edit2 size={18} />
                      </Link>
                      <Link
                        to="/librarianpage/copies/new"
                        state={{ publicationId: book.id }}
                        className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded"
                        title={c.addCopy}
                      >
                        <Plus size={18} />
                      </Link>
                      <button
                        type="button"
                        disabled={isAiBusy}
                        onClick={() => handleRunAiAction(book, 'vectorize')}
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded disabled:cursor-not-allowed disabled:opacity-40"
                        title={language === 'vi' ? 'Reset vector hóa sách' : 'Reset book vectorization'}
                      >
                        <RotateCcw size={18} className={runningAiAction?.id === book.id && runningAiAction.action === 'vectorize' ? 'animate-spin' : ''} />
                      </button>
                      <button
                        type="button"
                        disabled={!canGenerateMetadata}
                        onClick={() => handleRunAiAction(book, 'metadata')}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded disabled:cursor-not-allowed disabled:opacity-40"
                        title={language === 'vi' ? 'Sinh tag / summary / audience' : 'Generate tags / summary / audience'}
                      >
                        <Star size={18} className={runningAiAction?.id === book.id && runningAiAction.action === 'metadata' ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
          <span className="text-sm text-slate-500">
            {c.showing} {totalElements === 0 ? 0 : currentPage * pageSize + 1}-
            {Math.min((currentPage + 1) * pageSize, totalElements)} {c.inTotal}{' '}
            {totalElements} {c.books}
          </span>
          <div className="flex items-center gap-1">
            {/* Previous button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>

            {/* Page numbers */}
            {totalPages > 0 && (
              <>
                {/* First page */}
                {currentPage > 2 && (
                  <>
                    <button
                      onClick={() => handlePageChange(0)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-sm"
                    >
                      1
                    </button>
                    {currentPage > 3 && (
                      <span className="text-slate-400 px-1">...</span>
                    )}
                  </>
                )}

                {/* Pages around current page */}
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter(
                    (page) =>
                      page >= currentPage - 2 &&
                      page <= currentPage + 2 &&
                      page >= 0 &&
                      page < totalPages
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                        currentPage === page
                          ? 'bg-secondary text-white'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 3 && (
                  <>
                    {currentPage < totalPages - 4 && (
                      <span className="text-slate-400 px-1">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(totalPages - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-sm"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Next button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookList;
