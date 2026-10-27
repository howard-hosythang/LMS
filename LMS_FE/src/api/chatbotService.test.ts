import axiosInstance from '../../api/axiosInstance';
import { chatbotService } from '../../api/chatbotService';
import { isPublicRequest } from '../../api/publicRequestPolicy';

jest.mock('../../api/axiosInstance', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));

test('FAQ endpoints are public without opening other chatbot methods', () => {
  expect(isPublicRequest({ method: 'get', url: '/chatbot/faqs' })).toBe(true);
  expect(isPublicRequest({ method: 'post', url: '/chatbot/messages' })).toBe(true);
  expect(isPublicRequest({ method: 'post', url: 'https://library74.uk/api/v1/chatbot/messages' })).toBe(true);
  expect(isPublicRequest({ method: 'get', url: '/chatbot/messages' })).toBe(false);
  expect(isPublicRequest({ method: 'post', url: '/chatbot/faqs' })).toBe(false);
});

test('sends only current question and language, with cancellation and a bounded timeout', () => {
  const signal = new AbortController().signal;
  chatbotService.suggestions('vi', signal);
  expect(axiosInstance.get).toHaveBeenCalledWith('/chatbot/faqs', { params: { language: 'vi' }, signal });
  chatbotService.ask('How do I borrow?', 'en', signal);
  expect(axiosInstance.post).toHaveBeenCalledWith('/chatbot/messages', { message: 'How do I borrow?', language: 'en' }, { signal, timeout: 30000 });
});

test('personal messages use an authenticated route and never accept an identity argument', () => {
  expect(isPublicRequest({ method: 'post', url: '/chatbot/my/messages' })).toBe(false);
  expect(isPublicRequest({ method: 'get', url: '/help/content' })).toBe(true);
  chatbotService.ask('My fines', 'en', undefined, true);
  expect(axiosInstance.post).toHaveBeenCalledWith('/chatbot/my/messages', { message: 'My fines', language: 'en' }, { signal: undefined, timeout: 30000 });
});
