import { localizeNotification } from '../../utils/notificationLocalization';
import type { UserNotification } from '../../api/notificationService';

const notification = (overrides: Partial<UserNotification>): UserNotification => ({
  userNotificationId: 'un-1',
  notificationId: 'n-1',
  type: 'BOOK_RESERVED',
  title: 'Đặt trước sách thành công',
  message: 'Bạn đang ở vị trí 2 trong hàng chờ. Chúng tôi sẽ thông báo khi sách sẵn sàng.',
  link: null,
  referenceId: null,
  read: false,
  receivedAt: '2026-05-18T10:00:00Z',
  readAt: null,
  ...overrides,
});

describe('localizeNotification', () => {
  it('keeps Vietnamese notification content unchanged', () => {
    const result = localizeNotification(notification({}), 'vi');

    expect(result.title).toBe('Đặt trước sách thành công');
    expect(result.message).toContain('vị trí 2');
  });

  it('translates reservation queue notification to English', () => {
    const result = localizeNotification(notification({}), 'en');

    expect(result.title).toBe('Reservation placed successfully');
    expect(result.message).toBe(
      'You are number 2 in the queue. We will notify you when the book is ready.'
    );
  });

  it('translates paid fine notification with amount and title', () => {
    const result = localizeNotification(notification({
      type: 'FINE_PAID',
      title: 'Phí phạt đã được thanh toán',
      message: "Phí phạt cho sách 'Dive Into Deep Learning' (80,000đ) đã được ghi nhận thanh toán.",
    }), 'en');

    expect(result.title).toBe('Fine payment recorded');
    expect(result.message).toBe(
      'The fine for "Dive Into Deep Learning" (80,000đ) has been marked as paid.'
    );
  });
});
