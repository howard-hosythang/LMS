import {
  CheckCircle2,
  Clock3,
  Edit2,
  Inbox,
  MessageSquareReply,
  RefreshCcw,
  Search,
  Send,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import contactService, { ContactInternalNoteResponse, ContactMessageCommentResponse, ContactMessageResponse } from '../../api/contactService';
import usersService, { UserProfileResponse } from '../../api/usersService';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useTranslation } from '../../contexts/LanguageContext';

type StatusFilter = 'ALL' | ContactMessageResponse['status'];

type ResponseTemplate = {
  id: string;
  label: string;
  category?: string;
  tone: string;
  body: string;
};

const statusConfig: Record<ContactMessageResponse['status'], { label: string; className: string; icon: any }> = {
  NEW: { label: 'Mới', className: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200', icon: Inbox },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200', icon: Clock3 },
  RESOLVED: { label: 'Đã xử lý', className: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200', icon: CheckCircle2 },
  CLOSED: { label: 'Đã đóng', className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: XCircle },
};

const filters: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'NEW', label: 'Mới' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

const statusLabelsEn: Record<ContactMessageResponse['status'], string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const filterLabelsEn: Record<StatusFilter, string> = {
  ALL: 'All',
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const categoryLabels: Record<string, string> = {
  GENERAL: 'Chung',
  SYSTEM_ERROR: 'Lỗi hệ thống',
  CIRCULATION: 'Mượn / trả sách',
  BOOK_SUGGESTION: 'Đề xuất sách mới',
  ACCOUNT: 'Tài khoản',
  OTHER: 'Vấn đề khác',
};

const categoryLabelsEn: Record<string, string> = {
  GENERAL: 'General',
  SYSTEM_ERROR: 'System issue',
  CIRCULATION: 'Borrowing / returns',
  BOOK_SUGGESTION: 'Book suggestion',
  ACCOUNT: 'Account',
  OTHER: 'Other issue',
};

const responseTemplates: ResponseTemplate[] = [
  {
    id: 'acknowledge',
    label: 'Đã tiếp nhận',
    tone: 'Mở đầu',
    body: 'Chào {senderName},\n\nThư viện đã tiếp nhận yêu cầu {ticketCode} của bạn. Mình đang kiểm tra thông tin liên quan và sẽ phản hồi lại trong yêu cầu này ngay khi có kết quả.\n\nCảm ơn bạn đã cung cấp thông tin.',
  },
  {
    id: 'need-more-info',
    label: 'Cần bổ sung thông tin',
    tone: 'Xác minh',
    body: 'Chào {senderName},\n\nĐể xử lý chính xác yêu cầu {ticketCode}, bạn vui lòng bổ sung thêm giúp thư viện các thông tin sau:\n- Mã sách hoặc tên sách liên quan\n- Mã giao dịch/mã đặt trước nếu có\n- Thời điểm bạn gặp vấn đề\n- Ảnh chụp màn hình nếu lỗi xuất hiện trên hệ thống\n\nSau khi nhận đủ thông tin, mình sẽ kiểm tra và phản hồi tiếp trong phiếu này.',
  },
  {
    id: 'circulation-status',
    label: 'Kiểm tra mượn/trả',
    category: 'CIRCULATION',
    tone: 'Mượn/trả',
    body: 'Chào {senderName},\n\nMình đã kiểm tra yêu cầu {ticketCode} liên quan đến mượn/trả sách. Thư viện sẽ đối chiếu lại trạng thái giao dịch, bản sao sách và lịch sử cập nhật trên hệ thống.\n\nNếu có mã giao dịch hoặc mã vạch bản sao, bạn gửi thêm giúp mình để xử lý nhanh hơn nhé.',
  },
  {
    id: 'circulation-updated',
    label: 'Đã cập nhật giao dịch',
    category: 'CIRCULATION',
    tone: 'Hoàn tất',
    body: 'Chào {senderName},\n\nThư viện đã kiểm tra và cập nhật lại trạng thái giao dịch liên quan đến yêu cầu {ticketCode}. Bạn vui lòng tải lại trang hoặc kiểm tra lại mục sách/ giao dịch của mình.\n\nNếu trạng thái vẫn chưa đúng, bạn phản hồi trực tiếp trong phiếu này để mình kiểm tra tiếp.',
  },
  {
    id: 'system-investigating',
    label: 'Đang kiểm tra lỗi hệ thống',
    category: 'SYSTEM_ERROR',
    tone: 'Kỹ thuật',
    body: 'Chào {senderName},\n\nMình đã ghi nhận lỗi hệ thống trong yêu cầu {ticketCode}. Thư viện đang kiểm tra lại dữ liệu và luồng thao tác liên quan.\n\nTrong lúc chờ xử lý, bạn có thể gửi thêm ảnh chụp màn hình hoặc mô tả các bước đã thực hiện trước khi lỗi xảy ra để đội phụ trách kiểm tra nhanh hơn.',
  },
  {
    id: 'account-check',
    label: 'Kiểm tra tài khoản',
    category: 'ACCOUNT',
    tone: 'Tài khoản',
    body: 'Chào {senderName},\n\nMình đang kiểm tra thông tin tài khoản liên quan đến yêu cầu {ticketCode}. Vì lý do bảo mật, thư viện chỉ phản hồi và xử lý trực tiếp trên tài khoản đang đăng nhập của bạn.\n\nBạn vui lòng không gửi mật khẩu hoặc thông tin nhạy cảm trong yêu cầu này.',
  },
  {
    id: 'book-suggestion',
    label: 'Ghi nhận đề xuất sách',
    category: 'BOOK_SUGGESTION',
    tone: 'Đề xuất',
    body: 'Chào {senderName},\n\nThư viện đã ghi nhận đề xuất sách trong yêu cầu {ticketCode}. Mình sẽ chuyển thông tin này vào danh sách xem xét bổ sung tài liệu.\n\nNếu có thể, bạn gửi thêm tên tác giả, nhà xuất bản, năm xuất bản hoặc link tham khảo để hội đồng bổ sung tài liệu đánh giá thuận tiện hơn.',
  },
  {
    id: 'resolved',
    label: 'Thông báo đã xử lý',
    tone: 'Kết thúc',
    body: 'Chào {senderName},\n\nYêu cầu {ticketCode} đã được thư viện xử lý xong. Bạn vui lòng kiểm tra lại giúp mình.\n\nNếu mọi thứ đã ổn, bạn có thể đánh giá chất lượng hỗ trợ sau khi phiếu được đánh dấu đã xử lý. Nếu vẫn còn vấn đề, bạn phản hồi lại trong yêu cầu này để mình tiếp tục hỗ trợ.',
  },
];

const responseTemplatesEn: ResponseTemplate[] = [
  {
    id: 'acknowledge',
    label: 'Acknowledged',
    tone: 'Opening',
    body: 'Hi {senderName},\n\nThe library has received your request {ticketCode}. I am checking the related information and will reply in this request as soon as there is an update.\n\nThank you for providing the details.',
  },
  {
    id: 'need-more-info',
    label: 'Need more information',
    tone: 'Verification',
    body: 'Hi {senderName},\n\nTo handle request {ticketCode} accurately, please add the following information:\n- Related book code or book title\n- Transaction/reservation code, if any\n- When the issue happened\n- A screenshot if the issue appears in the system\n\nAfter receiving enough information, I will continue checking and reply here.',
  },
  {
    id: 'circulation-status',
    label: 'Check borrowing/return',
    category: 'CIRCULATION',
    tone: 'Circulation',
    body: 'Hi {senderName},\n\nI have checked request {ticketCode} related to borrowing/returning books. The library will verify the transaction status, copy status, and system update history.\n\nIf you have a transaction code or copy barcode, please send it so we can handle this faster.',
  },
  {
    id: 'circulation-updated',
    label: 'Transaction updated',
    category: 'CIRCULATION',
    tone: 'Complete',
    body: 'Hi {senderName},\n\nThe library has checked and updated the transaction status related to request {ticketCode}. Please refresh the page or check your books/transactions again.\n\nIf the status is still incorrect, reply in this request and I will continue checking.',
  },
  {
    id: 'system-investigating',
    label: 'Investigating system issue',
    category: 'SYSTEM_ERROR',
    tone: 'Technical',
    body: 'Hi {senderName},\n\nI have recorded the system issue in request {ticketCode}. The library is checking the related data and workflow.\n\nWhile we investigate, please send a screenshot or the steps you took before the issue happened so the team can check faster.',
  },
  {
    id: 'account-check',
    label: 'Account check',
    category: 'ACCOUNT',
    tone: 'Account',
    body: 'Hi {senderName},\n\nI am checking the account information related to request {ticketCode}. For security reasons, the library only replies and handles this directly on your signed-in account.\n\nPlease do not send passwords or sensitive information in this request.',
  },
  {
    id: 'book-suggestion',
    label: 'Book suggestion recorded',
    category: 'BOOK_SUGGESTION',
    tone: 'Suggestion',
    body: 'Hi {senderName},\n\nThe library has recorded the book suggestion in request {ticketCode}. I will move this information to the material acquisition review list.\n\nIf possible, please add the author, publisher, publication year, or a reference link for easier review.',
  },
  {
    id: 'resolved',
    label: 'Resolved notice',
    tone: 'Closing',
    body: 'Hi {senderName},\n\nRequest {ticketCode} has been handled by the library. Please check it again.\n\nIf everything is fine, you can rate the support quality after this request is marked resolved. If the issue remains, reply here so I can continue supporting you.',
  },
];

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

const decodeCurrentUserId = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
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

type ContactInboxProps = {
  readOnly?: boolean;
};

const ContactInbox = ({ readOnly = false }: ContactInboxProps) => {
  const dialog = useAppDialog();
  const { language: uiLanguage } = useTranslation();
  const isEn = uiLanguage === 'en';
  const tt = {
    loadInboxFailed: isEn ? 'Could not load the contact inbox' : 'Không tải được hộp thư liên hệ',
    updateSuccess: isEn ? 'Support request updated' : 'Đã cập nhật yêu cầu liên hệ',
    updateFailed: isEn ? 'Could not update the request' : 'Không thể cập nhật yêu cầu',
    messageTooShort: isEn ? 'The message needs to be clearer' : 'Nội dung tin nhắn cần rõ ràng hơn',
    sendFailed: isEn ? 'Could not send the message' : 'Không thể gửi tin nhắn',
    userFallback: isEn ? 'the user' : 'bạn',
    librarianFallback: isEn ? 'librarian' : 'thủ thư',
    statusFailed: isEn ? 'Could not update status' : 'Không thể cập nhật trạng thái',
    noteTooShort: isEn ? 'Please enter a clearer note' : 'Vui lòng nhập ghi chú rõ hơn',
    noteSaved: isEn ? 'Internal note saved' : 'Đã lưu ghi chú nội bộ',
    noteSaveFailed: isEn ? 'Could not save the note' : 'Không thể lưu ghi chú',
    noteUpdated: isEn ? 'Note updated' : 'Đã cập nhật ghi chú',
    noteUpdateFailed: isEn ? 'Could not update the note' : 'Không thể cập nhật ghi chú',
    noteDeleted: isEn ? 'Note deleted' : 'Đã xóa ghi chú',
    noteDeleteFailed: isEn ? 'Could not delete the note' : 'Không thể xóa ghi chú',
    selectRequest: isEn ? 'Select a request to handle.' : 'Chọn một yêu cầu để xử lý.',
    noPhone: isEn ? 'No phone number' : 'Chưa có SĐT',
    assignee: isEn ? 'Assignee' : 'Phụ trách',
    unassigned: isEn ? 'Unassigned' : 'Chưa phân công',
    librarianCode: isEn ? 'Librarian code' : 'Mã thủ thư',
    readOnlyOther: isEn ? 'View only' : 'Chỉ xem',
    otherLibrarian: isEn ? 'another librarian' : 'thủ thư khác',
    handling: isEn ? 'is handling' : 'đang xử lý',
    assign: isEn ? 'Assign to me' : 'Nhận xử lý',
    resolved: isEn ? 'Resolved' : 'Đã xử lý',
    conversation: isEn ? 'Conversation' : 'Nội dung trao đổi',
    loading: isEn ? 'Loading...' : 'Đang tải...',
    noConversation: isEn ? 'No conversation yet.' : 'Chưa có nội dung trao đổi.',
    librarian: isEn ? 'Librarian' : 'Thủ thư',
    sender: isEn ? 'Sender' : 'Người gửi',
    internalNotes: isEn ? 'Internal notes' : 'Ghi chú nội bộ',
    notePlaceholder: isEn ? 'Add an internal note. Users cannot see this content.' : 'Thêm ghi chú nội bộ. Người dùng không nhìn thấy nội dung này.',
    addNote: isEn ? 'Add note' : 'Thêm ghi chú',
    notesLoading: isEn ? 'Loading notes...' : 'Đang tải ghi chú...',
    noNotes: isEn ? 'No internal notes yet.' : 'Chưa có ghi chú nội bộ.',
    save: isEn ? 'Save' : 'Lưu',
    cancel: isEn ? 'Cancel' : 'Hủy',
    edit: isEn ? 'Edit' : 'Sửa',
    delete: isEn ? 'Delete' : 'Xóa',
    userRating: isEn ? 'User rating' : 'Đánh giá từ người dùng',
    noRating: isEn ? 'No score yet' : 'Chưa có điểm',
    stars: isEn ? 'stars' : 'sao',
    replyMessage: isEn ? 'Reply message' : 'Tin nhắn phản hồi',
    quickTemplates: isEn ? 'Quick response templates' : 'Mẫu phản hồi nhanh',
    templateHelp: isEn ? 'Choose a suitable template, then edit it before sending to the user.' : 'Chọn mẫu phù hợp rồi chỉnh lại trước khi gửi cho người dùng.',
    sending: isEn ? 'Sending...' : 'Đang gửi...',
    sendMessage: isEn ? 'Send message' : 'Gửi tin nhắn',
    general: isEn ? 'General' : 'Chung',
  };
  const [profile, setProfile] = useState<UserProfileResponse['data'] | null>(null);
  const [messages, setMessages] = useState<ContactMessageResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState('');
  const [internalNotes, setInternalNotes] = useState<ContactInternalNoteResponse[]>([]);
  const [comments, setComments] = useState<ContactMessageCommentResponse[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  const selected = useMemo(
    () => messages.find((message) => String(message.id) === String(selectedId)) ?? messages[0] ?? null,
    [messages, selectedId],
  );

  const counts = useMemo(() => ({
    NEW: messages.filter((item) => item.status === 'NEW').length,
    IN_PROGRESS: messages.filter((item) => item.status === 'IN_PROGRESS').length,
    RESOLVED: messages.filter((item) => item.status === 'RESOLVED').length,
    CLOSED: messages.filter((item) => item.status === 'CLOSED').length,
  }), [messages]);

  const filteredMessages = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return messages.filter((message) => {
      if (status !== 'ALL' && message.status !== status) return false;
      if (!q) return true;
      return [
        message.ticketCode,
        message.senderName,
        message.senderEmail,
        message.subject,
        message.message,
      ].some((value) => (value || '').toLowerCase().includes(q));
    });
  }, [messages, status, keyword]);

  const currentUserId = profile?.id ? String(profile.id) : decodeCurrentUserId();
  const assignedToMe = Boolean(
    selected?.assignedToCurrentUser ||
    (selected?.assignedToUserId && currentUserId && String(selected.assignedToUserId) === currentUserId)
  );
  const isAssignedToOther = Boolean(selected?.assignedToUserId && !assignedToMe);
  const isResolved = selected?.status === 'RESOLVED';
  const isClosed = selected?.status === 'CLOSED';
  const canAssign = !readOnly && Boolean(selected) && !isResolved && !isClosed && (!selected?.assignedToUserId || assignedToMe);
  const canResolve = !readOnly && Boolean(selected) && assignedToMe && !isResolved && !isClosed;
  const canClose = !readOnly && Boolean(selected) && assignedToMe && !isClosed;
  const canEditNote = !readOnly && Boolean(selected);
  const canSendMessage = !readOnly && Boolean(selected) && assignedToMe && !isResolved && !isClosed;
  const suggestedTemplates = useMemo(() => {
    if (!selected) return responseTemplates;
    const templates = isEn ? responseTemplatesEn : responseTemplates;
    const categorySpecific = templates.filter((template) => template.category === selected.category);
    const common = templates.filter((template) => !template.category);
    return [...categorySpecific, ...common];
  }, [selected?.category, isEn]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await contactService.list({ limit: 200 });
      const rows = response.data ?? [];
      setMessages(rows);
      setSelectedId((current) => current && rows.some((row) => String(row.id) === String(current))
        ? current
        : rows[0]?.id ?? null);
    } catch (error: any) {
      toast.error(error?.message || tt.loadInboxFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    usersService.getMyProfile()
      .then((response) => setProfile(response.data))
      .catch(() => undefined);
    loadMessages();
  }, []);

  useEffect(() => {
    setMessageDraft('');
    setNoteDraft('');
    setEditingNoteId(null);
    setEditingNoteBody('');
  }, [selected?.id]);

  useEffect(() => {
    if (!selected?.id) {
      setComments([]);
      setInternalNotes([]);
      return;
    }
    let mounted = true;
    setCommentsLoading(true);
    setNotesLoading(true);
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
    contactService.internalNotes(String(selected.id))
      .then((response) => {
        if (mounted) setInternalNotes(response.data ?? []);
      })
      .catch(() => {
        if (mounted) setInternalNotes([]);
      })
      .finally(() => {
        if (mounted) setNotesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selected?.id]);

  const updateSelected = async (payload: { status?: ContactMessageResponse['status']; internalNote?: string; replyMessage?: string }) => {
    if (!selected || readOnly) return;
    setSaving(true);
    try {
      const response = await contactService.update(String(selected.id), payload);
      setMessages((current) => current.map((item) => String(item.id) === String(selected.id) ? response.data : item));
      toast.success(tt.updateSuccess);
    } catch (error: any) {
      toast.error(error?.message || tt.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  const replaceSelected = (row: ContactMessageResponse) => {
    setMessages((current) => current.map((item) => String(item.id) === String(row.id) ? row : item));
  };

  const handleAssign = async () => {
    if (!selected || !canAssign) return;
    setSaving(true);
    try {
      const response = await contactService.assign(String(selected.id));
      replaceSelected({
        ...response.data,
        assignedToCurrentUser: true,
      });
      toast.success(isEn ? 'Support request assigned to you' : 'Đã nhận xử lý phiếu hỗ trợ');
    } catch (error: any) {
      toast.error(error?.message || (isEn ? 'Cannot assign this support request' : 'Không thể nhận xử lý phiếu hỗ trợ'));
    } finally {
      setSaving(false);
    }
  };

  const refreshSelectedComments = async () => {
    if (!selected) return;
    const commentResponse = await contactService.comments(String(selected.id));
    setComments(commentResponse.data ?? []);
  };

  const handleSendMessage = async () => {
    if (!selected || !canSendMessage) return;
    const body = messageDraft.trim();
    if (body.length < 5) {
      toast.error(tt.messageTooShort);
      return;
    }
    setSaving(true);
    try {
      const response = await contactService.addComment(String(selected.id), body);
      setComments((current) => [...current, response.data]);
      setMessageDraft('');
      await loadMessages();
      toast.success(isEn ? 'Message sent' : 'Đã gửi tin nhắn');
    } catch (error: any) {
      toast.error(error?.message || tt.sendFailed);
    } finally {
      setSaving(false);
    }
  };

  const applyResponseTemplate = (template: ResponseTemplate) => {
    if (!selected || !canSendMessage) return;
    const replacements: Record<string, string> = {
      senderName: selected.senderName || tt.userFallback,
      ticketCode: selected.ticketCode || (isEn ? 'this request' : 'phiếu này'),
      librarianName: profile?.fullName || selected.assignedToName || tt.librarianFallback,
    };
    const body = template.body.replace(/\{(\w+)\}/g, (_, key) => replacements[key] || '');
    setMessageDraft(body);
  };

  const handleResolve = async () => {
    if (!selected || !canResolve) return;
    const confirmed = await dialog.confirm({
      title: isEn ? 'Mark as resolved?' : 'Đánh dấu đã xử lý?',
      message: isEn ? `Request ${selected.ticketCode} will be locked for the user. They can still rate or request reopening.` : `Phiếu hỗ trợ ${selected.ticketCode} sẽ được khóa ở phía người dùng. Người dùng vẫn có thể đánh giá hoặc yêu cầu mở lại.`,
      confirmText: isEn ? 'Resolved' : 'Đã xử lý',
      variant: 'confirm',
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const response = await contactService.update(String(selected.id), {
        status: 'RESOLVED',
      });
      replaceSelected(response.data);
      await refreshSelectedComments();
      toast.success(isEn ? 'Support request marked as resolved' : 'Đã đánh dấu phiếu hỗ trợ là đã xử lý');
    } catch (error: any) {
      toast.error(error?.message || tt.statusFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selected || !canEditNote) return;
    const body = noteDraft.trim();
    if (body.length < 2) {
      toast.error(tt.noteTooShort);
      return;
    }
    setSaving(true);
    try {
      const response = await contactService.addInternalNote(String(selected.id), body);
      setInternalNotes((current) => [response.data, ...current]);
      setNoteDraft('');
      toast.success(tt.noteSaved);
    } catch (error: any) {
      toast.error(error?.message || tt.noteSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!selected) return;
    const body = editingNoteBody.trim();
    if (body.length < 2) {
      toast.error(tt.noteTooShort);
      return;
    }
    setSaving(true);
    try {
      const response = await contactService.updateInternalNote(String(selected.id), noteId, body);
      setInternalNotes((current) => current.map((note) => String(note.id) === String(noteId) ? response.data : note));
      setEditingNoteId(null);
      setEditingNoteBody('');
      toast.success(tt.noteUpdated);
    } catch (error: any) {
      toast.error(error?.message || tt.noteUpdateFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      await contactService.deleteInternalNote(String(selected.id), noteId);
      setInternalNotes((current) => current.filter((note) => String(note.id) !== String(noteId)));
      toast.success(tt.noteDeleted);
    } catch (error: any) {
      toast.error(error?.message || tt.noteDeleteFailed);
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
    <div className="mx-auto w-full max-w-none space-y-5 p-4 text-slate-900 dark:text-slate-100 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{readOnly ? (isEn ? 'Support request monitoring' : 'GIÁM SÁT PHIẾU HỖ TRỢ') : (isEn ? 'Support inbox' : 'Hộp phiếu hỗ trợ')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {readOnly ? (isEn ? 'Admins can view messages, internal notes, and support ratings.' : 'Admin chỉ xem nội dung, ghi chú nội bộ và đánh giá chất lượng hỗ trợ.') : (isEn ? 'Receive, classify, and chat directly with users by support request.' : 'Tiếp nhận, phân loại và trao đổi trực tiếp với người dùng theo từng phiếu.')}
          </p>
        </div>
        <button
          type="button"
          onClick={loadMessages}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          {isEn ? 'Refresh' : 'Làm mới'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as ContactMessageResponse['status'][]).map((key) => {
          const cfg = statusConfig[key];
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 ${status === key ? 'border-blue-300 ring-2 ring-blue-100 dark:border-blue-500 dark:ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.className}`}>
                  <Icon size={20} />
                </div>
                <span className="text-2xl font-black text-slate-950 dark:text-white">{counts[key]}</span>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">{isEn ? statusLabelsEn[key] : cfg.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid min-h-[680px] min-w-0 grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col border-b border-slate-200 dark:border-slate-700 xl:border-b-0 xl:border-r">
          <div className="space-y-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={isEn ? 'Search request, sender, subject...' : 'Tìm phiếu, người gửi, chủ đề...'}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatus(item.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${status === item.value ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                >
                  {isEn ? filterLabelsEn[item.value] : item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{isEn ? 'Loading inbox...' : 'Đang tải hộp thư...'}</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{isEn ? 'No matching requests.' : 'Không có yêu cầu phù hợp.'}</div>
            ) : filteredMessages.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => setSelectedId(message.id)}
                className={`w-full border-b border-slate-100 p-4 text-left transition dark:border-slate-800 ${String(selected?.id) === String(message.id) ? 'bg-blue-50 text-blue-950 shadow-[inset_4px_0_0_#2563eb] dark:bg-blue-500/15 dark:text-white dark:shadow-[inset_4px_0_0_#60a5fa]' : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950 dark:text-slate-100">{message.subject}</p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{message.senderName} · {message.senderEmail}</p>
                  </div>
                  <StatusBadge value={message.status} />
                </div>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {isEn ? categoryLabelsEn[message.category] || tt.general : categoryLabels[message.category] || tt.general}
                </span>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{message.message}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
                  <span className="min-w-0 truncate">{message.ticketCode}</span>
                  <span className="shrink-0">{formatDateTime(message.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0">
          {!selected ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <Inbox size={48} />
              <p className="mt-3 text-sm">{tt.selectRequest}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={selected.status} />
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selected.ticketCode}</span>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{isEn ? categoryLabelsEn[selected.category] || tt.general : categoryLabels[selected.category] || tt.general}</span>
                    </div>
                    <h2 className="mt-3 break-words text-xl font-black leading-tight text-slate-950 dark:text-white xl:text-2xl">{selected.subject}</h2>
                    <div className="mt-4 grid min-w-0 gap-4 text-sm text-slate-500 dark:text-slate-400 md:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Avatar name={selected.senderName} src={selected.senderAvatarUrl} className="h-11 w-11" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{selected.senderName}</p>
                          <p className="truncate text-xs">{selected.senderEmail}</p>
                          <p className="text-xs">{selected.senderPhoneNumber || tt.noPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        {selected.assignedToName ? <Avatar name={selected.assignedToName} src={selected.assignedToAvatarUrl} className="h-11 w-11" /> : <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-800" />}
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase text-slate-400">{tt.assignee}</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{selected.assignedToName || tt.unassigned}</p>
                          {selected.assignedToLibrarianCode && <p className="text-xs">{tt.librarianCode}: {selected.assignedToLibrarianCode}</p>}
                          {selected.assignedToEmail && <p className="truncate text-xs">{selected.assignedToEmail}</p>}
                          {selected.assignedToPhoneNumber && <p className="text-xs">{selected.assignedToPhoneNumber}</p>}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{formatDateTime(selected.createdAt)}</p>
                  </div>
                  {!readOnly && (
                    <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:max-w-[280px] lg:justify-end">
                      {isAssignedToOther && (
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                          {tt.readOnlyOther} - {selected.assignedToName || tt.otherLibrarian} {tt.handling}
                        </span>
                      )}
                      <button type="button" onClick={handleAssign} disabled={saving || !canAssign} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/20">
                        {tt.assign}
                      </button>
                      <button type="button" onClick={handleResolve} disabled={saving || !canResolve} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/20">
                        {tt.resolved}
                      </button>
                      <button type="button" onClick={() => updateSelected({ status: 'CLOSED' })} disabled={saving || !canClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                        {isEn ? 'Close request' : 'Đóng phiếu'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 p-4 sm:p-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
                <section className="space-y-6">
                  <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                        <MessageSquareReply size={16} />
                        {tt.conversation}
                      </div>
                      {commentsLoading && <span className="text-xs text-slate-400 dark:text-slate-500">{tt.loading}</span>}
                    </div>
                    <div className="max-h-[520px] space-y-4 overflow-y-auto p-5">
                      {comments.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                          {tt.noConversation}
                        </div>
                      ) : comments.map((comment) => {
                        const isStaffComment = comment.authorRole === 'LIBRARIAN';
                        return (
                          <div key={comment.id} className={`flex items-start gap-3 ${isStaffComment ? 'justify-end' : 'justify-start'}`}>
                            {!isStaffComment && <Avatar name={comment.authorName} src={comment.authorAvatarUrl} />}
                            <div className={`max-w-[86%] rounded-2xl border p-4 ${isStaffComment ? 'border-blue-100 bg-blue-50 text-blue-950 dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-50' : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}>
                              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                                <span>{comment.authorName}</span>
                                <span className="text-slate-400 dark:text-slate-500">·</span>
                                <span className="text-slate-500 dark:text-slate-300">{isStaffComment ? tt.librarian : tt.sender}</span>
                                <span className="text-slate-400 dark:text-slate-500">·</span>
                                <span className="text-slate-500 dark:text-slate-300">{formatDateTime(comment.createdAt)}</span>
                              </div>
                              <p className="whitespace-pre-line text-sm leading-7">{comment.body}</p>
                            </div>
                            {isStaffComment && <Avatar name={comment.authorName} src={comment.authorAvatarUrl} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <aside className="space-y-5">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{tt.internalNotes}</label>
                    {canEditNote && (
                      <>
                        <textarea
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          rows={3}
                          placeholder={tt.notePlaceholder}
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-500/20"
                        />
                        <button
                          type="button"
                          onClick={handleSaveNote}
                          disabled={saving}
                          className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {tt.addNote}
                        </button>
                      </>
                    )}
                    <div className="mt-4 space-y-3">
                      {notesLoading ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500">{tt.notesLoading}</p>
                      ) : internalNotes.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500">{tt.noNotes}</p>
                      ) : internalNotes.map((note) => {
                        const isMine = currentUserId && String(note.authorUserId) === currentUserId;
                        const isEditing = String(editingNoteId) === String(note.id);
                        return (
                          <div key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex items-start gap-2">
                              <Avatar name={note.authorName} src={note.authorAvatarUrl} className="h-8 w-8 text-[10px]" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                  <span>{note.authorName}</span>
                                  <span className="text-slate-400">·</span>
                                  <span>{formatDateTime(note.updatedAt)}</span>
                                </div>
                                {isEditing ? (
                                  <textarea
                                    value={editingNoteBody}
                                    onChange={(event) => setEditingNoteBody(event.target.value)}
                                    rows={3}
                                    className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                  />
                                ) : (
                                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">{note.body}</p>
                                )}
                              </div>
                            </div>
                            {canEditNote && isMine && (
                              <div className="mt-2 flex justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <button type="button" onClick={() => handleUpdateNote(String(note.id))} className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">{tt.save}</button>
                                    <button type="button" onClick={() => { setEditingNoteId(null); setEditingNoteBody(''); }} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">{tt.cancel}</button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => { setEditingNoteId(String(note.id)); setEditingNoteBody(note.body); }} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"><Edit2 size={12} /> {tt.edit}</button>
                                    <button type="button" onClick={() => handleDeleteNote(String(note.id))} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600 dark:border-red-500/30 dark:text-red-300"><Trash2 size={12} /> {tt.delete}</button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {(selected.satisfactionRating || selected.feedbackNote) && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{tt.userRating}</p>
                      <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">{selected.satisfactionRating ? `${selected.satisfactionRating}/5 ${tt.stars}` : tt.noRating}</p>
                      {selected.feedbackNote && <p className="mt-2 whitespace-pre-line text-sm text-emerald-900 dark:text-emerald-100">{selected.feedbackNote}</p>}
                    </div>
                  )}

                  {!readOnly && (
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{tt.replyMessage}</label>
                      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{tt.quickTemplates}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {tt.templateHelp}
                            </p>
                          </div>
                          {selected.category && (
                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                              {isEn ? categoryLabelsEn[selected.category] || tt.general : categoryLabels[selected.category] || tt.general}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {suggestedTemplates.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => applyResponseTemplate(template)}
                              disabled={!canSendMessage}
                              className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                            >
                              <span className="block text-xs font-black text-slate-800 dark:text-slate-100">{template.label}</span>
                              <span className="mt-1 block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">{template.tone}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        readOnly={!canSendMessage}
                        rows={9}
                        placeholder={canSendMessage ? (isEn ? 'Write a message. The user will read and reply in their support inbox.' : 'Viết tin nhắn. Người dùng sẽ đọc và phản hồi trong Hộp thư liên hệ.') : (isEn ? 'Only the assigned librarian can reply to this request.' : 'Chỉ thủ thư đang phụ trách phiếu này mới được phản hồi.')}
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 read-only:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-500/20 dark:read-only:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={saving || !canSendMessage}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Send size={16} />
                        {saving ? tt.sending : tt.sendMessage}
                      </button>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ContactInbox;
