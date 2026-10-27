import axiosInstance from './axiosInstance';
import type { FaqContent } from './chatbotService';

export interface HelpTopic { id: string; question: string; content: FaqContent; sourcePath: string }
export interface HelpContent { revision: number; version: string; topics: HelpTopic[] }
export const helpService = {
  content: (language: 'vi' | 'en', signal?: AbortSignal): Promise<{ code: number; data: HelpContent }> =>
    axiosInstance.get('/help/content', { params: { language }, signal }),
};
