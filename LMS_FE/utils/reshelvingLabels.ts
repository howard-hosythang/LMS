import type { ReshelvingItem } from '../api/reshelvingService';

const labels: Record<ReshelvingItem['source'], { vi: string; en: string }> = {
  RETURN: { vi: 'Sách trả', en: 'Returned book' },
  PICKUP_EXPIRED: { vi: 'Hết hạn nhận sách mượn', en: 'Borrow pickup expired' },
  RESERVATION_EXPIRED: { vi: 'Hết hạn nhận đặt trước', en: 'Reservation pickup expired' },
  RESERVATION_CANCELLED: { vi: 'Hủy giữ sách đặt trước', en: 'Reservation cancelled' },
  LOST_RECOVERED: { vi: 'Tìm lại sách mất', en: 'Lost book recovered' },
};
export function reshelvingSourceLabel(source: ReshelvingItem['source'], language: 'vi' | 'en') {
  return labels[source]?.[language] || source;
}
