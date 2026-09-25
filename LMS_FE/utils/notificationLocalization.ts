import type { Language } from '../contexts/LanguageContext';
import type { UserNotification } from '../api/notificationService';

type LocalizedNotification = Pick<UserNotification, 'title' | 'message'>;

const titleMap: Record<string, Record<Language, string>> = {
  BOOK_RESERVED: {
    vi: 'Đặt trước sách thành công',
    en: 'Reservation placed successfully',
  },
  BOOK_AVAILABLE: {
    vi: 'Sách đặt trước đã sẵn sàng',
    en: 'Reserved book is ready',
  },
  WISHLIST_BOOK_AVAILABLE: {
    vi: 'Sách trong wishlist đã có sẵn',
    en: 'Wishlist book is available',
  },
  BORROW_SUCCESS: {
    vi: 'Yêu cầu mượn sách đã được tạo',
    en: 'Borrow request created',
  },
  BORROW_CANCELLED_EXPIRED: {
    vi: 'Yêu cầu mượn sách đã bị hủy',
    en: 'Borrow request cancelled',
  },
  RESERVATION_EXPIRED: {
    vi: 'Đặt trước đã hết hạn',
    en: 'Reservation expired',
  },
  OVERDUE_WARNING: {
    vi: 'Sách sắp đến hạn trả',
    en: 'Book return due soon',
  },
  RETURN_REMINDER: {
    vi: 'Nhắc trả sách',
    en: 'Return reminder',
  },
  FINE_ISSUED: {
    vi: 'Thông báo phí phạt',
    en: 'Fine notice',
  },
  FINE_PAID: {
    vi: 'Phí phạt đã được thanh toán',
    en: 'Fine payment recorded',
  },
  PICKUP_CONFIRMED: {
    vi: 'Sách đã được giao',
    en: 'Book pickup confirmed',
  },
  RETURN_CONFIRMED: {
    vi: 'Trả sách thành công',
    en: 'Book returned successfully',
  },
  SYSTEM_MAINTENANCE: {
    vi: 'Thông báo hệ thống',
    en: 'System notice',
  },
  REVIEW_HELPFUL: {
    vi: 'Review của bạn hữu ích',
    en: 'Your review helped someone',
  },
  REVIEW_REPLY: {
    vi: 'Library74 đã trả lời review',
    en: 'Library74 replied to your review',
  },
  CONTACT_TICKET_REPLY: {
    vi: 'Thư viện đã phản hồi ticket',
    en: 'Library replied to your ticket',
  },
  CONTACT_TICKET_RESOLVED: {
    vi: 'Ticket hỗ trợ đã được xử lý',
    en: 'Support ticket resolved',
  },
  CONTACT_TICKET_CLOSED: {
    vi: 'Ticket hỗ trợ đã được đóng',
    en: 'Support ticket closed',
  },
  LIB_CIRC_PICKUP: {
    vi: 'Sinh viên đã nhận sách',
    en: 'Student picked up a book',
  },
  LIB_CIRC_RETURN: {
    vi: 'Sinh viên đã trả sách',
    en: 'Student returned a book',
  },
  LIB_FINE_PAID: {
    vi: 'Đã thu phí phạt',
    en: 'Fine payment collected',
  },
  LIB_TICKET_NEW: {
    vi: 'Ticket hỗ trợ mới',
    en: 'New support ticket',
  },
  LIB_TICKET_ASSIGNED: {
    vi: 'Ticket đã có người xử lý',
    en: 'Ticket was assigned',
  },
  LIB_TICKET_RESOLVED: {
    vi: 'Ticket đã được xử lý',
    en: 'Ticket resolved',
  },
  LIB_TICKET_CLOSED: {
    vi: 'Ticket đã được đóng',
    en: 'Ticket closed',
  },
  LIB_TICKET_MESSAGE: {
    vi: 'Tin nhắn ticket mới',
    en: 'New ticket message',
  },
  LIB_TICKET_FEEDBACK: {
    vi: 'Đánh giá hỗ trợ mới',
    en: 'New support feedback',
  },
  LIB_REVIEW_NEW: {
    vi: 'Review sách mới',
    en: 'New book review',
  },
  LIB_BOOK_CREATED: {
    vi: 'Đã thêm đầu sách',
    en: 'Publication added',
  },
  LIB_BOOK_UPDATED: {
    vi: 'Đã cập nhật đầu sách',
    en: 'Publication updated',
  },
  LIB_BOOK_DELETED: {
    vi: 'Đã xoá đầu sách',
    en: 'Publication deleted',
  },
  LIB_COPY_CREATED: {
    vi: 'Đã thêm bản sao',
    en: 'Copy added',
  },
  LIB_POLICY_UPDATED: {
    vi: 'Quy định mượn trả đã đổi',
    en: 'Circulation policy updated',
  },
};

