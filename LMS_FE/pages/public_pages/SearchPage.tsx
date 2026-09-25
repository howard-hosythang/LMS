import {
  BookOpen,
  CheckCircle,
  Filter,
  LayoutGrid,
  List,
  Search,
  Users,
  X,
} from 'lucide-react';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import publicationsService from '../../api/publicationsService';
import { Category, PageResponse, PublicSearchResult } from '../../api/publicationTypes';
import searchHistoryService, { SearchHistoryItem } from '../../api/searchHistoryService';
import { useAuth } from '../../contexts/AuthContext';
import { Badge, Button } from '../../components/ui';
import categoriesService from '../../api/categoriesService';
import { useTranslation } from '../../contexts/LanguageContext';

const BRANCHES = [
  { value: '', label: 'Tất cả cơ sở' },
  { value: 'Cơ sở 1 - Lý Thường Kiệt', label: 'Cơ sở 1 - Lý Thường Kiệt' },
  { value: 'Cơ sở 2 - Dĩ An', label: 'Cơ sở 2 - Dĩ An' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Liên quan nhất', labelEn: 'Most relevant' },
  { value: 'newest', label: 'Mới nhất', labelEn: 'Newest' },
  { value: 'most_borrowed', label: 'Mượn nhiều nhất', labelEn: 'Most borrowed' },
  { value: 'most_viewed', label: 'Xem nhiều nhất', labelEn: 'Most viewed' },
];

const SEARCH_VIEW_MODE_KEY = 'library74.searchViewMode.v1';

type FilterState = {
  available: boolean;
  language: string;
  yearFrom: string;
  yearTo: string;
  branch: string;
  categoryIds: string[];
  sortBy: string;
};

const normalizeSort = (value: string | null) => {
  if (value === 'popular') return 'most_borrowed';
  return value || 'relevance';
};

const parseCategoryIds = (params: URLSearchParams) => {
  const categoryIds = params.getAll('categoryIds').flatMap(value => value.split(','));
  const legacyCategoryId = params.get('categoryId');
  return Array.from(new Set([...categoryIds, legacyCategoryId].filter(Boolean))) as string[];
};

const getCategoryName = (category: Category) =>
  category.name || category.categoryName || 'Danh mục chưa đặt tên';

const toSearchResult = (detail: any): PublicSearchResult => ({
  publicationId: String(detail.publication.id),
  title: detail.publication.title,
  coverImageUrl: detail.publication.coverImageUrl ?? null,
  publicationYear: detail.publication.publicationYear ?? null,
  language: detail.publication.language ?? null,
  description: detail.publication.aiSummary || detail.publication.description || null,
  publisherName: detail.publisher?.name ?? null,
  authorNames: (detail.authors ?? []).map((author: any) => author.name).join(', ') || null,
  categoryNames: (detail.categories ?? []).map((category: any) => category.name).join(', ') || null,
  tagNames: (detail.tags ?? []).map((tag: any) => tag.name).join(', ') || null,
  totalItems: detail.items?.totalItems ?? detail.publication.totalItems ?? 0,
  availableItems: detail.items?.totalAvailableItems ?? detail.publication.availableItems ?? 0,
  avgRating: detail.ratings?.averageRating ?? 0,
  borrowCount: detail.publication.borrowCount ?? 0,
  viewCount: detail.publication.viewCount ?? 0,
});

const sortResults = (items: PublicSearchResult[], sortBy: string) => {
  const sorted = [...items];
  switch (sortBy) {
    case 'relevance':
      return sorted;
    case 'rating':
      return sorted.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    case 'title_az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    case 'most_borrowed':
      return sorted.sort((a, b) => (b.borrowCount ?? 0) - (a.borrowCount ?? 0));
    case 'most_viewed':
      return sorted.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    case 'newest':
    default:
      return sorted.sort((a, b) => (b.publicationYear ?? 0) - (a.publicationYear ?? 0));
  }
};

const SearchPage = () => {
  const { language: uiLanguage, t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { userType } = useAuth();
  const canUseSearchHistory = () => Boolean(userType || localStorage.getItem('accessToken'));
  const prefix = useMemo(
    () => {
      if (location.pathname.startsWith('/librarianpage/public')) return '/librarianpage/public';
      return location.pathname.startsWith('/userpage') ? '/userpage' : '/publicpage';
    },
    [location.pathname]
  );

  // Search state
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return localStorage.getItem(SEARCH_VIEW_MODE_KEY) === 'list' ? 'list' : 'grid';
  });

  // Filter state
  const [available, setAvailable] = useState(false);
  const [language, setLanguage] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [branch, setBranch] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>(() => parseCategoryIds(searchParams));
  const [sortBy, setSortBy] = useState(() => normalizeSort(searchParams.get('sort')));
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => ({
    available: false,
    language: '',
    yearFrom: '',
    yearTo: '',
    branch: '',
    categoryIds: parseCategoryIds(searchParams),
    sortBy: normalizeSort(searchParams.get('sort')),
  }));
  const [page, setPage] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoriesService.getAllCategories()
      .then(res => setCategories(res.data ?? []))
      .catch(() => {});
  }, []);

  // Results
  const [result, setResult] = useState<PageResponse<PublicSearchResult> | null>(null);
  const [loading, setLoading] = useState(false);
  const pageSize = viewMode === 'list' ? 10 : 12;

  // Search suggestions
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced fetch suggestions khi gõ
  const fetchSuggestions = useMemo(() =>
    debounce((kw: string) => {
      if (!canUseSearchHistory()) return;
      searchHistoryService.getHistory(kw || undefined)
        .then(res => setHistory(res.data ?? []))
        .catch(() => {});
    }, 300),
  [userType]);

  useEffect(() => () => fetchSuggestions.cancel(), [fetchSuggestions]);

  // Khi inputValue thay đổi → fetch suggestions
  useEffect(() => {
    if (showSuggestions) fetchSuggestions(inputValue);
  }, [inputValue, showSuggestions]);

  // Fetch recent khi focus lần đầu
  const handleInputFocus = () => {
    setShowSuggestions(true);
    if (!canUseSearchHistory()) return;
    searchHistoryService.getHistory()
      .then(res => setHistory(res.data ?? []))
      .catch(() => {});
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active keyword (only updates on submit)
  const [activeKeyword, setActiveKeyword] = useState(() => searchParams.get('q') ?? '');

  const currentDraftFilters = (): FilterState => ({
    available,
    language,
    yearFrom,
    yearTo,
    branch,
    categoryIds,
    sortBy,
  });

  const syncFilterParams = (filters: FilterState, keyword = activeKeyword) => {
    const p = new URLSearchParams(searchParams);
    keyword ? p.set('q', keyword) : p.delete('q');
    p.delete('categoryId');
    p.delete('categoryIds');
    filters.categoryIds.forEach(id => p.append('categoryIds', id));
    filters.sortBy === 'relevance' ? p.delete('sort') : p.set('sort', filters.sortBy);
    setSearchParams(p, { replace: true });
  };

  const doSearch = (kw: string, pg = 0, filters: FilterState = appliedFilters) => {
    setLoading(true);
    setShowSuggestions(false);
    if (kw.trim() && canUseSearchHistory()) {
      searchHistoryService.saveHistory(kw.trim())
        .then(() => searchHistoryService.getHistory().then(r => setHistory(r.data ?? [])))
        .catch(() => {});
    }
    publicationsService.searchPublications({
      keyword: kw || undefined,
      available: filters.available || undefined,
      language: filters.language || undefined,
      yearFrom: filters.yearFrom ? Number(filters.yearFrom) : undefined,
      yearTo: filters.yearTo ? Number(filters.yearTo) : undefined,
      branch: filters.branch || undefined,
      categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
      sortBy: filters.sortBy === 'relevance' ? 'newest' : filters.sortBy,
      page: pg,
      size: pageSize,
    })
      .then(res => setResult(res.data))
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  };

  const applyClientFilters = (items: PublicSearchResult[], filters: FilterState) => {
    let content = [...items];
    if (filters.available) {
      content = content.filter(item => item.availableItems > 0);
    }
    if (filters.language) {
      content = content.filter(item => item.language === filters.language);
    }
    if (filters.yearFrom) {
      content = content.filter(item => (item.publicationYear ?? 0) >= Number(filters.yearFrom));
    }
    if (filters.yearTo) {
      content = content.filter(item => (item.publicationYear ?? 0) <= Number(filters.yearTo));
    }
    if (filters.categoryIds.length > 0) {
      const selectedCategoryNames = categories
        .filter(category => filters.categoryIds.includes(String(category.id)))
        .map(getCategoryName);
      if (selectedCategoryNames.length > 0) {
        content = content.filter(item =>
          selectedCategoryNames.some(categoryName => item.categoryNames?.includes(categoryName))
        );
      }
    }
    return content;
  };

  const setPagedClientResult = (content: PublicSearchResult[], pg: number) => {
    const totalElements = content.length;
    const totalPages = Math.ceil(totalElements / pageSize);
    const pageContent = content.slice(pg * pageSize, pg * pageSize + pageSize);

    setResult({
      content: pageContent,
      totalElements,
      totalPages,
      currentPage: pg,
      pageSize,
      isFirst: pg === 0,
      isLast: pg >= totalPages - 1,
    });
  };

  const doHybridSearch = async (kw: string, pg = 0, filters: FilterState = appliedFilters) => {
    const normalizedKeyword = kw.trim();
    if (!normalizedKeyword) {
      doSearch('', pg, filters);
      return;
    }

    setLoading(true);
    setShowSuggestions(false);
    if (canUseSearchHistory()) {
      searchHistoryService.saveHistory(normalizedKeyword)
        .then(() => searchHistoryService.getHistory().then(r => setHistory(r.data ?? [])))
        .catch(() => {});
    }

    try {
      const [semanticResult, lexicalResult] = await Promise.allSettled([
        publicationsService.semanticSearch(normalizedKeyword, 50),
        publicationsService.searchPublications({
          keyword: normalizedKeyword,
          available: filters.available || undefined,
          language: filters.language || undefined,
          yearFrom: filters.yearFrom ? Number(filters.yearFrom) : undefined,
          yearTo: filters.yearTo ? Number(filters.yearTo) : undefined,
          branch: filters.branch || undefined,
          categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
          sortBy: filters.sortBy === 'relevance' ? 'newest' : filters.sortBy,
          page: 0,
          size: 50,
        }),
      ]);
      const lexicalItems = lexicalResult.status === 'fulfilled'
        ? lexicalResult.value.data?.content ?? []
        : [];
      const publicationIds = semanticResult.status === 'fulfilled'
        ? (semanticResult.value.data?.publicationIds ?? []).map(String)
        : [];
      const detailResponses = await Promise.all(
        publicationIds.map(id =>
          publicationsService.getPublicationById(id)
            .then(res => res.data)
            .catch(() => null)
        )
      );

      const semanticItems = detailResponses
        .filter(Boolean)
        .map(detail => toSearchResult(detail));

      const semanticIds = new Set(semanticItems.map(item => String(item.publicationId)));
      let content = [
        ...semanticItems,
        ...lexicalItems.filter(item => !semanticIds.has(String(item.publicationId))),
      ];

      content = sortResults(applyClientFilters(content, filters), filters.sortBy);
      setPagedClientResult(content, pg);
    } catch {
      doSearch(normalizedKeyword, pg, filters);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when the applied filters/page change
  useEffect(() => {
    doHybridSearch(activeKeyword, page, appliedFilters);
  }, [activeKeyword, page, appliedFilters, categories, pageSize]);

  const handleSearch = () => {
    const kw = inputValue.trim();
    setActiveKeyword(kw);
    setPage(0);
    const p = new URLSearchParams(searchParams);
    kw ? p.set('q', kw) : p.delete('q');
    setSearchParams(p, { replace: true });
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem(SEARCH_VIEW_MODE_KEY, mode);
    setPage(0);
  };

  const handleApplyFilters = () => {
    const filters = currentDraftFilters();
    setAppliedFilters(filters);
    setPage(0);
    syncFilterParams(filters);
  };

  const handleClearFilters = () => {
    const cleared: FilterState = {
      available: false,
      language: '',
      yearFrom: '',
      yearTo: '',
      branch: '',
      categoryIds: [],
      sortBy: 'relevance',
    };
    setAvailable(false);
    setLanguage('');
    setYearFrom('');
    setYearTo('');
    setBranch('');
    setCategoryIds([]);
    setSortBy('relevance');
    setAppliedFilters(cleared);
    setPage(0);
    const p = new URLSearchParams(searchParams);
    p.delete('categoryId');
    p.delete('categoryIds');
    p.delete('sort');
    setSearchParams(p, { replace: true });
  };

  const items = result?.content ?? [];
  const total = result?.totalElements ?? 0;
  const totalPages = result?.totalPages ?? 0;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow flex flex-col">
              <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onFocus={handleInputFocus}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch();
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                placeholder={t('home.searchPlaceholder')}
                className="block w-full pl-10 pr-28 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                {inputValue && (
                  <button onClick={() => setInputValue('')} className="p-1.5 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 ml-1 mr-0.5"
                >
                  {t('common.search')}
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && history.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 text-xs text-gray-400 font-medium border-b border-gray-100">
                    {uiLanguage === 'en' ? 'Recent searches' : 'Tìm kiếm gần đây'}
                  </div>
                  {history.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                      onMouseDown={() => {
                        setInputValue(item.keyword);
                        setActiveKeyword(item.keyword);
                        setPage(0);
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Search size={13} className="text-gray-400 flex-shrink-0" />
                        {item.keyword}
                      </div>
                      <button
                        onMouseDown={e => {
                          e.stopPropagation();
                          setHistory(prev => prev.filter(h => h.id !== item.id));
                          searchHistoryService.deleteHistory(item.id).catch(() => {});
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Filter size={18} className="mr-2" /> {uiLanguage === 'en' ? 'Filters' : 'Bộ lọc'}
              </h3>
              <button onClick={handleClearFilters} className="text-xs text-blue-600 hover:underline">
                {uiLanguage === 'en' ? 'Clear all' : 'Xoá tất cả'}
              </button>
            </div>

            {/* Sắp xếp */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">{uiLanguage === 'en' ? 'Sort by' : 'Sắp xếp'}</h4>
              <div className="space-y-2">
                {SORT_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value={opt.value}
                      checked={sortBy === opt.value}
                      onChange={() => setSortBy(opt.value)}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{uiLanguage === 'en' ? opt.labelEn : opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tình trạng */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">{uiLanguage === 'en' ? 'Availability' : 'Tình trạng'}</h4>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={e => setAvailable(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{uiLanguage === 'en' ? 'Available copies only' : 'Có bản khả dụng'}</span>
              </label>
            </div>

            {/* Chủ đề */}
            {categories.length > 0 && (
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">{t('nav.categories')}</h4>
                  <Link to={`${prefix}/categories`} className="text-xs text-blue-600 hover:underline">
                    {t('common.viewAll')}
                  </Link>
                </div>
                <div className="space-y-2 mb-3">
                  {categories.slice(0, 6).map(category => (
                    <label key={category.id} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        value={category.id}
                        checked={categoryIds.includes(String(category.id))}
                        onChange={e => {
                          const id = String(category.id);
                          setCategoryIds(prev => e.target.checked ? [...prev, id] : prev.filter(item => item !== id));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 line-clamp-1">
                        {getCategoryName(category)}
                      </span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCategoryIds([])}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    {uiLanguage === 'en' ? 'All categories' : 'Tất cả danh mục'}
                  </button>
                </div>
                <select
                  value=""
                  onChange={e => {
                    const id = e.target.value;
                    if (id) setCategoryIds(prev => prev.includes(id) ? prev : [...prev, id]);
                  }}
                  className="w-full border border-gray-300 rounded-md text-sm px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{uiLanguage === 'en' ? 'Add another category...' : 'Thêm danh mục khác...'}</option>
                  {categories.filter(c => !categoryIds.includes(String(c.id))).map(c => (
                    <option key={c.id} value={c.id}>{getCategoryName(c)}</option>
                  ))}
                </select>
                {categoryIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {categoryIds.map(id => {
                      const category = categories.find(c => String(c.id) === id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCategoryIds(prev => prev.filter(item => item !== id))}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                        >
                          {category ? getCategoryName(category) : id}
                          <X size={12} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Cơ sở */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">{uiLanguage === 'en' ? 'Campus' : 'Cơ sở'}</h4>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full border border-gray-300 rounded-md text-sm px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                {BRANCHES.map(b => (
                  <option key={b.value} value={b.value}>
                    {uiLanguage === 'en' && !b.value ? 'All campuses' : b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Năm xuất bản */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">{uiLanguage === 'en' ? 'Publication year' : 'Năm xuất bản'}</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={yearFrom}
                  onChange={e => setYearFrom(e.target.value)}
                  placeholder={uiLanguage === 'en' ? 'From' : 'Từ'}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  value={yearTo}
                  onChange={e => setYearTo(e.target.value)}
                  placeholder={uiLanguage === 'en' ? 'To' : 'Đến'}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Ngôn ngữ */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">{t('common.language')}</h4>
              <div className="space-y-2">
                {[
                  { value: '', label: uiLanguage === 'en' ? 'All' : 'Tất cả' },
                  { value: 'Vietnamese', label: t('common.vietnamese') },
                  { value: 'English', label: t('common.english') },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value={opt.value}
                      checked={language === opt.value}
                      onChange={() => setLanguage(opt.value)}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button fullWidth variant="primary" onClick={handleApplyFilters}>
              {uiLanguage === 'en' ? 'Apply filters' : 'Áp dụng bộ lọc'}
            </Button>
          </div>

          {/* Main Results */}
          <div className="flex-grow min-w-0">
            {/* Controls & Count */}
            <div className="flex flex-col gap-4 mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {loading ? (uiLanguage === 'en' ? 'Searching...' : 'Đang tìm...') : (
                  total > 0
                    ? `${total} ${uiLanguage === 'en' ? 'results' : 'kết quả'}${activeKeyword ? ` ${uiLanguage === 'en' ? 'for' : 'cho'} "${activeKeyword}"` : ''}`
                    : (uiLanguage === 'en' ? 'No results' : 'Không có kết quả')
                )}
              </h2>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  {uiLanguage === 'en' ? 'View' : 'Hiển thị'}
                </span>
                <div className="grid grid-cols-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('grid')}
                  title={uiLanguage === 'en' ? 'Grid view' : 'Dạng lưới'}
                  aria-label={uiLanguage === 'en' ? 'Grid view' : 'Dạng lưới'}
                  aria-pressed={viewMode === 'grid'}
                  className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span>{uiLanguage === 'en' ? 'Grid' : 'Lưới'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('list')}
                  title={uiLanguage === 'en' ? 'List view' : 'Dạng danh sách'}
                  aria-label={uiLanguage === 'en' ? 'List view' : 'Dạng danh sách'}
                  aria-pressed={viewMode === 'list'}
                  className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <List size={16} />
                  <span>{uiLanguage === 'en' ? 'List' : 'Danh sách'}</span>
                </button>
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              </div>
            )}

            {/* Empty */}
            {!loading && items.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">{uiLanguage === 'en' ? 'No matching results found' : 'Không tìm thấy kết quả phù hợp'}</p>
                <p className="text-gray-400 text-sm mt-1">{uiLanguage === 'en' ? 'Try changing your keyword or filters' : 'Thử thay đổi từ khoá hoặc bộ lọc'}</p>
              </div>
            )}

            {/* Results */}
            {!loading && items.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(item => (
                  <SearchGridCard key={item.publicationId} item={item} prefix={prefix} />
                ))}
              </div>
            )}
            {!loading && items.length > 0 && viewMode === 'list' && (
              <div className="space-y-4">
                {items.map(item => (
                  <SearchListCard key={item.publicationId} item={item} prefix={prefix} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-10 flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  &lt;
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = page < 3 ? i : page - 2 + i;
                  if (pg >= totalPages) return null;
                  return (
                    <Button
                      key={pg}
                      size="sm"
                      variant={pg === page ? 'primary' : 'outline'}
                      onClick={() => setPage(pg)}
                    >
                      {pg + 1}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  &gt;
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchListCard = ({ item, prefix }: { item: PublicSearchResult; prefix: string }) => {
  const { language: uiLanguage, t } = useTranslation();

  return (
  <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-5 hover:shadow-lg transition-all duration-300 group sm:flex-row">
    <Link to={`${prefix}/book/${item.publicationId}`} className="h-56 w-full flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden shadow-sm sm:h-48 sm:w-32">
      {item.coverImageUrl ? (
        <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen size={32} className="text-gray-300" />
        </div>
      )}
    </Link>
    <div className="flex-grow flex flex-col justify-between min-w-0">
      <div>
        <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 mb-1 leading-tight">
          <Link to={`${prefix}/book/${item.publicationId}`}>{item.title}</Link>
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {[item.authorNames, item.publicationYear, item.publisherName].filter(Boolean).join(' • ')}
        </p>
        {item.categoryNames && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700">{uiLanguage === 'en' ? 'Categories:' : 'Danh mục:'}</span>
            {item.categoryNames.split(', ').slice(0, 3).map(cat => (
              <Badge key={cat} variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        )}
        {item.tagNames && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700">{uiLanguage === 'en' ? 'Tags:' : 'Thẻ tag:'}</span>
            {item.tagNames.split(', ').slice(0, 4).map(tag => (
              <Badge key={tag} variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-100 pt-3 mt-3 gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center text-gray-600 font-medium bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
            <Users size={14} className="mr-1.5" /> {item.borrowCount ?? 0} {uiLanguage === 'en' ? 'borrows' : 'lượt mượn'}
          </span>
          {item.availableItems > 0 ? (
            <span className="flex items-center text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
              <CheckCircle size={14} className="mr-1.5" /> {item.availableItems}/{item.totalItems} {uiLanguage === 'en' ? 'available' : 'khả dụng'}
            </span>
          ) : (
            <span className="flex items-center text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <X size={14} className="mr-1.5" /> {uiLanguage === 'en' ? 'Out of stock' : 'Hết sách'}
            </span>
          )}
        </div>
        <Link to={`${prefix}/book/${item.publicationId}`}>
          <Button variant="outline" size="sm">{t('common.viewDetails')}</Button>
        </Link>
      </div>
    </div>
  </div>
  );
};

const SearchGridCard = ({ item, prefix }: { item: PublicSearchResult; prefix: string }) => {
  const { language: uiLanguage } = useTranslation();

  return (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col min-h-[430px]">
    <Link to={`${prefix}/book/${item.publicationId}`} className="h-56 bg-gray-100 overflow-hidden block">
      {item.coverImageUrl ? (
        <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen size={40} className="text-gray-300" />
        </div>
      )}
    </Link>
    <div className="p-4 flex flex-col flex-1">
      <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-1 hover:text-blue-600">
        <Link to={`${prefix}/book/${item.publicationId}`}>{item.title}</Link>
      </h3>
      <p className="text-xs text-gray-500 line-clamp-1 mb-2">{item.authorNames}</p>
      {item.categoryNames && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-700">{uiLanguage === 'en' ? 'Categories:' : 'Danh mục:'}</span>
          {item.categoryNames.split(', ').slice(0, 2).map(cat => (
            <Badge key={cat} variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 text-xs">
              {cat}
            </Badge>
          ))}
        </div>
      )}
      {item.tagNames && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-700">{uiLanguage === 'en' ? 'Tags:' : 'Thẻ tag:'}</span>
          {item.tagNames.split(', ').slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100 text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {item.description && (
        <p className="mb-3 text-xs text-gray-600 line-clamp-3 leading-relaxed">{item.description}</p>
      )}
      <div className="mt-auto flex items-center justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="inline-flex items-center text-xs text-gray-600">
            <Users size={12} className="mr-1" /> {item.borrowCount ?? 0} {uiLanguage === 'en' ? 'borrows' : 'lượt mượn'}
          </span>
          {item.availableItems > 0 ? (
            <span className="text-xs text-green-700 font-medium">{item.availableItems} {uiLanguage === 'en' ? 'available' : 'khả dụng'}</span>
          ) : (
            <span className="text-xs text-red-500 font-medium">{uiLanguage === 'en' ? 'Out of stock' : 'Hết sách'}</span>
          )}
        </div>
        <Link to={`${prefix}/book/${item.publicationId}`}>
          <Button variant="outline" size="sm" className="text-xs py-1">{uiLanguage === 'en' ? 'Details' : 'Chi tiết'}</Button>
        </Link>
      </div>
    </div>
  </div>
  );
};

export default SearchPage;
