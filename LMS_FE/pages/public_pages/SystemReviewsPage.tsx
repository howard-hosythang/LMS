import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, MessageSquare, Send, Star } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import systemReviewsService, {
  SystemReview,
  SystemReviewSummary,
  SystemReviewSort,
} from '../../api/systemReviewsService';
import { formatReviewerAcademicLine } from '../../utils/reviewerMeta';

const emptySummary: SystemReviewSummary = {
  totalReviews: 0,
  satisfiedReviews: 0,
  averageRating: 0,
  satisfactionPercent: 0,
};

const getPublicPrefix = () =>
  window.location.hash.includes('/librarianpage/public') ? '/librarianpage/public' : '/publicpage';

const ReviewStars = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex gap-1 text-yellow-400">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={size}
        fill={index < rating ? 'currentColor' : 'none'}
        className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

const ReviewStarsInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex gap-1">
    {Array.from({ length: 5 }).map((_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={starValue}
          type="button"
          onClick={() => onChange(starValue)}
          className="p-1 rounded-md hover:bg-yellow-50 transition-colors"
        >
          <Star
            size={26}
            fill={starValue <= value ? 'currentColor' : 'none'}
            className={starValue <= value ? 'text-yellow-400' : 'text-gray-300'}
          />
        </button>
      );
    })}
  </div>
);

const ReviewCard = ({
  review,
  satisfiedLabel,
  feedbackLabel,
  language,
}: {
  review: SystemReview;
  satisfiedLabel: string;
  feedbackLabel: string;
  language: 'vi' | 'en';
}) => (
  <article className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all dark:border-slate-700 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={review.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.fullName)}&background=2563eb&color=fff`}
          alt={review.fullName}
          className="w-11 h-11 rounded-full object-cover"
        />
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 truncate dark:text-white">{review.fullName}</h3>
          <p className="text-xs text-gray-500 truncate dark:text-slate-300">
            {formatReviewerAcademicLine({
              studentId: review.studentId,
              faculty: review.faculty,
              role: review.role,
              language,
            })}
          </p>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${review.satisfied ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-100'}`}>
        {review.satisfied ? satisfiedLabel : feedbackLabel}
      </span>
    </div>
    <div className="flex items-center justify-between mb-4">
      <ReviewStars rating={review.rating} />
      <span className="text-xs font-semibold text-gray-500 dark:text-slate-200">{review.rating}/5</span>
    </div>
    <p className="text-sm text-gray-700 leading-relaxed italic dark:text-slate-100">"{review.comment}"</p>
  </article>
);

