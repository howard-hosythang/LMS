import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  BookPlus,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ReceiptText,
  RotateCcw,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import librarianDashboardService, {
  ReaderActivity,
  ReaderProfile,
} from '../../api/librarianDashboardService';
import recommendationService, { RecommendedPublication } from '../../api/recommendationService';
import { useLanguage } from '../../contexts/LanguageContext';

type ReaderRef = {
  userId?: string | number | null;
  studentId?: string | null;
  fullName?: string | null;
};

type LoadState<T> = {
  loading: boolean;
  data: T;
  error: string;
};

const copy = {
  vi: {
    title: 'Reader 360',
    profile: 'Định danh',
    credit: 'Tín nhiệm và nợ phạt',
    recommendation: 'AI khuyến nghị',
    timeline: 'Lịch sử vòng đời',
    studentId: 'MSSV',
    email: 'Email',
    faculty: 'Khoa/Chuyên ngành',
    activeBorrow: 'Đang mượn',
    unpaidFine: 'Nợ phạt',
    reputation: 'Điểm tín nhiệm',
    stats: 'Số liệu quan trọng',
    totalBorrowed: 'Từng mượn',
    returnedCount: 'Đã trả',
    overdueCount: 'Đang quá hạn',
    fineCount: 'Lượt phạt',
    damagedLostCount: 'Hỏng / mất',
    paidFineAmount: 'Đã nộp phạt',
    blocked: 'Cảnh báo: hạn chế mượn mới',
    healthy: 'Đủ điều kiện thao tác',
    borrowNow: 'Mượn ngay',
    noRecommendation: 'Chưa có gợi ý phù hợp.',
    noTimeline: 'Chưa có hoạt động gần đây.',
    loadError: 'Không tải được dữ liệu bạn đọc.',
    aiError: 'Không tải được khuyến nghị AI.',
    timelineError: 'Không tải được lịch sử.',
    unknownReader: 'Bạn đọc',
  },
  en: {
    title: 'Reader 360',
    profile: 'Identity',
    credit: 'Credit and health',
    recommendation: 'AI recommendations',
    timeline: 'Activity timeline',
    studentId: 'Student ID',
    email: 'Email',
    faculty: 'Faculty/Major',
    activeBorrow: 'Borrowing',
    unpaidFine: 'Unpaid fines',
    reputation: 'Reputation score',
    stats: 'Key metrics',
    totalBorrowed: 'Borrowed total',
    returnedCount: 'Returned',
    overdueCount: 'Current overdue',
    fineCount: 'Fine events',
    damagedLostCount: 'Damaged / lost',
    paidFineAmount: 'Paid fines',
    blocked: 'Warning: new borrowing restricted',
    healthy: 'Eligible for desk actions',
    borrowNow: 'Borrow now',
    noRecommendation: 'No matching suggestions yet.',
    noTimeline: 'No recent activity.',
    loadError: 'Unable to load reader data.',
    aiError: 'Unable to load AI suggestions.',
    timelineError: 'Unable to load history.',
    unknownReader: 'Reader',
  },
} as const;

const money = (value?: number | null) =>
  Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const number = (value?: number | null, language: 'vi' | 'en' = 'vi') =>
  Number(value || 0).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');

