import axiosInstance from './axiosInstance';

export interface SubmitContactMessageRequest {
  name?: string;
  email?: string;
  category?: ContactCategory;
  subject: string;
  message: string;
}

export type ContactCategory = 'GENERAL' | 'SYSTEM_ERROR' | 'CIRCULATION' | 'BOOK_SUGGESTION' | 'ACCOUNT' | 'OTHER';

export interface ContactMessageResponse {
  id: string;
  ticketCode: string;
  senderUserId?: string | null;
  senderName: string;
  senderEmail: string;
  senderPhoneNumber?: string | null;
  senderAvatarUrl?: string | null;
  category: ContactCategory;
  subject: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  internalNote?: string | null;
  replyMessage?: string | null;
  repliedAt?: string | null;
  handledByUserId?: string | null;
  assignedToUserId?: string | null;
  assignedToCurrentUser?: boolean | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  assignedToPhoneNumber?: string | null;
  assignedToLibrarianCode?: string | null;
  assignedToAvatarUrl?: string | null;
  closedAt?: string | null;
  satisfactionRating?: number | null;
  feedbackNote?: string | null;
  reopenedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageCommentResponse {
  id: string;
  contactMessageId: string;
  authorUserId?: string | null;
  authorName: string;
  authorEmail?: string | null;
  authorAvatarUrl?: string | null;
  authorRole: 'USER' | 'LIBRARIAN' | 'SYSTEM';
  body: string;
  createdAt: string;
}

export interface ContactInternalNoteResponse {
  id: string;
  contactMessageId: string;
  authorUserId: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateContactMessageRequest {
  status?: ContactMessageResponse['status'];
  internalNote?: string;
  replyMessage?: string;
}

const contactService = {
  submit: async (data: SubmitContactMessageRequest): Promise<{ code: number; message: string; data: ContactMessageResponse }> => {
    return axiosInstance.post('/contact-messages', data);
  },
  list: async (params?: { status?: string; limit?: number }): Promise<{ code: number; message: string; data: ContactMessageResponse[] }> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    return axiosInstance.get(`/contact-messages${query.toString() ? `?${query.toString()}` : ''}`);
  },
  myTickets: async (): Promise<{ code: number; message: string; data: ContactMessageResponse[] }> => {
    return axiosInstance.get('/contact-messages/my');
  },
  summary: async (): Promise<{ code: number; message: string; data: { newCount: number } }> => {
    return axiosInstance.get('/contact-messages/summary');
  },
  update: async (id: string, data: UpdateContactMessageRequest): Promise<{ code: number; message: string; data: ContactMessageResponse }> => {
    return axiosInstance.patch(`/contact-messages/${id}`, data);
  },
  assign: async (id: string): Promise<{ code: number; message: string; data: ContactMessageResponse }> => {
    return axiosInstance.post(`/contact-messages/${id}/assign`);
  },
  comments: async (id: string): Promise<{ code: number; message: string; data: ContactMessageCommentResponse[] }> => {
    return axiosInstance.get(`/contact-messages/${id}/comments`);
  },
  addComment: async (id: string, body: string): Promise<{ code: number; message: string; data: ContactMessageCommentResponse }> => {
    return axiosInstance.post(`/contact-messages/${id}/comments`, { body });
  },
  internalNotes: async (id: string): Promise<{ code: number; message: string; data: ContactInternalNoteResponse[] }> => {
    return axiosInstance.get(`/contact-messages/${id}/internal-notes`);
  },
  addInternalNote: async (id: string, body: string): Promise<{ code: number; message: string; data: ContactInternalNoteResponse }> => {
    return axiosInstance.post(`/contact-messages/${id}/internal-notes`, { body });
  },
  updateInternalNote: async (id: string, noteId: string, body: string): Promise<{ code: number; message: string; data: ContactInternalNoteResponse }> => {
    return axiosInstance.patch(`/contact-messages/${id}/internal-notes/${noteId}`, { body });
  },
  deleteInternalNote: async (id: string, noteId: string): Promise<{ code: number; message: string; data: null }> => {
    return axiosInstance.delete(`/contact-messages/${id}/internal-notes/${noteId}`);
  },
  reopen: async (id: string): Promise<{ code: number; message: string; data: ContactMessageResponse }> => {
    return axiosInstance.post(`/contact-messages/${id}/reopen`);
  },
  feedback: async (id: string, data: { rating: number; note?: string }): Promise<{ code: number; message: string; data: ContactMessageResponse }> => {
    return axiosInstance.post(`/contact-messages/${id}/feedback`, data);
  },
};

export default contactService;
