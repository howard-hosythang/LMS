import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  MessageSquareReply,
  Plus,
  RefreshCcw,
  RotateCcw,
  Send,
  Star,
  UserRound,
  XCircle,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import contactService, {
  ContactCategory,
  ContactMessageCommentResponse,
  ContactMessageResponse,
} from '../../api/contactService';
import { useTranslation } from '../../contexts/LanguageContext';
import usersService, { UserProfileResponse } from '../../api/usersService';

const statusConfig: Record<ContactMessageResponse['status'], { label: string; className: string; icon: any }> = {
  NEW: { label: 'Mới', className: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200', icon: Inbox },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200', icon: Clock3 },
  RESOLVED: { label: 'Đã xử lý', className: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200', icon: CheckCircle2 },
  CLOSED: { label: 'Đã đóng', className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: XCircle },
};

const categories: { value: ContactCategory; label: string; hint: string }[] = [
  { value: 'SYSTEM_ERROR', label: 'Lỗi hệ thống', hint: 'Đăng nhập, tìm kiếm, giao diện, dữ liệu bất thường' },
  { value: 'CIRCULATION', label: 'Mượn / trả sách', hint: 'Đặt trước, nhận sách, gia hạn, trả sách, phí phạt' },
  { value: 'BOOK_SUGGESTION', label: 'Đề xuất sách mới', hint: 'Gửi nhu cầu bổ sung tài liệu cho thư viện' },
  { value: 'ACCOUNT', label: 'Tài khoản', hint: 'Thông tin cá nhân, xác minh, quyền truy cập' },
  { value: 'OTHER', label: 'Vấn đề khác', hint: 'Các yêu cầu không thuộc nhóm trên' },
];

const categoryLabels = categories.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, { GENERAL: 'Chung' });