const prettyFaculty = (value?: string | null) => {
  if (!value) return '-';
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const scoreTone = (score: number) => {
  if (score > 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' };
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-100' };
};

const activityIcon = (type: ReaderActivity['type']) => {
  if (type === 'BORROW') return BookOpenCheck;
  if (type === 'RETURN') return RotateCcw;
  if (type === 'FINE_PAID') return Banknote;
  if (type === 'DAMAGE_REPORT' || type === 'LOST_REPORT') return ShieldAlert;
  return Clock3;
};

const SkeletonLine = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-slate-100 dark:bg-slate-800 ${className}`} />
);

const ReaderProfileDrawer = ({
  reader,
  onClose,
}: {
  reader: ReaderRef | null;
  onClose: () => void;
}) => {
  const { language } = useLanguage();
  const c = copy[language];
  const [profileState, setProfileState] = useState<LoadState<ReaderProfile | null>>({ loading: false, data: null, error: '' });
  const [recommendationState, setRecommendationState] = useState<LoadState<RecommendedPublication[]>>({ loading: false, data: [], error: '' });
  const [timelineState, setTimelineState] = useState<LoadState<ReaderActivity[]>>({ loading: false, data: [], error: '' });

  const open = Boolean(reader);
  const profile = profileState.data;
  const score = profile?.creditScore ?? 100;
  const tone = scoreTone(score);
  const borrowPercent = profile?.borrowLimit ? Math.min(100, Math.round((profile.activeBorrows / profile.borrowLimit) * 100)) : 0;
  const facultyName = profile ? (profile.facultyDisplayName || profile.major || prettyFaculty(profile.faculty)) : '-';

  const params = useMemo(() => ({
    userId: reader?.userId || undefined,
    studentId: reader?.studentId || undefined,
  }), [reader?.userId, reader?.studentId]);

  useEffect(() => {
    if (!reader) return;
    let cancelled = false;
    setProfileState({ loading: true, data: null, error: '' });
    setRecommendationState({ loading: true, data: [], error: '' });
    setTimelineState({ loading: true, data: [], error: '' });

    librarianDashboardService.getReaderProfile(params)
      .then((res) => {
        if (cancelled) return;
        setProfileState({ loading: false, data: res.data, error: '' });

        recommendationService.getReaderRecommendationsForLibrarian(res.data.userId, res.data.major || res.data.faculty, 3)
          .then((recRes) => !cancelled && setRecommendationState({ loading: false, data: recRes.data || [], error: '' }))
          .catch(() => !cancelled && setRecommendationState({ loading: false, data: [], error: c.aiError }));

        librarianDashboardService.getReaderTimeline({ userId: res.data.userId }, 10)
          .then((timelineRes) => !cancelled && setTimelineState({ loading: false, data: timelineRes.data || [], error: '' }))
          .catch(() => !cancelled && setTimelineState({ loading: false, data: [], error: c.timelineError }));
      })
      .catch(() => {
        if (cancelled) return;
        setProfileState({ loading: false, data: null, error: c.loadError });
        setRecommendationState({ loading: false, data: [], error: '' });
        setTimelineState({ loading: false, data: [], error: '' });
      });

    return () => {
      cancelled = true;
    };
  }, [reader, params, c.aiError, c.loadError, c.timelineError]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-slate-950/35" type="button" aria-label="Close reader drawer" onClick={onClose} />
      <aside className="relative z-10 flex h-[min(92vh,1040px)] w-full max-w-[960px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-950 max-sm:h-full max-sm:rounded-none">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.title}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
              {profile?.fullName || reader.fullName || c.unknownReader}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {profileState.loading && (
            <div className="space-y-4">
              <SkeletonLine className="h-24" />
              <SkeletonLine className="h-36" />
            </div>
          )}

          {profileState.error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {profileState.error}
            </div>
          )}

          {profile && (
            <div className="space-y-5">
              <section className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{c.profile}</p>
                <div className="mx-auto mt-4 flex max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-200">
                    {profile.profilePictureUrl ? (
                      <img src={profile.profilePictureUrl} alt={profile.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={28} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-black text-slate-950 dark:text-white">{profile.fullName}</h3>
                    <div className="mt-2 grid gap-2 text-sm text-slate-600 dark:text-slate-200 sm:grid-cols-2">
                      <span className="truncate"><b>{c.studentId}:</b> {profile.studentId || '-'}</span>
                      <span className="truncate"><b>{c.email}:</b> {profile.email || '-'}</span>
                      <span className="flex min-w-0 items-center justify-center gap-1 sm:col-span-2 sm:justify-start">
                        <GraduationCap size={15} className="shrink-0 text-blue-600" />
                        <b>{c.faculty}:</b> <span className="truncate">{facultyName}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{c.credit}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs font-bold text-slate-500">{c.activeBorrow}</p>
                    <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{profile.activeBorrows}/{profile.borrowLimit}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${borrowPercent}%` }} />
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs font-bold text-slate-500">{c.unpaidFine}</p>
                    <p className={`mt-1 text-xl font-black ${profile.unpaidFineAmount > 0 ? 'text-red-600' : 'text-slate-950 dark:text-white'}`}>
                      {money(profile.unpaidFineAmount)}
                    </p>
                  </div>
                  <div className={`rounded-lg border p-3 ${tone.bg}`}>
                    <p className="text-xs font-bold text-slate-500">{c.reputation}</p>
                    <p className={`mt-1 text-2xl font-black ${tone.text}`}>{score}/100</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${profile.borrowingBlocked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {profile.borrowingBlocked ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  {profile.borrowingBlocked ? c.blocked : c.healthy}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{c.stats}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    [c.totalBorrowed, number(profile.totalBorrowed, language)],
                    [c.returnedCount, number(profile.returnedCount, language)],
                    [c.overdueCount, number(profile.overdueCount, language)],
                    [c.fineCount, number(profile.fineCount, language)],
                    [c.damagedLostCount, `${number(profile.damagedFineCount, language)} / ${number(profile.lostFineCount, language)}`],
                    [c.paidFineAmount, money(profile.paidFineAmount)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs font-bold text-slate-500">{label}</p>
                      <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{c.recommendation}</p>
                <div className="mt-4 space-y-3">
                  {recommendationState.loading && [0, 1, 2].map((item) => <SkeletonLine key={item} className="h-20" />)}
                  {recommendationState.error && <p className="text-sm font-semibold text-red-600">{recommendationState.error}</p>}
                  {!recommendationState.loading && !recommendationState.error && recommendationState.data.length === 0 && (
                    <p className="text-sm text-slate-500">{c.noRecommendation}</p>
                  )}
                  {recommendationState.data.map((book) => (
                    <div key={book.publicationId} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                        {book.coverImageUrl && <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-black text-slate-950 dark:text-white">{book.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{book.authorNames?.join(', ') || '-'}</p>
                      </div>
                      <Link
                        to={`/librarianpage/circulation?studentId=${encodeURIComponent(profile.studentId || '')}&publicationId=${encodeURIComponent(book.publicationId)}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-700"
                      >
                        <BookPlus size={14} /> {c.borrowNow}
                      </Link>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{c.timeline}</p>
                <div className="mt-4 space-y-4">
                  {timelineState.loading && [0, 1, 2, 3].map((item) => <SkeletonLine key={item} className="h-12" />)}
                  {timelineState.error && <p className="text-sm font-semibold text-red-600">{timelineState.error}</p>}
                  {!timelineState.loading && !timelineState.error && timelineState.data.length === 0 && (
                    <p className="text-sm text-slate-500">{c.noTimeline}</p>
                  )}
                  {timelineState.data.map((event, index) => {
                    const Icon = activityIcon(event.type);
                    return (
                      <div key={`${event.type}-${event.id}-${index}`} className="relative flex gap-3">
                        {index < timelineState.data.length - 1 && <div className="absolute left-4 top-9 h-full w-px bg-slate-200 dark:bg-slate-800" />}
                        <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-100">
                          {event.type === 'FINE_PAID' ? <ReceiptText size={15} /> : <Icon size={15} />}
                        </div>
                        <div className="min-w-0 pb-1">
                          <p className="text-sm font-black text-slate-950 dark:text-white">{event.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {new Date(event.occurredAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                            {event.description ? ` · ${event.description}` : ''}
                            {event.amount ? ` · ${money(event.amount)}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export type { ReaderRef };
export default ReaderProfileDrawer;