const firstMatch = (value: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match;
  }
  return null;
};

const quote = (value: string) => `"${value}"`;

const localizeMessage = (notification: UserNotification, language: Language) => {
  const message = notification.message || '';
  if (language === 'vi') return message;

  switch (notification.type) {
    case 'BOOK_RESERVED': {
      const queue = message.match(/vị trí\s+(\d+)/i)?.[1];
      return queue
        ? `You are number ${queue} in the queue. We will notify you when the book is ready.`
        : 'Your reservation has been recorded. We will notify you when the book is ready.';
    }
    case 'BOOK_AVAILABLE': {
      const match = firstMatch(message, [
        /Sách\s+"(.+)"\s+đã có tại thư viện\. Hãy đến nhận trước\s+(.+)\./,
        /Sách\s+'(.+)'\s+đã có tại thư viện\. Hãy đến nhận trước\s+(.+)\./,
      ]);
      return match
        ? `Book ${quote(match[1])} is available at the library. Please pick it up before ${match[2]}.`
        : 'Your reserved book is available at the library. Please pick it up before the deadline.';
    }
    case 'WISHLIST_BOOK_AVAILABLE': {
      const match = firstMatch(message, [
        /Cuốn\s+"(.+)"\s+bạn đang theo dõi đã có sẵn trên kệ, hãy đặt trước ngay!/,
        /Cuốn\s+'(.+)'\s+bạn đang theo dõi đã có sẵn trên kệ, hãy đặt trước ngay!/,
      ]);
      return match
        ? `Book ${quote(match[1])} from your wishlist is back on the shelf. Reserve it now.`
        : 'A book from your wishlist is back on the shelf. Reserve it now.';
    }
    case 'BORROW_SUCCESS': {
      const match = message.match(/Bạn đã đặt mượn '(.+)'\. Đến (.+) để nhận sách trước 24h\./);
      return match
        ? `You requested to borrow ${quote(match[1])}. Please pick it up at ${match[2]} within 24 hours.`
        : 'Your borrow request has been created. Please pick up the book within 24 hours.';
    }
    case 'PICKUP_CONFIRMED': {
      const direct = message.match(/Bạn đã mượn '(.+)' tại thư viện\. Hạn trả: (.+)\./);
      if (direct) return `You borrowed ${quote(direct[1])} at the library. Due date: ${direct[2]}.`;

      const reserved = message.match(/Bạn đã nhận '(.+)' đặt trước\. Hạn trả: (.+)\./);
      if (reserved) return `You picked up reserved book ${quote(reserved[1])}. Due date: ${reserved[2]}.`;

      const pickup = message.match(/Bạn đã nhận '(.+)'\. Hạn trả: (.+)\./);
      return pickup
        ? `You picked up ${quote(pickup[1])}. Due date: ${pickup[2]}.`
        : 'Your book pickup has been confirmed.';
    }
    case 'RETURN_CONFIRMED': {
      const match = message.match(/Bạn đã trả sách '(.+)' thành công\./);
      return match ? `You returned ${quote(match[1])} successfully.` : 'Your book return has been confirmed.';
    }
    case 'OVERDUE_WARNING': {
      const tomorrow = message.match(/Sách '(.+)' sẽ đến hạn trả vào ngày mai \((.+)\)\. Đừng quên trả sách đúng hạn!/);
      if (tomorrow) return `Book ${quote(tomorrow[1])} is due tomorrow (${tomorrow[2]}). Please return it on time.`;

      const soon = message.match(/Sách '(.+)' sẽ đến hạn trả vào ngày (.+)\. Vui lòng trả đúng hạn\./);
      return soon
        ? `Book ${quote(soon[1])} is due on ${soon[2]}. Please return it on time.`
        : 'A borrowed book is due soon. Please return it on time.';
    }
    case 'BORROW_CANCELLED_EXPIRED': {
      const match = message.match(/Yêu cầu mượn '(.+)' đã bị hủy do quá 24h không đến nhận\./);
      return match
        ? `Your borrow request for ${quote(match[1])} was cancelled because it was not picked up within 24 hours.`
        : 'Your borrow request was cancelled because it was not picked up in time.';
    }
    case 'RESERVATION_EXPIRED': {
      const match = message.match(/Lượt đặt trước '(.+)' đã hết hạn do quá thời gian nhận sách\./);
      return match
        ? `Your reservation for ${quote(match[1])} expired because it was not picked up in time.`
        : 'Your reservation expired because it was not picked up in time.';
    }
    case 'FINE_ISSUED': {
      const match = message.match(/Sách '(.+)' đã được ghi nhận (.+)\. Vui lòng đến thư viện thanh toán phí phạt\./);
      if (!match) return 'A fine has been recorded. Please visit the library to pay it.';

      const reason = match[2] === 'mất/thất lạc' ? 'lost or missing' : 'damaged';
      return `Book ${quote(match[1])} was recorded as ${reason}. Please visit the library to pay the fine.`;
    }
    case 'FINE_PAID': {
      const single = message.match(/Phí phạt cho sách '(.+)' \((.+)\) đã được ghi nhận thanh toán\./);
      if (single) return `The fine for ${quote(single[1])} (${single[2]}) has been marked as paid.`;

      const all = message.match(/Bạn đã hoàn tất thanh toán (\d+) khoản phí phạt\./);
      return all
        ? `You have completed payment for ${all[1]} fine(s).`
        : 'Your fine payment has been recorded.';
    }
    case 'REVIEW_HELPFUL':
      return 'A reader marked your review as helpful.';
    case 'REVIEW_REPLY':
      return 'Library74 replied to your review.';
    case 'CONTACT_TICKET_REPLY':
      return 'Your support ticket has a new reply from the library.';
    case 'CONTACT_TICKET_RESOLVED':
      return 'Your support ticket has been resolved. You can rate the support quality or request reopening if needed.';
    case 'CONTACT_TICKET_CLOSED':
      return 'Your support ticket has been closed after completion.';
    case 'LIB_CIRC_PICKUP':
      return 'A student picked up a book. Open the notification for circulation details.';
    case 'LIB_CIRC_RETURN':
      return 'A student returned a book. Open the notification for return details and any fine information.';
    case 'LIB_FINE_PAID':
      return 'A fine payment was recorded. Open the notification for payment details.';
    case 'LIB_TICKET_NEW':
      return 'A new support ticket was opened by a student.';
    case 'LIB_TICKET_ASSIGNED':
      return 'A librarian accepted responsibility for a support ticket.';
    case 'LIB_TICKET_RESOLVED':
      return 'A support ticket was marked as resolved.';
    case 'LIB_TICKET_CLOSED':
      return 'A support ticket was closed.';
    case 'LIB_TICKET_MESSAGE':
      return 'The assigned ticket has a new student message.';
    case 'LIB_TICKET_FEEDBACK':
      return 'A student rated the handled support ticket.';
    case 'LIB_REVIEW_NEW':
      return 'A student posted a new book review. Open it to reply.';
    case 'LIB_BOOK_CREATED':
      return 'A publication was added to the catalog.';
    case 'LIB_BOOK_UPDATED':
      return 'A publication was updated in the catalog.';
    case 'LIB_BOOK_DELETED':
      return 'A publication was removed from the catalog.';
    case 'LIB_COPY_CREATED':
      return 'A copy was added to the catalog.';
    case 'LIB_POLICY_UPDATED':
      return 'An admin updated the circulation policy. Open settings to review the current rules.';
    default:
      return message;
  }
};

export const localizeNotification = (
  notification: UserNotification,
  language: Language
): LocalizedNotification => ({
  title: titleMap[notification.type]?.[language] ?? notification.title,
  message: localizeMessage(notification, language),
});