const statusLabelsEn: Record<ContactMessageResponse['status'], string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const categoryTextEn: Record<string, { label: string; hint: string }> = {
  GENERAL: { label: 'General', hint: 'General support request' },
  SYSTEM_ERROR: { label: 'System issue', hint: 'Login, search, interface, or abnormal data' },
  CIRCULATION: { label: 'Borrowing / returns', hint: 'Reservations, pickup, renewals, returns, fines' },
  BOOK_SUGGESTION: { label: 'Book suggestion', hint: 'Suggest new materials for the library' },
  ACCOUNT: { label: 'Account', hint: 'Personal information, verification, access permissions' },
  OTHER: { label: 'Other issue', hint: 'Requests that do not fit the groups above' },
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Avatar = ({ name, src, className = '' }: { name?: string | null; src?: string | null; className?: string }) => {
  const initials = (name || '?').trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
  if (src) {
    return <img src={src} alt={name || 'avatar'} className={`h-9 w-9 rounded-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white ${className}`}>
      {initials}
    </div>
  );
};

const ContactTicketsPage = () => {
  const { language: uiLanguage } = useTranslation();
  const isEn = uiLanguage === 'en';
  const tt = {
    loadCenterFailed: isEn ? 'Could not load the support center' : 'Không tải được trung tâm hỗ trợ',
    loadInfoFailed: isEn ? 'Could not load support information' : 'Không thể tải thông tin hỗ trợ',
    describeMore: isEn ? 'Please describe your request more clearly before sending' : 'Vui lòng mô tả yêu cầu rõ hơn trước khi gửi',
    replyMore: isEn ? 'Please enter a clearer reply' : 'Vui lòng nhập nội dung phản hồi rõ hơn',
    sent: isEn ? 'Message sent' : 'Đã gửi tin nhắn',
    sendFailed: isEn ? 'Could not send the message' : 'Không gửi được tin nhắn',
    feedbackSaved: isEn ? 'Support rating saved' : 'Đã lưu đánh giá hỗ trợ',
    feedbackFailed: isEn ? 'Could not save the rating' : 'Không thể lưu đánh giá',
    general: isEn ? 'General' : 'Chung',
    createdAt: isEn ? 'Created' : 'Tạo lúc',
    assignee: isEn ? 'Assignee' : 'Phụ trách',
    waitingAssign: isEn ? 'Waiting for assignment' : 'Đang chờ phân công',
    reopen: isEn ? 'Request reopening' : 'Yêu cầu mở lại',
    conversation: isEn ? 'Conversation' : 'Nội dung trao đổi',
    library: isEn ? 'Library' : 'Thư viện',
    you: isEn ? 'You' : 'Bạn',
    ratingRecorded: isEn ? 'Support rating recorded' : 'Đã ghi nhận đánh giá hỗ trợ',
    ratingThanks: isEn ? 'Thank you. Your rating was sent to help the library improve service quality.' : 'Cảm ơn bạn. Đánh giá đã được gửi về hệ thống để thư viện cải thiện chất lượng phục vụ.',
    rateSupport: isEn ? 'Rate support quality' : 'Đánh giá chất lượng hỗ trợ',
    stars: isEn ? 'stars' : 'sao',
    feedbackPlaceholder: isEn ? 'Any additional feedback for the library?' : 'Bạn có góp ý thêm cho thư viện không?',
    saveRating: isEn ? 'Save rating' : 'Lưu đánh giá',
    nextMessage: isEn ? 'Next message' : 'Tin nhắn tiếp theo',
    replyPlaceholder: isEn ? 'Add more information or reply to the library...' : 'Bổ sung thông tin hoặc phản hồi lại thư viện...',
  };
  const [profile, setProfile] = useState<UserProfileResponse['data'] | null>(null);
  const [tickets, setTickets] = useState<ContactMessageResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState<ContactMessageCommentResponse[]>([]);
  const [mode, setMode] = useState<'compose' | 'thread'>('compose');
  const [form, setForm] = useState({
    category: 'SYSTEM_ERROR' as ContactCategory,
    subject: '',
    message: '',
  });
  const [reply, setReply] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => tickets.find((ticket) => String(ticket.id) === String(selectedId)) ?? null,
    [tickets, selectedId],
  );

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'NEW' || ticket.status === 'IN_PROGRESS').length,
    [tickets],
  );

  const latestResolved = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length,
    [tickets],
  );

  const isLocked = selected?.status === 'RESOLVED' || selected?.status === 'CLOSED';

  const loadTickets = async (preferredId?: string) => {
    setLoading(true);
    try {
      const response = await contactService.myTickets();
      const rows = response.data ?? [];
      setTickets(rows);
      const nextId = preferredId && rows.some((row) => String(row.id) === String(preferredId))
        ? preferredId
        : selectedId && rows.some((row) => String(row.id) === String(selectedId))
          ? selectedId
          : rows[0]?.id ?? null;
      setSelectedId(nextId);
      if (nextId) setMode('thread');
    } catch (error: any) {
      toast.error(error?.message || tt.loadCenterFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const [profileResponse] = await Promise.all([
          usersService.getMyProfile().catch(() => null),
          loadTickets(),
        ]);
        if (mounted && profileResponse?.data) setProfile(profileResponse.data);
      } catch {
        if (mounted) toast.error(tt.loadInfoFailed);
      }
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selected?.id || mode !== 'thread') {
      setComments([]);
      return;
    }
    let mounted = true;
    setCommentsLoading(true);
    contactService.comments(String(selected.id))
      .then((response) => {
        if (mounted) setComments(response.data ?? []);
      })
      .catch(() => {
        if (mounted) setComments([]);
      })
      .finally(() => {
        if (mounted) setCommentsLoading(false);
      });
    setFeedbackNote(selected.feedbackNote || '');
    setRating(selected.satisfactionRating || 5);
    return () => {
      mounted = false;
    };
  }, [selected?.id, mode]);

  const selectTicket = (id: string) => {
    setSelectedId(id);
    setMode('thread');
  };

  const replaceSelected = (row: ContactMessageResponse) => {
    setTickets((current) => current.map((ticket) => String(ticket.id) === String(row.id) ? row : ticket));
  };

  const handleCreateTicket = async (event: FormEvent) => {
    event.preventDefault();
    const subject = form.subject.trim();
    const message = form.message.trim();
    if (subject.length < 5 || message.length < 10) {
      toast.error(tt.describeMore);
      return;
    }
    setSaving(true);
    try {
      const response = await contactService.submit({
        category: form.category,
        subject,
        message,
      });
      toast.success(isEn ? `Support request ${response.data.ticketCode} opened` : `Đã mở phiếu hỗ trợ ${response.data.ticketCode}`);
      setForm({ category: 'SYSTEM_ERROR', subject: '', message: '' });
      await loadTickets(String(response.data.id));
      setMode('thread');
    } catch (error: any) {
      toast.error(error?.message || (isEn ? 'Cannot open a support request right now' : 'Không thể mở phiếu hỗ trợ lúc này'));
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!selected) return;
    const body = reply.trim();
    if (body.length < 5) {
      toast.error(tt.replyMore);
      return;
    }
    setSaving(true);
    try {
      const response = await contactService.addComment(String(selected.id), body);
      setComments((current) => [...current, response.data]);
      setReply('');
      toast.success(tt.sent);
      await loadTickets(String(selected.id));
    } catch (error: any) {
      toast.error(error?.message || tt.sendFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await contactService.reopen(String(selected.id));
      replaceSelected(response.data);
      const commentResponse = await contactService.comments(String(selected.id));
      setComments(commentResponse.data ?? []);
      toast.success(isEn ? 'Reopen request sent' : 'Đã yêu cầu mở lại phiếu hỗ trợ');
    } catch (error: any) {
      toast.error(error?.message || (isEn ? 'Cannot reopen this support request' : 'Không thể mở lại phiếu hỗ trợ'));
    } finally {
      setSaving(false);
    }
  };

  const handleFeedback = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await contactService.feedback(String(selected.id), {
        rating,
        note: feedbackNote.trim(),
      });
      replaceSelected(response.data);
      toast.success(tt.feedbackSaved);
    } catch (error: any) {
      toast.error(error?.message || tt.feedbackFailed);
    } finally {
      setSaving(false);
    }
  };

  const StatusBadge = ({ value }: { value: ContactMessageResponse['status'] }) => {
    const cfg = statusConfig[value];
    const Icon = cfg.icon;
    const label = isEn ? statusLabelsEn[value] : cfg.label;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cfg.className}`}>
        <Icon size={13} />
        {label}
      </span>
    );
  };

  return (
    <div className="w-full max-w-none space-y-5 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{isEn ? 'Support center' : 'Trung tâm hỗ trợ'}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{isEn ? 'Contact & support' : 'Liên hệ & hỗ trợ'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {isEn ? 'Open a support request, track progress, and chat with librarians in one place.' : 'Mở yêu cầu hỗ trợ mới, theo dõi tiến độ và trao đổi trực tiếp với thủ thư trong cùng một màn hình.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('compose');
              setSelectedId(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            {isEn ? 'New request' : 'Phiếu hỗ trợ mới'}
          </button>
          <button
            type="button"
            onClick={() => loadTickets()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            {isEn ? 'Refresh' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{isEn ? 'Open' : 'Đang mở'}</span>
            <Clock3 size={18} className="text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{openTickets}</p>
        </div>
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{isEn ? 'Resolved' : 'Đã xử lý'}</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{latestResolved}</p>
        </div>
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{isEn ? 'Sender account' : 'Tài khoản gửi'}</span>
            <UserRound size={18} className="text-blue-500" />
          </div>
          <p className="mt-3 truncate text-sm font-bold text-slate-950 dark:text-white">{profile?.email || (isEn ? 'Loading...' : 'Đang tải...')}</p>
        </div>
      </div>

      <div className="grid min-h-[720px] overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 lg:grid-cols-[440px_1fr] 2xl:grid-cols-[500px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-950 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? 'My support requests' : 'Phiếu hỗ trợ của tôi'}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tickets.length} {isEn ? 'requests, sorted by latest update' : 'yêu cầu, sắp xếp theo cập nhật mới nhất'}</p>
          </div>
          <div className="max-h-[650px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{isEn ? 'Loading support requests...' : 'Đang tải phiếu hỗ trợ...'}</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {isEn ? 'No support requests yet. Create the first one on the right.' : 'Chưa có phiếu hỗ trợ nào. Tạo phiếu đầu tiên ở khung bên phải.'}
              </div>
            ) : tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => selectTicket(String(ticket.id))}
                className={`w-full border-b border-slate-200 p-4 text-left transition dark:border-slate-800 ${mode === 'thread' && String(selected?.id) === String(ticket.id) ? 'bg-blue-50 text-blue-950 shadow-[inset_4px_0_0_#2563eb] dark:bg-blue-500/15 dark:text-white dark:shadow-[inset_4px_0_0_#60a5fa]' : 'bg-transparent hover:bg-white dark:hover:bg-slate-900'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-slate-100">{ticket.subject}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{ticket.ticketCode}</p>
                  </div>
                  <StatusBadge value={ticket.status} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {isEn ? categoryTextEn[ticket.category]?.label || tt.general : categoryLabels[ticket.category] || tt.general}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDateTime(ticket.updatedAt)}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{ticket.message}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0">
          {mode === 'compose' ? (
            <div className="grid h-full grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
              <section className="p-6 lg:p-8">
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{isEn ? 'New request' : 'Phiếu hỗ trợ mới'}</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{isEn ? 'What do you need help with?' : 'Bạn cần thư viện hỗ trợ gì?'}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {isEn ? 'This request uses your current account email. You do not need to enter it manually.' : 'Phiếu hỗ trợ sẽ dùng email của tài khoản hiện tại. Bạn không cần nhập email thủ công.'}
                  </p>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-5">
                  <div>
                    <label htmlFor="category" className="mb-2 block text-sm font-bold text-slate-700">
                      {isEn ? 'Support category' : 'Nhóm hỗ trợ'}
                    </label>
                    <select
                      id="category"
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ContactCategory }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {isEn ? categoryTextEn[category.value]?.label : category.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">
                      {isEn ? categoryTextEn[form.category]?.hint : categories.find((item) => item.value === form.category)?.hint}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="subject" className="mb-2 block text-sm font-bold text-slate-700">
                      {isEn ? 'Subject' : 'Tiêu đề'}
                    </label>
                    <input
                      id="subject"
                      value={form.subject}
                      onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                      placeholder={isEn ? 'Example: My reserved book is missing from the pickup list' : 'Ví dụ: Không thấy sách đã đặt trong danh sách nhận'}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-bold text-slate-700">
                      {isEn ? 'Message' : 'Nội dung'}
                    </label>
                    <textarea
                      id="message"
                      value={form.message}
                      onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                      rows={10}
                      placeholder={isEn ? 'Describe the issue, book or transaction code if any, when it happened, and your expected resolution.' : 'Mô tả vấn đề, mã sách/mã giao dịch nếu có, thời điểm xảy ra và mong muốn xử lý.'}
                      className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Send size={16} />
                    {saving ? (isEn ? 'Opening request...' : 'Đang mở phiếu...') : (isEn ? 'Open request' : 'Mở phiếu hỗ trợ')}
                  </button>
                </form>
              </section>

              <aside className="border-t border-slate-200 bg-slate-50 p-6 xl:border-l xl:border-t-0">
                <div className="border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-blue-900">
                    <AlertCircle size={17} />
                    {isEn ? 'Sender information' : 'Thông tin người gửi'}
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-bold uppercase text-blue-500">{isEn ? 'Full name' : 'Họ tên'}</dt>
                      <dd className="mt-1 font-bold text-blue-950">{profile?.fullName || (isEn ? 'Loading...' : 'Đang tải...')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase text-blue-500">Email</dt>
                      <dd className="mt-1 break-all font-bold text-blue-950">{profile?.email || (isEn ? 'Loading...' : 'Đang tải...')}</dd>
                    </div>
                  </dl>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                  <p className="font-bold text-slate-900">{isEn ? 'Tips for faster handling' : 'Gợi ý để được xử lý nhanh'}</p>
                  <p>{isEn ? 'Choose the right category, write a concise subject, and include book or transaction codes for circulation issues.' : 'Chọn đúng nhóm hỗ trợ, viết tiêu đề ngắn gọn và gửi thêm mã sách hoặc mã giao dịch nếu yêu cầu liên quan đến mượn/trả.'}</p>
                </div>
              </aside>
            </div>
          ) : selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={selected.status} />
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selected.ticketCode}</span>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{isEn ? categoryTextEn[selected.category]?.label || tt.general : categoryLabels[selected.category] || tt.general}</span>
                    </div>
                    <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">{selected.subject}</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {tt.createdAt} {formatDateTime(selected.createdAt)} · {tt.assignee}: {selected.assignedToName || tt.waitingAssign}
                    </p>
                  </div>
                  {isLocked && (
                    <button
                      type="button"
                      onClick={handleReopen}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                    >
                      <RotateCcw size={16} />
                      {tt.reopen}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/50 p-6 dark:bg-slate-950">
                <section className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                      <MessageSquareReply size={16} />
                      {tt.conversation}
                    </div>
                      {commentsLoading && <span className="text-xs text-slate-400 dark:text-slate-500">{isEn ? 'Loading...' : 'Đang tải...'}</span>}
                  </div>
                  <div className="max-h-[420px] space-y-4 overflow-y-auto p-5">
                    {comments.length === 0 ? (
                      <div className="border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                        {isEn ? 'No messages in this request yet.' : 'Chưa có tin nhắn nào trong phiếu hỗ trợ này.'}
                      </div>
                    ) : comments.map((comment) => {
                      const isUser = comment.authorRole === 'USER';
                      return (
                        <div key={comment.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                          {!isUser && <Avatar name={comment.authorName} src={comment.authorAvatarUrl} />}
                          <div className={`max-w-[88%] rounded-2xl border p-4 ${isUser ? 'border-blue-100 bg-blue-50 text-blue-950 dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-50' : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}>
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                              <span>{comment.authorName}</span>
                              <span className="text-slate-400 dark:text-slate-500">·</span>
                              <span className="text-slate-500 dark:text-slate-300">{isUser ? tt.you : tt.library}</span>
                              <span className="text-slate-400 dark:text-slate-500">·</span>
                              <span className="text-slate-500 dark:text-slate-300">{formatDateTime(comment.createdAt)}</span>
                            </div>
                            <p className="whitespace-pre-line text-sm leading-7">{comment.body}</p>
                          </div>
                          {isUser && <Avatar name={comment.authorName} src={comment.authorAvatarUrl} />}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {isLocked ? (
                  selected.satisfactionRating ? (
                    <section className="border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-100">
                        <CheckCircle2 size={17} />
                        {tt.ratingRecorded}
                      </div>
                      <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
                        {tt.ratingThanks}
                      </p>
                    </section>
                  ) : (
                  <section className="border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
                      <Star size={17} />
                      {tt.rateSupport}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`rounded-lg border px-3 py-2 text-sm font-bold ${rating === value ? 'border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}
                        >
                          {value} {tt.stars}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={feedbackNote}
                      onChange={(event) => setFeedbackNote(event.target.value)}
                      rows={3}
                      placeholder={tt.feedbackPlaceholder}
                      className="mt-3 w-full resize-none rounded-lg border border-emerald-200 bg-white p-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-emerald-500/30 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleFeedback}
                      disabled={saving}
                      className="mt-3 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {tt.saveRating}
                    </button>
                  </section>
                  )
                ) : (
                  <section className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{tt.nextMessage}</label>
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={4}
                      placeholder={tt.replyPlaceholder}
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleReply}
                      disabled={saving}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Send size={16} />
                      {isEn ? 'Send message' : 'Gửi tin nhắn'}
                    </button>
                  </section>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-slate-400">
              <Inbox size={48} />
              <p className="mt-3 text-sm">{isEn ? 'Select a request or create a new one.' : 'Chọn một phiếu hỗ trợ hoặc tạo phiếu mới.'}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ContactTicketsPage;
