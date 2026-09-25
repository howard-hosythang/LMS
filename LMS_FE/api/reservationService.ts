import axiosInstance from './axiosInstance';

export type ReservationStatus = 'PENDING' | 'READY_FOR_PICKUP' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';

export interface Reservation {
  reservationId: string;
  publicationId: string;
  publicationTitle: string;
  coverImageUrl: string | null;
  preferredBranch: string;
  status: ReservationStatus;
  queuePosition: number;
  assignedItemId: string | null;
  assignedBarcode: string | null;
  assignedBranch: string | null;
  assignedLocation: string | null;
  holdExpirationTime: string | null;
  reservationDate: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface PageData<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export async function createReservation(publicationId: string, preferredBranch: string): Promise<Reservation> {
  const res: any = await axiosInstance.post('/reservations', {
    publicationId: parseInt(publicationId),
    preferredBranch,
  });
  return res.data;
}

export async function cancelReservation(reservationId: string): Promise<void> {
  await axiosInstance.delete(`/reservations/${reservationId}`);
}

export async function confirmReservationPickup(reservationId: string): Promise<Reservation> {
  const res: any = await axiosInstance.post(`/reservations/${reservationId}/confirm-pickup`);
  return res.data;
}

export async function lookupReservation(params: { reservationId?: string; studentId?: string; barcode?: string }): Promise<any> {
  const res: any = await axiosInstance.get('/reservations/lookup', { params });
  return res;
}

export async function getMyReservations(page = 0, size = 10): Promise<PageData<Reservation>> {
  const res: any = await axiosInstance.get(
    `/reservations/my-reservations?page=${page}&size=${size}`
  );
  return res.data;
}
