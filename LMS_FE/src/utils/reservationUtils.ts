import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ReservationStatus } from '../../api/reservationService';

export const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string }> = {
  PENDING:          { label: 'Đang chờ',       color: 'bg-yellow-100 text-yellow-800' },
  READY_FOR_PICKUP: { label: 'Sẵn sàng nhận',  color: 'bg-green-100 text-green-800'  },
  CANCELLED:        { label: 'Đã hủy',          color: 'bg-gray-100 text-gray-600'    },
  EXPIRED:          { label: 'Hết hạn',         color: 'bg-red-100 text-red-700'      },
  COMPLETED:        { label: 'Hoàn thành',      color: 'bg-blue-100 text-blue-800'    },
};

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'HH:mm dd/MM/yyyy', { locale: vi });
  } catch {
    return '—';
  }
}

export function isActiveCancellable(status: ReservationStatus): boolean {
  return status === 'PENDING' || status === 'READY_FOR_PICKUP';
}

export function calcHoldDeadlineLabel(holdExpirationTime: string | null): string {
  if (!holdExpirationTime) return '';
  const deadline = new Date(holdExpirationTime);
  const now = new Date();
  const hoursLeft = Math.round((deadline.getTime() - now.getTime()) / 3_600_000);
  if (hoursLeft <= 0) return 'Đã hết hạn';
  if (hoursLeft < 24) return `Còn ${hoursLeft} giờ`;
  return `Còn ${Math.floor(hoursLeft / 24)} ngày`;
}