const SystemReviewsPage = () => {
  const { userType } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const publicPrefix = getPublicPrefix();
  const isLibrarianPublic = location.pathname.startsWith('/librarianpage/public');

  const [reviews, setReviews] = useState<SystemReview[]>([]);
  const [summary, setSummary] = useState<SystemReviewSummary>(emptySummary);
  const [myReview, setMyReview] = useState<SystemReview | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sortFilter, setSortFilter] = useState<SystemReviewSort>('newest');
  const isEn = language === 'en';
  const copy = {
    backHome: isEn ? 'Back to home' : 'Quay lại trang chủ',
    badge: isEn ? 'System reviews' : 'Đánh giá hệ thống',
    title: isEn ? 'What users say about Library74' : 'Người dùng nói gì về Library74',
    subtitle: isEn
      ? 'All user feedback recorded for Library74. Each account has one review and can update it anytime.'
      : 'Tất cả phản hồi được ghi nhận người dùng về hệ thống Library74. Mỗi người chỉ có một đánh giá và có thể cập nhật bất kỳ lúc nào.',
    averageStars: isEn ? 'Average stars' : 'Sao trung bình',
    satisfied: isEn ? 'Satisfied' : 'Hài lòng',
    reviews: isEn ? 'Reviews' : 'Đánh giá',
    updateYourReview: isEn ? 'Update your review' : 'Cập nhật đánh giá của bạn',
    shareExperience: isEn ? 'Share your experience' : 'Chia sẻ trải nghiệm',
    satisfactionRule: isEn
      ? 'Reviews from 3 stars and above count as satisfied users in statistics.'
      : 'Đánh giá từ 3 sao trở lên được tính là người dùng hài lòng trong thống kê.',
    placeholder: userType === 'student'
      ? isEn ? 'What makes Library74 useful for you?' : 'Bạn thấy Library74 hữu ích ở điểm nào?'
      : isEn ? 'Log in with a student account to review the system.' : 'Đăng nhập bằng tài khoản sinh viên để đánh giá hệ thống.',
    emptyContent: isEn ? 'Please enter your review.' : 'Vui lòng nhập nội dung đánh giá.',
    saved: isEn ? 'Your review has been saved.' : 'Đánh giá của bạn đã được lưu.',
    saveFailed: isEn ? 'Could not save your review right now.' : 'Không thể lưu đánh giá lúc này.',
    saving: isEn ? 'Saving...' : 'Đang lưu...',
    updateReview: isEn ? 'Update review' : 'Cập nhật đánh giá',
    submitReview: isEn ? 'Submit review' : 'Gửi đánh giá',
    loginToReview: isEn ? 'Log in to review' : 'Đăng nhập để đánh giá',
    filterByStars: isEn ? 'Filter by stars' : 'Lọc theo sao',
    all: isEn ? 'All' : 'Tất cả',
    star: isEn ? 'star' : 'sao',
    newest: isEn ? 'Newest' : 'Mới nhất',
    oldest: isEn ? 'Oldest' : 'Cũ nhất',
    highest: isEn ? 'Highest rating' : 'Sao cao nhất',
    lowest: isEn ? 'Lowest rating' : 'Sao thấp nhất',
    noReviews: isEn ? 'No reviews yet.' : 'Chưa có đánh giá nào.',
    beFirst: isEn ? 'Be the first to share your Library74 experience.' : 'Hãy là người đầu tiên chia sẻ trải nghiệm với Library74.',
    previous: isEn ? 'Previous' : 'Trước',
    next: isEn ? 'Next' : 'Sau',
    page: isEn ? 'Page' : 'Trang',
    feedback: isEn ? 'Feedback' : 'Góp ý',
  };

  const loadReviews = (nextPage = page) => {
    setLoading(true);
    Promise.all([
      systemReviewsService.getReviews(nextPage, 10, { rating: ratingFilter, sort: sortFilter }),
      systemReviewsService.getSummary(),
    ])
      .then(([reviewsResponse, summaryResponse]) => {
        if (reviewsResponse.code === 200) {
          setReviews(reviewsResponse.data?.content ?? []);
          setTotalPages(reviewsResponse.data?.totalPages ?? 0);
        }
        if (summaryResponse.code === 200 && summaryResponse.data) {
          setSummary(summaryResponse.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews(page);
  }, [page, ratingFilter, sortFilter]);

  useEffect(() => {
    if (userType !== 'student') {
      setMyReview(null);
      return;
    }
    systemReviewsService.getMyReview()
      .then((response) => {
        const review = response.data ?? null;
        setMyReview(review);
        if (review) {
          setRating(review.rating);
          setComment(review.comment);
        }
      })
      .catch(() => setMyReview(null));
  }, [userType]);

  const submitReview = async () => {
    if (userType !== 'student') {
      navigate('/publicpage/login', { state: { from: location.pathname } });
      return;
    }
    const trimmed = comment.trim();
    if (!trimmed) {
      setMessage(copy.emptyContent);
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await systemReviewsService.upsertMyReview({ rating, comment: trimmed });
      if (response.code === 200 && response.data) {
        setMyReview(response.data);
        setMessage(copy.saved);
        loadReviews(0);
        setPage(0);
      }
    } catch (error: any) {
      setMessage(error?.message || copy.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen dark:bg-slate-950">
      <section className="bg-white border-b border-gray-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to={publicPrefix} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft size={16} className="mr-2" /> {copy.backHome}
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 text-yellow-700 px-3 py-1 text-xs font-bold uppercase tracking-wide mb-4 dark:bg-yellow-400/15 dark:text-yellow-200">
                <Star size={14} fill="currentColor" /> {copy.badge}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                {copy.title}
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl dark:text-slate-200">
                {copy.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-2xl p-4 text-center dark:bg-blue-500/20">
                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-100">{summary.averageRating.toFixed(1)}</p>
                <p className="text-xs text-blue-900/70 dark:text-blue-100">{copy.averageStars}</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 text-center dark:bg-emerald-500/20">
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-100">{summary.satisfactionPercent}%</p>
                <p className="text-xs text-emerald-900/70 dark:text-emerald-100">{copy.satisfied}</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4 text-center dark:bg-violet-500/20">
                <p className="text-2xl font-extrabold text-purple-700 dark:text-violet-100">{summary.totalReviews}</p>
                <p className="text-xs text-purple-900/70 dark:text-violet-100">{copy.reviews}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        {!isLibrarianPublic && (
          <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit lg:sticky lg:top-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 dark:bg-blue-500/20 dark:text-blue-200">
              <MessageSquare size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {myReview ? copy.updateYourReview : copy.shareExperience}
            </h2>
            <p className="text-sm text-gray-500 mt-2 dark:text-slate-300">
              {copy.satisfactionRule}
            </p>

            <div className="mt-5 space-y-4">
              <ReviewStarsInput value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={6}
                maxLength={1200}
                placeholder={copy.placeholder}
                disabled={userType !== 'student'}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none disabled:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:disabled:bg-slate-900"
              />
              {message && (
                <div className="rounded-xl bg-blue-50 text-blue-700 text-sm px-4 py-3 dark:bg-blue-500/20 dark:text-blue-100">
                  {message}
                </div>
              )}
              <Button onClick={submitReview} disabled={submitting} fullWidth className="gap-2">
                <Send size={16} />
                {userType === 'student'
                  ? submitting ? copy.saving : myReview ? copy.updateReview : copy.submitReview
                  : copy.loginToReview}
              </Button>
            </div>
          </aside>
        )}

        <div className={isLibrarianPublic ? 'lg:col-span-2' : ''}>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-white">{copy.filterByStars}</span>
              {(['all', 5, 4, 3, 2, 1] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRatingFilter(value);
                    setPage(0);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    ratingFilter === value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:bg-blue-500/15'
                  }`}
                >
                  {value === 'all' ? copy.all : `${value} ${copy.star}`}
                </button>
              ))}
            </div>
            <select
              value={sortFilter}
              onChange={(event) => {
                setSortFilter(event.target.value as SystemReviewSort);
                setPage(0);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="newest">{copy.newest}</option>
              <option value="oldest">{copy.oldest}</option>
              <option value="highest">{copy.highest}</option>
              <option value="lowest">{copy.lowest}</option>
            </select>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 rounded-2xl bg-white border border-gray-100 animate-pulse dark:border-slate-700 dark:bg-slate-900" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <CheckCircle size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white">{copy.noReviews}</p>
              <p className="text-sm text-gray-500 mt-1 dark:text-slate-300">{copy.beFirst}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.reviewId}
                    review={review}
                    satisfiedLabel={copy.satisfied}
                    feedbackLabel={copy.feedback}
                    language={language}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button variant="outline" disabled={page === 0} onClick={() => setPage((prev) => Math.max(prev - 1, 0))}>
                    {copy.previous}
                  </Button>
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-200">
                    {copy.page} {page + 1}/{totalPages}
                  </span>
                  <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((prev) => prev + 1)}>
                    {copy.next}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SystemReviewsPage;
