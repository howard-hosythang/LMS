import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Heart,
  Layers,
  List,
  MessageSquare,
  PenTool,
  Printer,
  Send,
  Share2,
  Sparkles,
  Star,
  ThumbsUp,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  Button,
  StarRating,
} from '../../components/ui';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import publicationsService from '../../api/publicationsService';
import transactionsService from '../../api/transactionsService';
import { createReservation } from '../../api/reservationService';
import wishlistService from '../../api/wishlistService';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation, type Language } from '../../contexts/LanguageContext';
import { PublicationDetailResponse, PaginatedPublicationItems, PaginatedPublicationRatings, PublicationRatingSummary } from '../../api/publicationTypes';
import type { RecommendedPublication } from '../../api/recommendationService';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import { formatReviewerAcademicLine } from '../../utils/reviewerMeta';
import Seo from '../../components/Seo';

// --- Sub-components for Tabs ---

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );

const localeOf = (language: Language) => language === 'en' ? 'en-US' : 'vi-VN';

type TocEntry = { level: number | null; title: string; pageNum: string | null };

type TocGroup = { entry: TocEntry; chapterIdx: number; children: TocEntry[] };

const REVIEW_TAGS = [
  { vi: 'Đáng đọc', en: 'Worth reading', tone: 'positive' },
  { vi: 'Dễ áp dụng', en: 'Practical', tone: 'positive' },
  { vi: 'Ví dụ rõ ràng', en: 'Clear examples', tone: 'positive' },
  { vi: 'Nội dung cập nhật', en: 'Up to date', tone: 'positive' },
  { vi: 'Phù hợp sinh viên', en: 'Student-friendly', tone: 'positive' },
  { vi: 'Truyền cảm hứng', en: 'Inspiring', tone: 'positive' },
  { vi: 'Nền tảng tốt', en: 'Strong fundamentals', tone: 'positive' },
  { vi: 'Nhiều lý thuyết', en: 'Theory-heavy', tone: 'neutral' },
  { vi: 'Khó hiểu', en: 'Hard to follow', tone: 'critical' },
  { vi: 'Cần đọc kèm tài liệu khác', en: 'Needs companion reading', tone: 'neutral' },
] as const;

const formatReviewComment = (tags: string[], comment: string) => {
  const normalizedComment = comment.trim();
  if (tags.length === 0) return normalizedComment;
  return `Nhãn: ${tags.join(', ')}\n\n${normalizedComment}`;
};

const LABELS: Record<string, Record<string, string>> = {
  publicationFormat: {
    PRINT_BOOK: 'Sách in',
    PHOTOCOPY: 'Bản photo',
    EBOOK: 'Sách điện tử',
    THESIS: 'Luận văn / đồ án',
    REFERENCE: 'Tài liệu tham khảo',
    OTHER: 'Khác',
  },
  copyType: {
    ORIGINAL: 'Bản gốc',
    PHOTOCOPY: 'Bản photo',
    REPRINT: 'Bản tái bản/in lại',
    DIGITAL_PRINT: 'Bản in kỹ thuật số',
    OTHER: 'Khác',
  },
  bindingType: {
    HARDCOVER: 'Bìa cứng',
    PAPERBACK: 'Bìa mềm',
    SPIRAL: 'Đóng lò xo',
    STAPLED: 'Đóng ghim',
    LOOSE_LEAF: 'Tờ rời',
    UNKNOWN: 'Chưa rõ',
    OTHER: 'Khác',
  },
  condition: {
    NEW: 'Mới',
    GOOD: 'Tốt',
    OLD: 'Cũ',
    WORN: 'Mòn nhẹ',
    DAMAGED: 'Hư hỏng',
  },
};

const labelOf = (group: keyof typeof LABELS, value?: string | null) =>
  value ? LABELS[group][value] || value : 'N/A';

