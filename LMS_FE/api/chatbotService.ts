import axiosInstance from './axiosInstance';

export interface FaqSuggestion { id: string; question: string }
export interface FaqAnswer {
  status: 'ANSWERED' | 'UNSUPPORTED' | 'UNAVAILABLE';
  faqId?: string;
  answer: string;
  sourceTitle?: string;
  sourcePath?: string;
}
interface Response<T> { code: number; data: T }

export const chatbotService = {
  suggestions: (language: 'vi' | 'en', signal?: AbortSignal): Promise<Response<FaqSuggestion[]>> =>
    axiosInstance.get('/chatbot/faqs', { params: { language }, signal }),
  ask: (message: string, language: 'vi' | 'en', signal?: AbortSignal): Promise<Response<FaqAnswer>> =>
    axiosInstance.post('/chatbot/messages', { message, language }, { signal, timeout: 15000 }),
};
