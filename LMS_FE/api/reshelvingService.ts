import axiosInstance from './axiosInstance';

export const RESHELVING_CHANGED = 'lms:reshelving-changed';
export function notifyReshelvingChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(RESHELVING_CHANGED));
}

export interface ReshelvingItem {
  taskId: string;
  barcode: string;
  publicationTitle: string;
  location: string | null;
  branch: string;
  queuedAt: string;
  source: 'RETURN' | 'PICKUP_EXPIRED' | 'RESERVATION_EXPIRED' | 'RESERVATION_CANCELLED' | 'LOST_RECOVERED';
  studentId: string | null;
  fullName: string;
}

const reshelvingService = {
  getDefaultBranch: async (): Promise<{ code: number; data: { branch: string } }> =>
    axiosInstance.get('/librarians/reshelving/default-branch') as any,
  getWaiting: async (branch?: string): Promise<{ code: number; data: ReshelvingItem[] }> =>
    (branch && branch !== 'ALL' ? axiosInstance.get('/librarians/reshelving', { params: { branch } }) : axiosInstance.get('/librarians/reshelving')) as any,
  getCount: async (branch?: string): Promise<{ code: number; data: { count: number } }> =>
    (branch && branch !== 'ALL' ? axiosInstance.get('/librarians/reshelving/count', { params: { branch } }) : axiosInstance.get('/librarians/reshelving/count')) as any,
  confirm: async (taskIds: string[], branch: string): Promise<{ code: number; data: { updatedCount: number; skippedCount: number } }> => {
    const response = await axiosInstance.post('/librarians/reshelving/confirm', { taskIds, branch });
    notifyReshelvingChanged();
    return response as any;
  },
};
export default reshelvingService;