const TAG_COLORS = [
  { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' },
  { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' },
  { backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#b45309' },
  { backgroundColor: '#fdf2f8', borderColor: '#fbcfe8', color: '#be185d' },
  { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe', color: '#6d28d9' },
  { backgroundColor: '#ecfeff', borderColor: '#a5f3fc', color: '#0e7490' },
  { backgroundColor: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' },
  { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#334155' },
];

const tagColor = (tag: string) => {
  const hash = Array.from(tag).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
};

const TocRow = ({
  title, pageNum, depth, index, isChapter, pageLabel,
}: {
  title: string; pageNum?: string | null; depth: number; index?: number; isChapter?: boolean; pageLabel: string;
}) => (
  <div
    className={`flex items-baseline gap-2 py-2 group ${
      depth === 0
        ? 'border-b border-gray-100 last:border-0'
        : 'border-b border-gray-50 last:border-0'
    }`}
    style={{ paddingLeft: depth > 0 ? `${depth * 20 + 12}px` : undefined }}
  >
    {isChapter && index !== undefined && (
      <span className="text-xs font-semibold text-indigo-400 w-6 flex-shrink-0 tabular-nums">
        {index}.
      </span>
    )}
    {!isChapter && (
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0 mt-1.5" />
    )}
    <span
      className={`flex-1 min-w-0 text-sm leading-snug ${
        depth === 0
          ? 'font-medium text-gray-800'
          : 'text-gray-500'
      }`}
    >
      {title}
    </span>
    {pageNum && pageNum.trim() !== '' && (
      <>
        <span className="flex-1 border-b border-dotted border-gray-200 mb-1 mx-2 min-w-[16px]" />
        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 tabular-nums">
          {pageLabel}&nbsp;{pageNum}
        </span>
      </>
    )}
  </div>
);

const TocSection = ({ group }: { group: TocGroup }) => {
  const [open, setOpen] = useState(true);
  const { t } = useTranslation();
  const hasChildren = group.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 ${hasChildren ? 'cursor-pointer select-none' : ''}`}
        onClick={hasChildren ? () => setOpen(o => !o) : undefined}
      >
        {hasChildren && (
          <span className="text-gray-300 flex-shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <ChevronRight size={14} />
          </span>
        )}
        <div className={`flex-1 ${hasChildren ? '-ml-0' : 'ml-5'}`}>
          <TocRow
            title={group.entry.title}
            pageNum={group.entry.pageNum}
            depth={0}
            index={group.chapterIdx}
            isChapter
            pageLabel={t('bookDetail.pageShort')}
          />
        </div>
      </div>

      {hasChildren && open && (
        <div className="ml-5">
          {group.children.map((child, i) => (
            <TocRow
              key={i}
              title={child.title}
              pageNum={child.pageNum}
              depth={child.level ?? 1}
              pageLabel={t('bookDetail.pageShort')}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TocTab = ({ raw }: { raw: string | null }) => {
  const { t } = useTranslation();
  if (!raw) return (
    <div className="text-center py-16 text-gray-400">
      <List size={40} className="mx-auto mb-3 opacity-40" />
      <p className="text-sm">{t('bookDetail.noToc')}</p>
    </div>
  );

  let entries: TocEntry[] = [];
  try {
    const parsed = JSON.parse(raw);
    entries = Array.isArray(parsed) ? parsed : [];
  } catch {
    return <p className="text-sm text-red-500">{t('bookDetail.invalidToc')}</p>;
  }
  if (!entries.length) return (
    <div className="text-center py-16 text-gray-400">
      <List size={40} className="mx-auto mb-3 opacity-40" />
      <p className="text-sm">{t('bookDetail.noToc')}</p>
    </div>
  );

  // Group: level-0 entries become chapter headers, subsequent non-0 entries become children
  const groups: TocGroup[] = [];
  let chapterNum = 0;
  for (const entry of entries) {
    const lvl = entry.level ?? 0;
    if (lvl === 0) {
      chapterNum++;
      groups.push({ entry, chapterIdx: chapterNum, children: [] });
    } else if (groups.length > 0) {
      groups[groups.length - 1].children.push(entry);
    } else {
      // sub-entry before any level-0 — treat as standalone chapter
      chapterNum++;
      groups.push({ entry: { ...entry, level: 0 }, chapterIdx: chapterNum, children: [] });
    }
  }

  const hasAnyPage = entries.some(e => e.pageNum && e.pageNum.trim() !== '');

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900">
          {t('bookDetail.toc')}
          <span className="ml-2 text-xs font-normal text-gray-400">({chapterNum} {t('bookDetail.chapters')})</span>
        </h3>
        {!hasAnyPage && (
          <span className="text-xs text-gray-400 italic">{t('bookDetail.noPageNumber')}</span>
        )}
      </div>

      <div className="space-y-0">
        {groups.map((group, i) => (
          <TocSection key={i} group={group} />
        ))}
      </div>
    </div>
  );
};

const OverviewTab = ({ data }: { data: PublicationDetailResponse }) => {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in">
      <div className="mb-10 max-w-4xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('bookDetail.description')}</h3>
        <div className="text-gray-700 text-sm leading-7 space-y-4 text-justify whitespace-pre-line">
          {data.publication.description || t('bookDetail.noDescription')}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
          {t('bookDetail.publicationInfo')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
          <div className="col-span-1">
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">ISBN</span>
            <span className="font-medium text-gray-900">{data.publication.isbn || 'N/A'}</span>
          </div>
          {data.publication.callNumber && (
            <div className="col-span-1">
              <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
                {t('bookDetail.callNumber')}
              </span>
              <span className="font-medium text-gray-900 font-mono">{data.publication.callNumber}</span>
            </div>
          )}
          <div className="col-span-1">
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
              {t('bookDetail.pages')}
            </span>
            <span className="font-medium text-gray-900">
              {data.publication.numberOfPages ? `${data.publication.numberOfPages} ${t('bookDetail.pageUnit')}` : 'N/A'}
            </span>
          </div>
          <div className="col-span-1">
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
              {t('bookDetail.edition')}
            </span>
            <span className="font-medium text-gray-900">
              {data.publication.edition ? fill(t('bookDetail.editionValue'), { edition: data.publication.edition }) : 'N/A'}
            </span>
          </div>
          <div className="col-span-1">
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
              Loại tài liệu
            </span>
            <span className="font-medium text-gray-900">
              {labelOf('publicationFormat', data.publication.publicationFormat)}
            </span>
          </div>
          <div className="col-span-1">
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
              {t('bookDetail.publicationYear')}
            </span>
            <span className="font-medium text-gray-900">{data.publication.publicationYear || 'N/A'}</span>
          </div>

          <div className="col-span-1">
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
              {t('bookDetail.publisher')}
            </span>
            <span className="font-medium text-gray-900">
              {data.publisher?.name || 'N/A'}
            </span>
          </div>
          <div className="col-span-1">
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
              {t('bookDetail.language')}
            </span>
            <span className="font-medium text-gray-900">{data.publication.language || 'N/A'}</span>
          </div>
          <div className="col-span-1">
            <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
              {t('bookDetail.sizeWeight')}
            </span>
            <span className="font-medium text-gray-900">
              {data.publication.size || '?'} / {data.publication.weight ? `${data.publication.weight}kg` : '?'}
            </span>
          </div>
          {data.publication.editionNote && (
            <div className="col-span-2">
              <span className="block text-xs text-gray-500 uppercase font-semibold mb-1">
                Ghi chú ấn bản
              </span>
              <span className="font-medium text-gray-900">{data.publication.editionNote}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const ReviewBar = ({ star, count, total }: { star: number; count: number; total: number }) => {
  const percentage = (count / total) * 100 || 0;
  return (
    <div className="flex items-center text-sm mb-2">
      <span className="w-12 text-gray-600 font-medium flex items-center">
        {star} <Star size={12} className="ml-1 fill-gray-400 text-gray-400" />
      </span>
      <div className="flex-grow mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="w-8 text-right text-gray-500 text-xs">{count}</span>
    </div>
  );
};

const ReviewsTab = ({
  publicationId,
  ratingsData,
  summaryData,
  isLoading,
  onPageChange,
  onFilterChange,
  onRefresh,
  averageRating,
  totalRatings,
  userType,
  starFilter,
  sortFilter,
  transactionId,
}: {
  publicationId: string;
  ratingsData: PaginatedPublicationRatings | null;
  summaryData: PublicationRatingSummary | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { star: number | 'all'; sort: 'newest' | 'oldest' | 'helpful' }) => void;
  onRefresh: () => void;
  averageRating: number;
  totalRatings: number;
  userType: string | null;
  starFilter: number | 'all';
  sortFilter: 'newest' | 'oldest' | 'helpful';
  transactionId?: string | null;
}) => {
  const { language, t } = useTranslation();
  const [selectedStars, setSelectedStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const visibleRatings = (ratingsData?.content || []).filter((rating) =>
    starFilter === 'all' ? true : rating.star === starFilter
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setMessage({ type: 'error', text: t('bookDetail.reviewRequired') });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);
      const response = await publicationsService.createPublicationRating(publicationId, {
        star: selectedStars,
        comment: formatReviewComment(selectedTags, comment),
        transactionId: transactionId || null,
      });

      if (response.code === 200) {
        setMessage({
          type: 'success',
          text: `${t('bookDetail.reviewSuccess')} ${language === 'en' ? '+5 contribution points.' : '+5 điểm đóng góp.'}`,
        });
        setComment('');
        setSelectedStars(5);
        setSelectedTags([]);
        onRefresh();
      } else {
        setMessage({ type: 'error', text: getFriendlyErrorMessage(response, language) || t('bookDetail.reviewFailed') });
      }
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      // axiosInstance rejects with { status, message, data }
      const errorMsg = getFriendlyErrorMessage(error, language);
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="grid md:grid-cols-3 gap-8 mb-10">
        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating}</div>
            <div className="flex justify-center mb-2">
              <StarRating rating={averageRating} size={20} />
            </div>
            <p className="text-sm text-gray-500">{fill(t('bookDetail.reviewBasedOn'), { count: totalRatings })}</p>
          </div>
          {summaryData ? (
            <div>
              <ReviewBar star={5} count={summaryData.fiveStarCount} total={summaryData.totalCount} />
              <ReviewBar star={4} count={summaryData.fourStarCount} total={summaryData.totalCount} />
              <ReviewBar star={3} count={summaryData.threeStarCount} total={summaryData.totalCount} />
              <ReviewBar star={2} count={summaryData.twoStarCount} total={summaryData.totalCount} />
              <ReviewBar star={1} count={summaryData.oneStarCount} total={summaryData.totalCount} />
            </div>
          ) : (
            <div className="space-y-2 animate-pulse">
              {[5, 4, 3, 2, 1].map((s) => (
                <div key={s} className="h-4 bg-gray-200 rounded-full w-full"></div>
              ))}
            </div>
          )}
        </div>

        {/* Write Review */}
        <div className="md:col-span-2">
          {userType !== 'librarian' && (
          <>
          <h4 className="font-bold text-gray-900 mb-4 flex items-center">
            <PenTool size={16} className="mr-2 text-blue-600" /> {t('bookDetail.writeReview')}
          </h4>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {message.type === 'success' ? <CheckCircle size={16} className="mr-2" /> : <AlertCircle size={16} className="mr-2" />}
                {message.text}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('bookDetail.yourRating')}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={24}
                    onClick={() => setSelectedStars(s)}
                    className={`${
                      s <= selectedStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    } cursor-pointer transition-colors`}
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Quick tags' : 'Nhãn đánh giá nhanh'}
              </label>
              <div className="flex flex-wrap gap-2">
                {REVIEW_TAGS.map((tag) => {
                  const label = tag[language];
                  const selected = selectedTags.includes(label);
                  const toneClass = tag.tone === 'positive'
                    ? selected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-emerald-100 bg-emerald-50/60 text-emerald-700 hover:border-emerald-300'
                    : tag.tone === 'critical'
                      ? selected
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-amber-100 bg-amber-50/60 text-amber-700 hover:border-amber-300'
                      : selected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-blue-100 bg-blue-50/60 text-blue-700 hover:border-blue-300';
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleTag(label)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${toneClass}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {language === 'en' ? 'Saved as' : 'Sẽ lưu dạng'}: Nhãn: {selectedTags.join(', ')}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('bookDetail.comment')}
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('bookDetail.commentPlaceholder')}
              ></textarea>
            </div>
            <div className="flex justify-end">
              <Button
                className="flex items-center"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                {t('bookDetail.submitReview')}
              </Button>
            </div>
          </div>
          </>
          )}
          {userType === 'librarian' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-100">
              {language === 'en'
                ? 'Librarian view: you can monitor reader feedback and reply to reviews, but cannot rate or borrow from this page.'
                : 'Chế độ thủ thư: bạn có thể theo dõi phản hồi bạn đọc và trả lời review, nhưng không đánh giá hoặc mượn sách từ trang này.'}
            </div>
          )}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <h4 className="font-bold text-lg text-gray-900 dark:text-white">
            {t('bookDetail.communityReviews')}
          </h4>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Star size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 fill-yellow-400 text-yellow-400" />
              <select
                value={starFilter}
                onChange={(e) => onFilterChange({ star: e.target.value === 'all' ? 'all' : Number(e.target.value), sort: sortFilter })}
                className="rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="all">{language === 'en' ? 'All stars' : 'Tất cả sao'}</option>
                {[5, 4, 3, 2, 1].map(star => (
                  <option key={star} value={star}>{'★'.repeat(star)}{'☆'.repeat(5 - star)} {star} {language === 'en' ? 'stars' : 'sao'}</option>
                ))}
              </select>
            </div>
            <select
              value={sortFilter}
              onChange={(e) => onFilterChange({ star: starFilter, sort: e.target.value as 'newest' | 'oldest' | 'helpful' })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="newest">{language === 'en' ? 'Newest' : 'Mới nhất'}</option>
              <option value="oldest">{language === 'en' ? 'Oldest' : 'Cũ nhất'}</option>
              <option value="helpful">{language === 'en' ? 'Most helpful' : 'Nhiều hữu ích nhất'}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-500 dark:text-slate-300">{t('bookDetail.loadingReviews')}</div>
        ) : visibleRatings.length > 0 ? (
          <>
            <div className="space-y-6">
              {visibleRatings.map((rating) => (
                <ReviewItem
                  key={rating.ratingId}
                  name={rating.fullName}
                  faculty={formatReviewerAcademicLine({
                    studentId: rating.studentId,
                    faculty: rating.faculty,
                    role: 'student',
                    fallback: language === 'en' ? 'Student' : 'Sinh viên',
                    language,
                  })}
                  date={new Date(rating.createdAt).toLocaleDateString(localeOf(language))}
                  rating={rating.star}
                  text={rating.comment}
                  likes={rating.helpfulCount}
                  liked={rating.helpfulByCurrentUser}
                  itemBarcode={rating.itemBarcode}
                  editableByCurrentUser={rating.editableByCurrentUser}
                  avatar={rating.profilePictureUrl}
                  replies={rating.replies || []}
                  publicationId={publicationId}
                  ratingId={rating.ratingId}
                  userType={userType}
                  onRefresh={onRefresh}
                />
              ))}
            </div>

            {/* Pagination for Ratings */}
            {ratingsData.totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6 dark:border-slate-700">
                <div className="text-sm text-gray-500 dark:text-slate-300">
                  {t('common.showing')} <span className="font-medium text-gray-900 dark:text-white">{ratingsData.currentPage * ratingsData.pageSize + 1}</span> -{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.min((ratingsData.currentPage + 1) * ratingsData.pageSize, ratingsData.totalElements)}
                  </span>{' '}
                  {t('common.in')} <span className="font-medium text-gray-900 dark:text-white">{ratingsData.totalElements}</span> {t('bookDetail.reviews')}
                </div>
                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => onPageChange(Math.max(0, ratingsData.currentPage - 1))}
                    disabled={ratingsData.first}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      ratingsData.first ? 'text-gray-300 cursor-not-allowed dark:text-slate-600' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                  {Array.from({ length: ratingsData.totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => onPageChange(i)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        ratingsData.currentPage === i
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => onPageChange(ratingsData.currentPage + 1)}
                    disabled={ratingsData.last}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      ratingsData.last ? 'text-gray-300 cursor-not-allowed dark:text-slate-600' : 'text-gray-500 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-gray-500 dark:text-slate-300">{t('bookDetail.noReviews')}</div>
        )}
      </div>
    </div>
  );
};

const ReviewItem = ({ name, faculty, date, rating, text, likes, liked, itemBarcode, editableByCurrentUser, avatar, replies = [], publicationId, ratingId, userType, onRefresh }: any) => {
  const { language, t } = useTranslation();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes);
  const [localLiked, setLocalLiked] = useState(Boolean(liked));
  const [editing, setEditing] = useState(false);
  const [editStars, setEditStars] = useState(rating);
  const [editText, setEditText] = useState(text);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleHelpful = async () => {
    if (userType !== 'student') {
      toast.info(language === 'en' ? 'Only readers can mark reviews as helpful.' : 'Chỉ bạn đọc mới đánh dấu review là hữu ích.');
      return;
    }
    try {
      const res = await publicationsService.toggleRatingHelpful(publicationId, ratingId);
      if (res.code === 200) {
        setLocalLikes(res.data.helpfulCount);
        setLocalLiked(res.data.helpful);
      }
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error, language));
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await publicationsService.replyToRating(publicationId, ratingId, replyText.trim());
      if (res.code === 200) {
        setReplyText('');
        setReplyOpen(false);
        onRefresh();
        toast.success(language === 'en' ? 'Reply posted.' : 'Đã trả lời review.');
      }
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error, language));
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      const res = await publicationsService.updatePublicationRating(publicationId, ratingId, {
        star: editStars,
        comment: editText.trim(),
      });
      if (res.code === 200) {
        setEditing(false);
        onRefresh();
        toast.success(language === 'en' ? 'Review updated.' : 'Đã cập nhật đánh giá.');
      }
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error, language));
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="flex space-x-4 border-b border-gray-100 last:border-0 pb-6 dark:border-slate-700">
      <div className="flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-sm dark:from-blue-500/30 dark:to-indigo-500/30 dark:text-blue-100">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-gray-900 text-sm dark:text-white">{name}</h4>
            <p className="text-xs text-gray-500 dark:text-slate-300">{faculty}</p>
            {itemBarcode && (
              <p className="mt-0.5 text-[11px] font-mono text-gray-400 dark:text-slate-400">Barcode: {itemBarcode}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-300">{date}</span>
        </div>
        {editing ? (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 dark:border-blue-500/30 dark:bg-blue-500/10">
            <div className="mb-3 flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={20}
                  onClick={() => setEditStars(star)}
                  className={`${star <= editStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} cursor-pointer`}
                />
              ))}
            </div>
            <textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editText.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingEdit ? t('common.loading') : (language === 'en' ? 'Save changes' : 'Lưu chỉnh sửa')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-1 mb-2">
              <StarRating rating={rating} size={14} />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3 dark:text-slate-100">{text}</p>
          </>
        )}
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-300">
          <button
            onClick={handleHelpful}
            className={`flex items-center space-x-1 transition-colors ${localLiked ? 'text-blue-600 font-semibold' : 'hover:text-blue-600'}`}
          >
            <ThumbsUp size={14} /> <span>{t('bookDetail.helpful')} ({localLikes})</span>
          </button>
          {userType === 'librarian' && (
            <button onClick={() => setReplyOpen(open => !open)} className="flex items-center hover:text-blue-600 space-x-1 transition-colors">
              <MessageSquare size={14} /> <span>{t('bookDetail.reply')}</span>
            </button>
          )}
          {editableByCurrentUser && !editing && (
            <button onClick={() => setEditing(true)} className="flex items-center hover:text-blue-600 space-x-1 transition-colors">
              <PenTool size={14} /> <span>{language === 'en' ? 'Edit review' : 'Chỉnh sửa đánh giá'}</span>
            </button>
          )}
        </div>
        {replies.length > 0 && (
          <div className="mt-4 space-y-3">
            {replies.map((reply: any) => (
              <div key={reply.replyId} className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-400/40 dark:bg-blue-500/15">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {reply.librarianAvatarUrl ? (
                      <img src={reply.librarianAvatarUrl} alt={reply.librarianName} className="h-7 w-7 rounded-lg object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-sm">
                        <BookOpen size={15} />
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-100">{reply.librarianName || 'Thủ thư'}</p>
                      <CheckCircle size={13} className="fill-blue-600 text-white" />
                      <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-400/20 dark:text-blue-100">
                        {reply.librarianRoleLabel || 'Thủ thư'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-blue-500 dark:text-blue-200">{new Date(reply.createdAt).toLocaleDateString(localeOf(language))}</span>
                </div>
                <p className="text-sm text-blue-900 dark:text-blue-50">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
        {replyOpen && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
              placeholder={language === 'en' ? 'Reply as librarian...' : 'Trả lời với vai trò thủ thư...'}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setReplyOpen(false)} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReply}
                disabled={submittingReply || !replyText.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingReply ? t('common.loading') : t('bookDetail.reply')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BookCardSimple = ({
  title,
  author,
  rating,
  image,
  borrowCount,
  tag,
  status,
  color = 'blue',
}: any) => {
  const { t } = useTranslation();

  return (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
    <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <span
        className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded text-white bg-${color}-600 shadow-sm`}
      >
        {tag}
      </span>
    </div>
    <div className="p-3 flex flex-col flex-grow">
      <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
        {title}
      </h4>
      <p className="text-xs text-gray-500 mb-2">{author}</p>
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-medium">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />{' '}
          {rating}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users size={12} /> {borrowCount ?? 0}
        </div>
        {status === 'available' ? (
          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
            {t('bookDetail.available')}
          </span>
        ) : (
          <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
            {t('bookDetail.borrowed')}
          </span>
        )}
      </div>
      <Button size="sm" variant="outline" className="w-full mt-3 text-xs h-8">
        {t('common.viewDetails')}
      </Button>
    </div>
  </div>
  );
};

const RelatedBooksTab = ({
  books,
  prefix,
  isLoading,
}: {
  books: RecommendedPublication[];
  prefix: string;
  isLoading: boolean;
}) => {
  const { language, t } = useTranslation();

  return (
  <div className="animate-fade-in">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold text-gray-900">{t('bookDetail.sameTopic')}</h3>
      <Link
        to="/publicpage/search"
        className="text-sm text-blue-600 hover:underline flex items-center"
      >
        {t('bookDetail.viewAll')} <ArrowRight size={14} className="ml-1" />
      </Link>
    </div>
    {isLoading ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-72 bg-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    ) : books.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((book) => (
          <Link key={book.publicationId} to={`${prefix}/book/${book.publicationId}`}>
            <BookCardSimple
              title={book.title}
              author={book.authorNames?.join(', ') || t('bookDetail.unknownAuthor')}
              rating={book.ratingAverage ?? 0}
              borrowCount={book.borrowCount ?? 0}
              image={book.coverImageUrl || '/books/book-placeholder.svg'}
              tag={book.availableItems > 0 ? t('bookDetail.available') : t('bookDetail.borrowed')}
              status={book.availableItems > 0 ? 'available' : 'loan'}
              color={book.availableItems > 0 ? 'green' : 'orange'}
            />
          </Link>
        ))}
      </div>
    ) : (
      <div className="py-12 text-center text-gray-500">{t('bookDetail.noSimilar')}</div>
    )}
  </div>
  );
};

const ITEM_STATUS_MAP: Record<string, { labelKey: string; fallback: string; dot: string; badge: string }> = {
  AVAILABLE:      { labelKey: 'bookDetail.status.available', fallback: 'Có sẵn', dot: 'bg-green-500',  badge: 'bg-green-100 text-green-800' },
  RESERVED:       { labelKey: 'bookDetail.status.reserved', fallback: 'Đã có người đặt', dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800' },
  BORROWED:       { labelKey: 'bookDetail.status.borrowed', fallback: 'Đang được mượn', dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' },
  IN_MAINTENANCE: { labelKey: 'bookDetail.status.maintenance', fallback: 'Đang bảo trì', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' },
  LOST:           { labelKey: 'bookDetail.status.lost', fallback: 'Mất / Thất lạc', dot: 'bg-red-500',    badge: 'bg-red-100 text-red-800' },
};

const ItemStatusBadge = ({ status, dueDate }: { status: string; dueDate?: string | null }) => {
  const { language, t } = useTranslation();
  const cfg = ITEM_STATUS_MAP[status] ?? { labelKey: status, fallback: status, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' };
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${cfg.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`}></span>
        {t(cfg.labelKey, cfg.fallback)}
      </span>
      {status === 'BORROWED' && dueDate && (
        <span className="text-[10px] text-gray-500 ml-1">
          {t('bookDetail.dueExpected')}: {new Date(dueDate).toLocaleDateString(localeOf(language))}
        </span>
      )}
    </div>
  );
};

const AUDIENCE_LABELS: Record<string, Record<Language, string>> = {
  TOAN_BO_SINH_VIEN_BKU: { vi: 'Toàn bộ sinh viên', en: 'All students' },
  KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH: { vi: 'Khoa Khoa học và Kỹ thuật Máy tính', en: 'Faculty of Computer Science and Engineering' },
  KHOA_DIEN_DIEN_TU: { vi: 'Khoa Điện - Điện tử', en: 'Faculty of Electrical and Electronics Engineering' },
  KHOA_CO_KHI: { vi: 'Khoa Cơ khí', en: 'Faculty of Mechanical Engineering' },
  KHOA_KY_THUAT_HOA_HOC: { vi: 'Khoa Kỹ thuật Hóa học', en: 'Faculty of Chemical Engineering' },
  KHOA_KY_THUAT_XAY_DUNG: { vi: 'Khoa Kỹ thuật Xây dựng', en: 'Faculty of Civil Engineering' },
  KHOA_KY_THUAT_GIAO_THONG: { vi: 'Khoa Kỹ thuật Giao thông', en: 'Faculty of Transportation Engineering' },
  KHOA_QUAN_LY_CONG_NGHIEP: { vi: 'Khoa Quản lý Công nghiệp', en: 'Faculty of Industrial Management' },
  KHOA_MOI_TRUONG_VA_TAI_NGUYEN: { vi: 'Khoa Môi trường và Tài nguyên', en: 'Faculty of Environment and Natural Resources' },
  KHOA_CONG_NGHE_VAT_LIEU: { vi: 'Khoa Công nghệ Vật liệu', en: 'Faculty of Materials Technology' },
  KHOA_KHOA_HOC_UNG_DUNG: { vi: 'Khoa Khoa học Ứng dụng', en: 'Faculty of Applied Science' },
  KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI: { vi: 'Khoa Kỹ thuật Địa chất và Dầu khí', en: 'Faculty of Geology and Petroleum Engineering' },
};

const formatAudienceLabel = (value: string, language: Language) =>
  AUDIENCE_LABELS[value.trim()]?.[language] || value.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase());

const SimilarBooksSection = ({
  books,
  prefix,
  isLoading,
}: {
  books: RecommendedPublication[];
  prefix: string;
  isLoading: boolean;
}) => {
  const { language, t } = useTranslation();

  if (isLoading) {
    return (
      <div className="px-6 md:px-8 py-8 border-t border-gray-200">
        <div className="h-6 w-60 bg-gray-200 rounded mb-5 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!books.length) {
    return null;
  }

  return (
    <div className="px-6 md:px-8 py-8 border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center text-lg font-bold text-gray-900">
          <Sparkles size={20} className="mr-2 text-blue-600" />
          {t('bookDetail.similarBooks')}
        </h3>
        <Link to={`${prefix}/search`} className="text-sm text-blue-600 hover:underline flex items-center">
          {t('bookDetail.exploreMore')} <ArrowRight size={14} className="ml-1" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => (
          <Link
            key={book.publicationId}
            to={`${prefix}/book/${book.publicationId}`}
            className="group flex gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all"
          >
            <img
              src={book.coverImageUrl || '/books/book-placeholder.svg'}
              alt={book.title}
              className="h-28 w-20 rounded-lg object-cover bg-white border border-gray-100 flex-shrink-0"
            />
            <div className="min-w-0 flex flex-col">
              <h4 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600">
                {book.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                {book.authorNames?.join(', ') || t('bookDetail.unknownAuthor')}
              </p>
              <div className="mt-auto flex items-center gap-3 text-xs text-gray-600">
                <span className="inline-flex items-center">
                  <Star size={12} className="text-yellow-400 fill-yellow-400 mr-1" />
                  {book.ratingAverage ?? 0}
                </span>
                <span className="inline-flex items-center">
                  <Users size={12} className="mr-1" />
                  {book.borrowCount ?? 0} {language === 'en' ? 'borrows' : 'lượt mượn'}
                </span>
                <span className="text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                  {fill(t('bookDetail.availableCopiesShort'), { count: book.availableItems ?? 0 })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// --- Main Page Component ---

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userType } = useAuth();
  const { language, t } = useTranslation();
  const dialog = useAppDialog();
  const prefix = location.pathname.startsWith('/userpage')
    ? '/userpage'
    : location.pathname.startsWith('/librarianpage')
      ? '/librarianpage/public'
    : '/publicpage';
  const [activeTab, setActiveTab] = useState('overview');
  const reviewsSectionRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<PublicationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [itemsData, setItemsData] = useState<PaginatedPublicationItems | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemsPage, setItemsPage] = useState(0);

  const [ratingsData, setRatingsData] = useState<PaginatedPublicationRatings | null>(null);
  const [summaryData, setSummaryData] = useState<PublicationRatingSummary | null>(null);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [ratingsPage, setRatingsPage] = useState(0);
  const [ratingStarFilter, setRatingStarFilter] = useState<number | 'all'>('all');
  const [ratingSortFilter, setRatingSortFilter] = useState<'newest' | 'oldest' | 'helpful'>('newest');
  const [borrowSuccessData, setBorrowSuccessData] = useState<import('../../api/transactionsService').BorrowResponse['data'] | null>(null);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [similarBooks, setSimilarBooks] = useState<RecommendedPublication[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  useEffect(() => {
    if (searchParams.get('review') !== '1' && searchParams.get('rate') !== '1') return;
    setActiveTab('reviews');
    const timer = window.setTimeout(() => {
      reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchParams, data]);

  const requireStudentAuth = (actionLabel: string) => {
    if (userType === 'student') return true;
    toast.info(fill(t('bookDetail.loginRequired'), { action: actionLabel }));
    navigate('/publicpage/login', {
      state: { from: `${location.pathname}${location.search}` },
    });
    return false;
  };

  useEffect(() => {
    const fetchPublicationDetail = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await publicationsService.getPublicationById(id);
        if (response.code === 200) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch publication detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicationDetail();
  }, [id]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!id) return;
      try {
        const response = await publicationsService.getPublicationRatingSummary(id);
        if (response.code === 200) {
          setSummaryData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch rating summary:', error);
      }
    };
    fetchSummary();
  }, [id]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!id) return;
      try {
        setIsLoadingItems(true);
        const response = await publicationsService.getPublicationItems(id, itemsPage, 5);
        if (response.code === 200) {
          setItemsData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setIsLoadingItems(false);
      }
    };
    fetchItems();
  }, [id, itemsPage]);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!id) return;
      try {
        setIsLoadingRatings(true);
        const response = await publicationsService.getPublicationRatings(id, ratingsPage, 10, {
          star: ratingStarFilter,
          sort: ratingSortFilter,
        });
        if (response.code === 200) {
          setRatingsData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch ratings:', error);
      } finally {
        setIsLoadingRatings(false);
      }
    };
    fetchRatings();
  }, [id, ratingsPage, ratingStarFilter, ratingSortFilter]);

  useEffect(() => {
    if (!id || userType !== 'student') return;
    publicationsService.recordView(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id || userType !== 'student') return;
    wishlistService.getWishlistStatus(id)
      .then(res => setInWishlist(res.data))
      .catch(() => {});
  }, [id, userType]);

  useEffect(() => {
    const fetchSimilarBooks = async () => {
      if (!id) return;
      try {
        setIsLoadingSimilar(true);
        const response = await publicationsService.getSimilarPublications(id, 6);
        if (response.code === 200) {
          setSimilarBooks(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch similar publications:', error);
        setSimilarBooks([]);
      } finally {
        setIsLoadingSimilar(false);
      }
    };
    fetchSimilarBooks();
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!id) return;
    if (!requireStudentAuth(t('bookDetail.actionWishlist'))) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistService.removeFromWishlist(id);
        setInWishlist(false);
        toast.success(t('bookDetail.removedWishlist'));
      } else {
        await wishlistService.addToWishlist(id);
        setInWishlist(true);
        toast.success(t('bookDetail.addedWishlist'));
      }
    } catch {
      toast.error(t('bookDetail.tryAgain'));
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    const shareUrl = window.location.href;
    const shareData = {
      title: data.publication.title,
      text: fill(t('bookDetail.shareText'), { title: data.publication.title }),
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('bookDetail.linkCopied'));
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('bookDetail.linkCopied'));
    }
  };

  const bookSeo = data ? {
    title: data.publication.title,
    description: data.publication.aiSummary || data.publication.description || `${data.publication.title} tại Library74`,
    image: data.publication.coverImageUrl,
    canonicalPath: `/publicpage/book/${data.publication.id}`,
    type: 'book' as const,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: data.publication.title,
      alternateName: data.publication.subtitle || undefined,
      isbn: data.publication.isbn || undefined,
      inLanguage: data.publication.language || undefined,
      numberOfPages: data.publication.numberOfPages || undefined,
      datePublished: data.publication.publicationYear ? String(data.publication.publicationYear) : undefined,
      image: data.publication.coverImageUrl || undefined,
      description: data.publication.aiSummary || data.publication.description || undefined,
      author: data.authors.map(author => ({ '@type': 'Person', name: author.name })),
      publisher: data.publisher?.name ? { '@type': 'Organization', name: data.publisher.name } : undefined,
      keywords: [...data.categories.map(category => category.name), ...data.tags.map(tag => tag.name)].join(', '),
      aggregateRating: data.ratings?.totalRatings > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: data.ratings.averageRating,
        reviewCount: data.ratings.totalRatings,
      } : undefined,
      offers: {
        '@type': 'Offer',
        availability: data.items.totalAvailableItems > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    },
  } : null;

  const handleCopyCitation = async () => {
    if (!data) return;
    const authors = data.authors.map((author) => author.name).join(', ') || t('bookDetail.unknownAuthor');
    const publisher = data.publisher?.name || t('bookDetail.unknownPublisher');
    const year = data.publication.publicationYear || 'n.d.';
    const title = data.publication.subtitle
      ? `${data.publication.title}: ${data.publication.subtitle}`
      : data.publication.title;
    const citation = `${authors}. (${year}). ${title}. ${publisher}.`;
    try {
      await navigator.clipboard.writeText(citation);
      toast.success(t('bookDetail.citationCopied'));
    } catch {
      toast.error(t('bookDetail.tryAgain'));
    }
  };

  const handleReserve = async (branch: string) => {
    if (!data?.publication?.id) return;
    if (!requireStudentAuth(t('bookDetail.actionReserve'))) return;
    setReserving(true);
    try {
      await createReservation(data.publication.id, branch);
      toast.success(t('bookDetail.reserveSuccess'));
      setShowReserveModal(false);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      let msg: string;
      if (code === 3011) {
        msg = t('bookDetail.reserveAvailableError');
      } else if (code === 3005) {
        msg = t('bookDetail.reservePendingError');
      } else if (code === 3012) {
        msg = t('bookDetail.reserveNoCopyError');
      } else if (code === 3013) {
        msg = t('bookDetail.reserveLimitError');
      } else if (code === 3007) {
        msg = t('bookDetail.reserveFineError');
      } else {
        msg = getFriendlyErrorMessage(err, language) || t('bookDetail.reserveFailed');
      }
      toast.error(msg);
    } finally {
      setReserving(false);
    }
  };

  const handleBorrow = async (itemId: string) => {
    if (!requireStudentAuth(t('bookDetail.actionBorrow'))) return;
    try {
      const confirmBorrow = await dialog.confirm({
        title: t('bookDetail.borrowNow'),
        message: t('bookDetail.confirmBorrow'),
        confirmText: t('bookDetail.borrowNow'),
        cancelText: t('common.cancel'),
        variant: 'confirm',
      });
      if (!confirmBorrow) return;

      const response = await transactionsService.borrow({ itemId });
      if (response.code === 201) {
        setBorrowSuccessData(response.data);
        // Refresh the items list
        const fetchItems = async () => {
          if (!id) return;
          try {
            setIsLoadingItems(true);
            const res = await publicationsService.getPublicationItems(id, itemsPage, 5);
            if (res.code === 200) {
              setItemsData(res.data);
            }
          } catch (error) {
            console.error('Failed to fetch items:', error);
          } finally {
            setIsLoadingItems(false);
          }
        };
        fetchItems();
      }
    } catch (error: any) {
      console.error('Borrow failed:', error);
      toast.error(getFriendlyErrorMessage(error, language) || t('bookDetail.borrowFailed'));
    }
  };

  // Modal đặt trước — chọn cơ sở ưu tiên
  const ReserveModal = () => {
    const BRANCHES = [
      { value: 'ANY',                          label: t('bookDetail.anyBranch'),   sub: t('bookDetail.anyBranchSub') },
      { value: 'Cơ sở 1 - Lý Thường Kiệt',    label: 'Cơ sở 1 – Lý Thường Kiệt', sub: '268 Lý Thường Kiệt, Q.10, TP.HCM' },
      { value: 'Cơ sở 2 - Dĩ An',             label: 'Cơ sở 2 – Dĩ An',           sub: 'Khu phố Tân Lập, TP. Dĩ An, Bình Dương' },
    ];
    const [selectedBranch, setSelectedBranch] = useState('ANY');

    const items = itemsData?.content ?? [];
    const totalItems = data?.items?.totalItems ?? 0;

    const availableInBranch = (branch: string) =>
      items.filter(i => i.status === 'AVAILABLE' && (branch === 'ANY' || i.branch === branch)).length;

    const hasAvailable = availableInBranch(selectedBranch) > 0;
    const noItemsAtAll = totalItems === 0;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
          <h3 className="font-bold text-gray-900 mb-1">{t('bookDetail.reserveTitle')}</h3>
          <p className="text-sm text-gray-500 mb-4">{t('bookDetail.reserveSubtitle')}</p>

          <div className="space-y-2 mb-4">
            {BRANCHES.map(b => (
              <label key={b.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedBranch === b.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="branch" value={b.value} checked={selectedBranch === b.value}
                  onChange={() => setSelectedBranch(b.value)} className="accent-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.label}</p>
                  <p className="text-xs text-gray-400">{b.sub}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Inline warnings */}
          {noItemsAtAll && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex gap-2 text-xs text-gray-600">
              <AlertCircle size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              {t('bookDetail.noCopiesReserve')}
            </div>
          )}
          {!noItemsAtAll && hasAvailable && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-xs text-amber-800">
              <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{t('bookDetail.availableAtBranch')}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setShowReserveModal(false)} disabled={reserving}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              {t('common.cancel')}
            </button>
            <button onClick={() => handleReserve(selectedBranch)} disabled={reserving}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
              {reserving ? t('bookDetail.processing') : t('bookDetail.confirmReserve')}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">{t('bookDetail.notFound')}</h2>
        <Link to={prefix} className="mt-4 text-blue-600 hover:underline">
          {t('bookDetail.backHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {bookSeo && <Seo {...bookSeo} />}
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-gray-500 flex items-center">
          <Link to={prefix} className="hover:text-blue-600 cursor-pointer">
            {t('nav.home')}
          </Link>
          <ChevronRight size={14} className="mx-2 text-gray-400" />
          <Link
            to={`${prefix}/search`}
            className="hover:text-blue-600 cursor-pointer"
          >
            {t('nav.search')}
          </Link>
          <ChevronRight size={14} className="mx-2 text-gray-400" />
          <span className="text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
            {data.publication.title}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Top Section */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
            {/* Left: Cover & Actions */}
            <div className="w-full md:w-1/4 flex-shrink-0">
              <div className="rounded-lg overflow-hidden shadow-lg border border-gray-100 relative group">
                {data.items.totalAvailableItems > 0 && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10 flex items-center">
                    <CheckCircle size={12} className="mr-1" /> {t('bookDetail.available')}
                  </div>
                )}
                <img
                  src={data.publication.coverImageUrl || "/books/book-placeholder.svg"}
                  alt={data.publication.title}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                  {data.publication.title}
                </h1>
                <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded text-blue-700 font-bold text-lg">
                  <span>{data.ratings.averageRating}</span> <Star size={16} fill="currentColor" />{' '}
                  <span className="text-xs font-normal text-gray-500 ml-1">
                    ({data.ratings.totalRatings} {t('bookDetail.reviews')})
                  </span>
                </div>
              </div>
              {data.publication.subtitle && (
                <p className="text-xl text-gray-600 mb-4 font-light">
                  {data.publication.subtitle}
                </p>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-6 border-b border-gray-100 pb-6">
                <div className="flex items-center font-medium">
                  <User size={16} className="mr-2 text-blue-500" />{' '}
                  <span className="text-gray-900 mr-1">{t('bookDetail.author')}:</span> {data.authors.map(a => a.name).join(', ')}
                </div>
                <div className="flex items-center font-medium">
                  <Calendar size={16} className="mr-2 text-blue-500" />{' '}
                  <span className="text-gray-900 mr-1">{t('bookDetail.year')}:</span> {data.publication.publicationYear}
                </div>
                <div className="flex items-center font-medium">
                  <BookOpen size={16} className="mr-2 text-blue-500" />{' '}
                  <span className="text-gray-900 mr-1">{t('bookDetail.publisher')}:</span> {data.publisher?.name || 'N/A'}
                </div>
                <div className="flex items-center font-medium">
                  <Users size={16} className="mr-2 text-blue-500" />{' '}
                  <span className="text-gray-900 mr-1">{language === 'en' ? 'Borrows:' : 'Lượt mượn:'}</span> {data.publication.borrowCount ?? 0}
                </div>
              </div>

              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {t('bookDetail.tags')}:
                  </span>
                  {data.tags.slice(0, 5).map((tag) => (
                    <Link
                      key={tag.id}
                      to={`${prefix}/search?q=${encodeURIComponent(tag.name)}`}
                      className="border text-sm font-semibold px-3 py-1 rounded-md transition-all hover:brightness-95 hover:-translate-y-0.5"
                      style={tagColor(tag.name)}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-6">
                {(data.publication.language || (data.categories && data.categories.length > 0)) && (
                  <span className="text-sm font-semibold text-gray-900">
                    {language === 'en' ? 'Categories:' : 'Danh mục:'}
                  </span>
                )}
                {data.publication.language && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {data.publication.language}
                  </span>
                )}
                {data.categories && data.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`${prefix}/search?categoryId=${cat.id}`}
                    className="inline-flex items-center rounded-md bg-gray-100 border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                  >
                      {cat.name}
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                {userType !== 'librarian' && (
                <>
                {data.publication.availableItems === 0 ? (
                  <Button
                    size="lg"
                    className="px-8 shadow-blue-200 shadow-lg hover:shadow-xl transition-shadow"
                    onClick={() => {
                      if (requireStudentAuth(t('bookDetail.actionReserve'))) setShowReserveModal(true);
                    }}
                  >
                    <Clock size={18} className="mr-2" /> {t('bookDetail.reserve')}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 text-blue-600 border-blue-300 hover:bg-blue-50"
                    onClick={() => {
                      if (requireStudentAuth(t('bookDetail.actionReserve'))) setShowReserveModal(true);
                    }}
                  >
                    <Clock size={18} className="mr-2" /> {t('bookDetail.reserve')}
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`transition-colors ${inWishlist
                    ? 'text-red-500 border-red-300 hover:text-red-600 hover:border-red-400'
                    : 'text-gray-600 hover:text-red-500 hover:border-red-200'}`}
                >
                  <Heart
                    size={18}
                    className="mr-2"
                    fill={inWishlist ? 'currentColor' : 'none'}
                  />
                  {inWishlist ? t('bookDetail.saved') : t('bookDetail.wishlist')}
                </Button>
                </>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleShare}
                  className="text-gray-600 hover:text-blue-500 hover:border-blue-200"
                >
                  <Share2 size={18} className="mr-2" /> {t('bookDetail.share')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCopyCitation}
                  className="ml-auto text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                >
                  <PenTool size={18} className="mr-2" /> {t('bookDetail.citation')}
                </Button>
              </div>

              {/* AI Summary Section - Box Style */}
              <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 dark:border-slate-700 dark:bg-none dark:bg-slate-900">
                <div className="absolute right-0 top-0 p-4 opacity-5 dark:opacity-[0.07]">
                  <Sparkles size={120} className="text-indigo-900 dark:text-slate-400" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg dark:from-slate-700 dark:to-slate-800 dark:ring-1 dark:ring-slate-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        AI Summary & Target Audience
                      </h3>
                      <p className="text-xs font-medium text-indigo-600 dark:text-slate-400">
                        {t('bookDetail.aiSubtitle')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-grow">
                      <p className="whitespace-pre-line text-justify text-sm leading-relaxed text-gray-700 dark:text-slate-200">
                        {data.publication.aiSummary || t('bookDetail.noAiSummary')}
                      </p>
                    </div>
                    {data.publication.aiTargetAudience && (
                      <div className="flex-shrink-0 rounded-xl border border-indigo-100 bg-white/60 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/60 lg:w-1/3">
                        <h4 className="mb-3 flex items-center text-sm font-bold text-indigo-900 dark:text-slate-100">
                          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-slate-400"></div>
                          {t('bookDetail.targetAudience')}
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-200">
                          {data.publication.aiTargetAudience.split(',').map((item, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle
                                size={14}
                                className="mr-2 mt-0.5 flex-shrink-0 text-green-500 dark:text-emerald-400"
                              />{' '}
                              {formatAudienceLabel(item, language)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copy Status Section (Moved ABOVE tabs as per request/design best practice) */}
          <div className="px-6 md:px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center text-lg font-bold text-gray-900">
                <Layers size={20} className="mr-2 text-blue-600" /> {t('bookDetail.copyStatus')}
              </h3>
              <div className="flex items-center space-x-4 text-sm font-medium">
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>{' '}
                  {t('bookDetail.availableCount')}: <span className="ml-1 font-bold">{data.items.totalAvailableItems}</span>
                </span>
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2"></span>{' '}
                  {t('bookDetail.borrowedCount')}: <span className="ml-1 font-bold">{data.items.totalBorrowedItems}</span>
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 flex items-start text-sm text-blue-800">
              <div className="bg-blue-100 p-1 rounded-full mr-3 text-blue-600 flex-shrink-0 mt-0.5">
                <Clock size={14} />
              </div>
              <span>
                <strong>{t('bookDetail.notice')}:</strong> {fill(t('bookDetail.totalCopiesNotice'), { total: data.items.totalItems, available: data.items.totalAvailableItems })}
                {data.items.totalAvailableItems === 0 && data.items.totalItems > 0 && ` ${t('bookDetail.allBorrowedNotice')}`}
              </span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/5">
                      Barcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                      Thông tin bản sao
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                      {t('bookDetail.location')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/5">
                      {t('bookDetail.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('bookDetail.action')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingItems ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        {t('bookDetail.loadingCopies')}
                      </td>
                    </tr>
                  ) : itemsData?.content && itemsData.content.length > 0 ? (
                    itemsData.content.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 flex items-center">
                          <Printer size={14} className="mr-2 text-gray-400" />
                          {item.barcode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {labelOf('copyType', item.copyType)}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                              {labelOf('bindingType', item.bindingType)}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              {labelOf('condition', item.condition)}
                            </span>
                          </div>
                          {item.conditionNote && (
                            <div className="mt-1.5 text-xs leading-5 text-gray-500 max-w-xs whitespace-normal">
                              {item.conditionNote}
                            </div>
                          )}
                          {(item.acquiredDate || item.acquisitionSource) && (
                            <div className="mt-1 text-[11px] text-gray-400">
                              {[item.acquiredDate ? `Nhập: ${new Date(item.acquiredDate).toLocaleDateString(localeOf(language))}` : null, item.acquisitionSource].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-medium text-gray-900">
                            {item.branch}
                          </div>
                          <div className="text-xs text-gray-400">{item.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <ItemStatusBadge status={item.status} dueDate={item.dueDate} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {userType === 'librarian' ? (
                            <span className="text-xs text-gray-400 italic">
                              {language === 'en' ? 'View only' : 'Chỉ xem'}
                            </span>
                          ) : (
                          <>
                          {item.status === 'AVAILABLE' ? (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-sm w-28" onClick={() => handleBorrow(item.id)}>
                              {t('bookDetail.borrowNow')}
                            </Button>
                          ) : item.status === 'BORROWED' || item.status === 'RESERVED' ? (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm w-28" onClick={() => setShowReserveModal(true)}>
                              {t('bookDetail.reserve')}
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">{t('bookDetail.unavailable')}</span>
                          )}
                          </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        {t('bookDetail.noCopies')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Phân trang danh sách copy */}
              {itemsData && itemsData.totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    {fill(t('bookDetail.showingCopies'), {
                      from: itemsData.currentPage * itemsData.pageSize + 1,
                      to: Math.min((itemsData.currentPage + 1) * itemsData.pageSize, itemsData.totalElements),
                      total: itemsData.totalElements
                    })}
                  </div>

                  <nav className="inline-flex rounded-md shadow-sm -space-x-px order-1 sm:order-2" aria-label="Pagination">
                    <button
                      onClick={() => setItemsPage((prev) => Math.max(0, prev - 1))}
                      disabled={itemsData.first}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        itemsData.first ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">{t('common.previous')}</span>
                      <ChevronRight className="h-4 w-4 rotate-180" />
                    </button>

                    {Array.from({ length: itemsData.totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setItemsPage(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          itemsData.currentPage === i
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setItemsPage((prev) => prev + 1)}
                      disabled={itemsData.last}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        itemsData.last ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">{t('common.next')}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 px-6 md:px-8 mt-4">
            <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: t('bookDetail.overview'), icon: AlertCircle },
                { id: 'toc', label: t('bookDetail.toc'), icon: List },
                { id: 'reviews', label: `${t('bookDetail.reviews')} (${data.ratings.totalRatings})`, icon: Star },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon
                    size={16}
                    className={`mr-2 ${
                      activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8" ref={activeTab === 'reviews' ? reviewsSectionRef : null}>
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'toc' && <TocTab raw={data.publication.tableOfContents ?? null} />}
            {activeTab === 'reviews' && (
              <ReviewsTab
                publicationId={id || ''}
                transactionId={searchParams.get('transaction')}
                ratingsData={ratingsData}
                summaryData={summaryData}
                isLoading={isLoadingRatings}
                onPageChange={setRatingsPage}
                onRefresh={() => {
                  // Re-fetch ratings and summary to show new data
                  const refreshData = async () => {
                    if (!id) return;
                    try {
                      setIsLoadingRatings(true);
                      const [ratingsRes, summaryRes] = await Promise.all([
                        publicationsService.getPublicationRatings(id, 0, 10, {
                          star: ratingStarFilter,
                          sort: ratingSortFilter,
                        }),
                        publicationsService.getPublicationRatingSummary(id)
                      ]);

                      if (ratingsRes.code === 200) {
                        setRatingsData(ratingsRes.data);
                        setRatingsPage(0);
                      }
                      if (summaryRes.code === 200) {
                        setSummaryData(summaryRes.data);
                      }
                    } catch (error) {
                      console.error('Failed to refresh data:', error);
                    } finally {
                      setIsLoadingRatings(false);
                    }
                  };
                  refreshData();
                }}
                onFilterChange={({ star, sort }) => {
                  setRatingStarFilter(star);
                  setRatingSortFilter(sort);
                  setRatingsPage(0);
                }}
                averageRating={data.ratings.averageRating}
                totalRatings={data.ratings.totalRatings}
                userType={userType}
                starFilter={ratingStarFilter}
                sortFilter={ratingSortFilter}
              />
            )}
          </div>

          <SimilarBooksSection
            books={similarBooks}
            prefix={prefix}
            isLoading={isLoadingSimilar}
          />
        </div>
      </div>

      {/* Borrow Success Modal */}
      {borrowSuccessData && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-auto overflow-hidden animate-fade-in-up">
            <div className="bg-blue-600 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('bookDetail.borrowSuccess')}</h2>
              <p className="text-blue-100 mt-2 text-sm">{t('bookDetail.qrInstruction')}</p>
            </div>

            <div className="p-8">
              <div className="flex justify-center mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <QRCode value={String(borrowSuccessData.transactionId)} size={200} />
              </div>

              <div className="space-y-3 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 font-medium">{t('bookDetail.transactionId')}</span>
                    <span className="font-mono font-bold text-gray-900">#{borrowSuccessData.transactionId}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 leading-tight mb-2">{borrowSuccessData.publicationTitle}</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
                    <Layers size={14} className="text-gray-400" /> {t('bookDetail.location')}: <span className="font-medium text-gray-800">{borrowSuccessData.branch} - {borrowSuccessData.location}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Printer size={14} className="text-gray-400" /> Barcode: <span className="font-medium text-gray-800">{borrowSuccessData.barcode}</span>
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-sm font-bold text-red-800 mb-1">{t('bookDetail.pickupDeadline')}</span>
                    <span className="text-sm text-red-700">{new Date(borrowSuccessData.pickedUpDeadline).toLocaleString(localeOf(language), {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                    })}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setBorrowSuccessData(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 rounded-xl shadow-md"
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showReserveModal && <ReserveModal />}
    </div>
  );
};

export default BookDetailPage;
