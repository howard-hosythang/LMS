import { AlertCircle, AlertTriangle, BookMarked, CheckCircle, Clock, Info, Layers, MapPin, Printer, QrCode, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { cancelReservation, getMyReservations, Reservation, ReservationStatus } from '../../api/reservationService';
import circulationPolicyService from '../../api/circulationPolicyService';
import type { CirculationPolicy } from '../../api/adminService';
import { format } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import { useTranslation } from '../../contexts/LanguageContext';

const STATUS_CONFIG: Record<ReservationStatus, { labelKey: string; fallback: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    labelKey: 'reservations.status.pending',
    fallback: 'Đang chờ',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock size={12} className="mr-1" />,
  },
  READY_FOR_PICKUP: {
    labelKey: 'reservations.status.ready',
    fallback: 'Sẵn sàng nhận',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle size={12} className="mr-1" />,
  },
  CANCELLED: {
    labelKey: 'reservations.status.cancelled',
    fallback: 'Đã hủy',
    color: 'bg-gray-100 text-gray-600',
    icon: <X size={12} className="mr-1" />,
  },
  EXPIRED: {
    labelKey: 'reservations.status.expired',
    fallback: 'Hết hạn',
    color: 'bg-red-100 text-red-700',
    icon: <AlertCircle size={12} className="mr-1" />,
  },
  COMPLETED: {
    labelKey: 'reservations.status.completed',
    fallback: 'Hoàn thành',
    color: 'bg-blue-100 text-blue-800',
    icon: <CheckCircle size={12} className="mr-1" />,
  },
};

const fmtDate = (iso: string | null, language: 'vi' | 'en' = 'vi') => {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'HH:mm dd/MM/yyyy', { locale: language === 'en' ? enUS : vi });
  } catch {
    return '—';
  }
};

