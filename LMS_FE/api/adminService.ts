import axiosInstance from './axiosInstance';
import type { CirculationPolicy } from '../types';

export type { CirculationPolicy } from '../types';

export interface LibrarianAccount {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  librarianCode: string | null;
  librarianCampus: LibrarianCampus | null;
  address: string | null;
  profilePictureUrl: string | null;
  status: string;
  verified: boolean;
  createdAt: string | null;
  accountActivatedAt: string | null;
  lastLoginAt: string | null;
}

export type LibrarianCampus = 'CAMPUS_1' | 'CAMPUS_2' | 'ALL';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'BANNED';

export interface AdminUserAccount {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  studentId: string | null;
  librarianCampus?: LibrarianCampus | null;
  faculty: string | null;
  address: string | null;
  profilePictureUrl: string | null;
  status: AccountStatus | string;
  verified: boolean;
  roles: string[];
  createdAt: string | null;
  accountActivatedAt: string | null;
  lastLoginAt: string | null;
}

export interface CreateLibrarianPayload {
  email: string;
  fullName: string;
  password: string;
  librarianCode?: string;
  librarianCampus: LibrarianCampus;
  phoneNumber: string;
  address: string;
  avatar?: File;
  profilePictureUrl?: string;
}

export interface CreateManagedUserPayload {
  fullName: string;
  studentId: string;
  email: string;
  password: string;
  confirmPassword: string;
  faculty: string;
  phoneNumber?: string | null;
  address?: string | null;
  avatar?: File | null;
}

export interface UpdateManagedUserPayload {
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  studentId: string;
  librarianCampus?: LibrarianCampus | null;
  faculty?: string | null;
  address?: string | null;
  profilePictureUrl?: string | null;
}

export interface AuditLog {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string | null;
  details: Record<string, unknown> | null;
}

const adminService = {
  getPolicy: async (): Promise<{ code: number; message: string; data: CirculationPolicy }> => {
    return axiosInstance.get('/circulation-policies/admin') as any;
  },
  updatePolicy: async (payload: CirculationPolicy): Promise<{ code: number; message: string; data: CirculationPolicy }> => {
    return axiosInstance.put('/circulation-policies/admin', payload) as any;
  },
  listLibrarians: async (): Promise<{ code: number; message: string; data: LibrarianAccount[] }> => {
    return axiosInstance.get('/admin/librarians') as any;
  },
  createLibrarian: async (payload: CreateLibrarianPayload): Promise<{ code: number; message: string; data: LibrarianAccount }> => {
    if (payload.avatar) {
      const formData = new FormData();
      formData.append('email', payload.email);
      formData.append('fullName', payload.fullName);
      formData.append('password', payload.password);
      if (payload.librarianCode) formData.append('librarianCode', payload.librarianCode);
      formData.append('librarianCampus', payload.librarianCampus);
      formData.append('phoneNumber', payload.phoneNumber);
      formData.append('address', payload.address);
      formData.append('avatar', payload.avatar);
      return axiosInstance.post('/admin/librarians', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as any;
    }
    return axiosInstance.post('/admin/librarians', payload) as any;
  },
  listUsers: async (params?: { role?: string; status?: string; keyword?: string }): Promise<{ code: number; message: string; data: AdminUserAccount[] }> => {
    return axiosInstance.get('/admin/users', { params }) as any;
  },
  createUser: async (payload: CreateManagedUserPayload): Promise<{ code: number; message: string; data: AdminUserAccount }> => {
    if (payload.avatar) {
      const formData = new FormData();
      formData.append('fullName', payload.fullName);
      formData.append('studentId', payload.studentId);
      formData.append('email', payload.email);
      formData.append('password', payload.password);
      formData.append('confirmPassword', payload.confirmPassword);
      formData.append('faculty', payload.faculty);
      if (payload.phoneNumber) formData.append('phoneNumber', payload.phoneNumber);
      if (payload.address) formData.append('address', payload.address);
      formData.append('avatar', payload.avatar);
      return axiosInstance.post('/admin/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as any;
    }
    const { avatar, ...jsonPayload } = payload;
    return axiosInstance.post('/admin/users', jsonPayload) as any;
  },
  updateUserStatus: async (userId: string, status: AccountStatus): Promise<{ code: number; message: string; data: AdminUserAccount }> => {
    return axiosInstance.patch(`/admin/users/${userId}/status`, { status }) as any;
  },
  updateManagedUser: async (userId: string, payload: UpdateManagedUserPayload): Promise<{ code: number; message: string; data: AdminUserAccount }> => {
    return axiosInstance.put(`/admin/users/${userId}`, payload) as any;
  },
  uploadManagedUserAvatar: async (userId: string, avatar: File): Promise<{ code: number; message: string; data: AdminUserAccount }> => {
    const formData = new FormData();
    formData.append('avatar', avatar);
    return axiosInstance.post(`/admin/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as any;
  },
  verifyUser: async (userId: string): Promise<{ code: number; message: string; data: AdminUserAccount }> => {
    return axiosInstance.patch(`/admin/users/${userId}/verify`) as any;
  },
  listAuditLogs: async (params: {
    limit?: number;
    keyword?: string;
    actorRole?: string;
    action?: string;
    entityType?: string;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<{ code: number; message: string; data: AuditLog[] }> => {
    return axiosInstance.get('/admin/audit-logs', { params: { limit: 100, ...params } }) as any;
  },
};

export default adminService;