// Confirm cancel modal
const CancelModal = ({
  reservation,
  onConfirm,
  onClose,
}: {
  reservation: Reservation;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const isReady = reservation.status === 'READY_FOR_PICKUP';
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-gray-900 mb-2">
          {isReady ? t('reservations.cancelReadyTitle', 'Hủy sách đã sẵn sàng?') : t('reservations.cancelTitle', 'Xác nhận hủy đặt trước')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {isReady ? (
            <>
              {t('reservations.cancelReadyPrefix', 'Sách')} <span className="font-semibold">"{reservation.publicationTitle}"</span> {t('reservations.cancelReadySuffix', 'đang chờ bạn nhận. Nếu hủy, sách sẽ được chuyển cho người tiếp theo trong hàng chờ.')}
            </>
          ) : (
            <>
              {t('reservations.cancelConfirmPrefix', 'Bạn có chắc muốn hủy đặt trước')}{' '}
              <span className="font-semibold">"{reservation.publicationTitle}"</span>? {t('reservations.cancelConfirmSuffix', 'Vị trí hàng chờ sẽ bị mất.')}
            </>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            {isReady ? t('reservations.willPickup', 'Tôi sẽ đến lấy') : t('common.back', 'Quay lại')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            {t('reservations.cancelAction', 'Hủy đặt trước')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// QR Modal cho READY_FOR_PICKUP
const QrModal = ({ reservation, onClose }: { reservation: Reservation; onClose: () => void }) => {
  const { language, t } = useTranslation();
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-auto overflow-hidden">
        <div className="bg-green-600 p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('reservations.qrTitle', 'Phiếu nhận sách đặt trước')}</h2>
          <p className="text-green-100 mt-2 text-sm">{t('reservations.qrDesc', 'Đưa mã QR này cho thủ thư để xác nhận nhận sách.')}</p>
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <QRCode value={reservation.reservationId} size={200} />
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 font-medium">{t('reservations.reservationId', 'Mã đặt trước')}</span>
                <span className="font-mono font-bold text-gray-900 text-xs">#{reservation.reservationId}</span>
              </div>
              <h4 className="font-bold text-gray-900 leading-tight mb-2">{reservation.publicationTitle}</h4>
              {reservation.assignedBranch && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
                  <Layers size={14} className="text-gray-400" />
                  {t('reservations.branch', 'Chi nhánh')}: <span className="font-medium text-gray-800">{reservation.assignedBranch}</span>
                  {reservation.assignedLocation && (
                    <> · {t('reservations.shelf', 'Giá')}: <span className="font-medium text-gray-800">{reservation.assignedLocation}</span></>
                  )}
                </p>
              )}
              {reservation.assignedBarcode && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <Printer size={14} className="text-gray-400" />
                  Barcode: <span className="font-medium text-gray-800">{reservation.assignedBarcode}</span>
                </p>
              )}
            </div>

            {reservation.holdExpirationTime && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold text-red-800 mb-1">{t('reservations.pickupDeadlineTitle', 'Hạn chót đến lấy sách')}</span>
                  <span className="text-sm text-red-700">{fmtDate(reservation.holdExpirationTime, language)}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md transition-colors"
          >
            {t('common.close', 'Đóng')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ReservationCard = ({
  reservation,
  onCancel,
  onShowQr,
}: {
  reservation: Reservation;
  onCancel: (r: Reservation) => void;
  onShowQr: (r: Reservation) => void;
}) => {
  const { language, t } = useTranslation();
  const cfg = STATUS_CONFIG[reservation.status];
  const isPending = reservation.status === 'PENDING';
  const isReady = reservation.status === 'READY_FOR_PICKUP';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-14 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
          {reservation.coverImageUrl ? (
            <img src={reservation.coverImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <BookMarked size={24} className="text-gray-300" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 leading-tight line-clamp-2">
              {reservation.publicationTitle}
            </h4>
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
              {cfg.icon} {t(cfg.labelKey, cfg.fallback)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
            <span>
              {t('reservations.reservedDate', 'Đặt ngày')}: <strong className="text-gray-700">{fmtDate(reservation.reservationDate, language)}</strong>
            </span>
            <span>
              {t('reservations.preferredBranch', 'Cơ sở ưu tiên')}:{' '}
              <strong className="text-gray-700">
                {reservation.preferredBranch === 'ANY' ? t('reservations.anyBranch', 'Bất kỳ') : reservation.preferredBranch}
              </strong>
            </span>
            {reservation.status === 'PENDING' && (
              <span>
                {t('reservations.queuePosition', 'Vị trí hàng chờ')}: <strong className="text-blue-700">#{reservation.queuePosition}</strong>
              </span>
            )}
            {reservation.status === 'READY_FOR_PICKUP' && reservation.holdExpirationTime && (
              <span className="text-green-700 col-span-2">
                {t('reservations.pickupDeadline', 'Hạn nhận')}: <strong>{fmtDate(reservation.holdExpirationTime, language)}</strong>
              </span>
            )}
          </div>

          {/* READY_FOR_PICKUP: show item location */}
          {reservation.status === 'READY_FOR_PICKUP' && reservation.assignedBarcode && (
            <div className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-800">
              <MapPin size={13} />
              <span>
                Barcode: <strong>{reservation.assignedBarcode}</strong>
                {reservation.assignedBranch && (
                  <> · {t('reservations.branch', 'Chi nhánh')}: <strong>{reservation.assignedBranch}</strong></>
                )}
                {reservation.assignedLocation && (
                  <> · {t('reservations.shelf', 'Giá')}: <strong>{reservation.assignedLocation}</strong></>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions — PENDING */}
      {isPending && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onCancel(reservation)}
            className="text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
          >
            {t('reservations.cancelAction', 'Hủy đặt trước')}
          </button>
        </div>
      )}

      {/* Actions — READY_FOR_PICKUP: hỏi người dùng có muốn mượn không */}
      {isReady && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-green-800 font-medium">
            {t('reservations.readyQuestion', 'Sách đã sẵn sàng - bạn có muốn đến lấy không?')}
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onCancel(reservation)}
              className="text-xs text-red-600 border border-red-200 bg-white rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
            >
              {t('reservations.noCancel', 'Không, hủy đặt')}
            </button>
            <button
              onClick={() => onShowQr(reservation)}
              className="text-xs text-green-700 border border-green-300 bg-white rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors font-medium flex items-center gap-1"
            >
              <QrCode size={13} /> {t('reservations.viewQr', 'Xem mã QR nhận sách')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReservationsPage = () => {
  const { language, t } = useTranslation();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [qrTarget, setQrTarget] = useState<Reservation | null>(null);
  const [policy, setPolicy] = useState<CirculationPolicy | null>(null);

  const load = async (p: number) => {
    try {
      setLoading(true);
      const data = await getMyReservations(p, 10);
      setReservations(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(p);
    } catch {
      toast.error(t('reservations.loadFailed', 'Không thể tải danh sách đặt trước'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    circulationPolicyService.getPolicy()
      .then(res => {
        if (res.code === 200) setPolicy(res.data);
      })
      .catch(() => setPolicy(null));
  }, []);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelReservation(cancelTarget.reservationId);
      toast.success(t('reservations.cancelSuccess', 'Đã hủy đặt trước'));
      setCancelTarget(null);
      load(page);
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err, language));
    } finally {
      setCancelling(false);
    }
  };

  const pending = reservations.filter(r => r.status === 'PENDING').length;
  const ready = reservations.filter(r => r.status === 'READY_FOR_PICKUP').length;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('reservations.title', 'Danh sách đặt trước')}</h1>
        <p className="text-gray-500 text-sm">{t('reservations.subtitle', 'Theo dõi trạng thái sách bạn đã đặt.')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-gray-500 text-sm">{t('reservations.total', 'Tổng')}</span>
          <p className="text-3xl font-bold text-gray-900">{totalElements}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-gray-500 text-sm">{t('reservations.pending', 'Đang chờ')}</span>
          <p className="text-3xl font-bold text-yellow-600">{pending}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-gray-500 text-sm">{t('reservations.ready', 'Sẵn sàng nhận')}</span>
          <p className="text-3xl font-bold text-green-600">{ready}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">{t('common.loading', 'Đang tải...')}</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16">
          <BookMarked size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('reservations.empty', 'Bạn chưa đặt trước sách nào.')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(r => (
            <ReservationCard key={r.reservationId} reservation={r} onCancel={setCancelTarget} onShowQr={setQrTarget} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => load(page - 1)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40"
          >
            {t('common.previous', 'Trước')}
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => load(page + 1)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40"
          >
            {t('common.next', 'Sau')}
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-bold flex items-center mb-1">
          <Info size={15} className="mr-2" /> {t('reservations.noteTitle', 'Lưu ý về đặt trước')}
        </h4>
        <ul className="list-disc list-inside space-y-1 ml-1 text-blue-700">
          <li>
            {t('reservations.noteLimitPrefix', 'Bạn chỉ được đặt trước tối đa')} <strong>{policy?.maxActiveReservations ?? 2} {t('common.books', 'cuốn sách')}</strong> {t('reservations.noteLimitSuffix', 'cùng lúc.')}
          </li>
          <li>
            {t('reservations.notePickup', 'Khi sách sẵn sàng, bạn có')} <strong>{policy?.pickupDeadlineHours ?? 48} {t('reservations.hours', 'giờ')}</strong> {t('reservations.notePickupSuffix', 'để đến nhận tại chi nhánh đã chọn.')}
          </li>
          <li>{t('reservations.noteNotify', 'Hệ thống sẽ gửi thông báo khi sách của bạn đã sẵn sàng.')}</li>
          <li>{t('reservations.noteCancelPrefix', 'Nếu không còn nhu cầu, vui lòng nhấn')} <strong>{t('reservations.cancelAction', 'Hủy đặt trước')}</strong> {t('reservations.noteCancelSuffix', 'để nhường lượt cho người sau.')}</li>
        </ul>
      </div>

      {cancelTarget && (
        <CancelModal
          reservation={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => !cancelling && setCancelTarget(null)}
        />
      )}

      {qrTarget && (
        <QrModal reservation={qrTarget} onClose={() => setQrTarget(null)} />
      )}
    </div>
  );
};

export default ReservationsPage;
