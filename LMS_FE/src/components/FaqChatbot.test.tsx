import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FaqChatbot from '../../components/FaqChatbot';
import { chatbotService } from '../../api/chatbotService';

let mockLanguage: 'vi' | 'en' = 'vi';
let mockUploads: unknown[] = [];
jest.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mockLanguage }) }));
jest.mock('../../contexts/UploadContext', () => ({ useUpload: () => ({ uploads: mockUploads }) }));
jest.mock('../../api/chatbotService', () => ({ chatbotService: { suggestions: jest.fn(), ask: jest.fn() } }));
const suggestions = chatbotService.suggestions as jest.Mock;
const ask = chatbotService.ask as jest.Mock;

function view() { return render(<MemoryRouter><FaqChatbot /></MemoryRouter>); }
async function open() {
  await userEvent.click(screen.getByRole('button', { name: 'Mở trợ lý hướng dẫn' }));
  await screen.findByRole('combobox', { name: 'Chọn câu hỏi gợi ý' });
}

beforeEach(() => {
  jest.clearAllMocks(); mockLanguage = 'vi'; mockUploads = [];
  suggestions.mockResolvedValue({ data: [{ id: 'borrow', question: 'Làm cách nào để mượn sách?' }] });
  ask.mockResolvedValue({ data: { status: 'ANSWERED', faqId: 'borrow', answer: 'Hướng dẫn đã duyệt.', sourceTitle: 'Mượn sách', sourcePath: '/publicpage/guide' } });
});

test('opens on demand, explains scope and focuses the question without making an AI request', async () => {
  view(); expect(suggestions).not.toHaveBeenCalled();
  await open();
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'false');
  expect(screen.getByText(/không tra cứu tài khoản/)).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveFocus();
  expect(ask).not.toHaveBeenCalled();
});

test('typing does not send, Enter sends only current message/language and displays reviewed source', async () => {
  const user = userEvent.setup(); view(); await open();
  await user.type(screen.getByRole('textbox'), 'Cách mượn sách?');
  expect(ask).not.toHaveBeenCalled();
  await user.keyboard('{Enter}');
  expect(await screen.findByText('Hướng dẫn đã duyệt.')).toBeInTheDocument();
  expect(ask).toHaveBeenCalledTimes(1);
  expect(ask).toHaveBeenCalledWith('Cách mượn sách?', 'vi', expect.any(AbortSignal));
  expect(screen.getByRole('link', { name: /Xem hướng dẫn/ })).toHaveAttribute('href', '/publicpage/guide');
});

test('suggested questions work and Shift+Enter does not submit', async () => {
  const user = userEvent.setup(); view(); await open();
  await user.type(screen.getByRole('textbox'), 'Test{Shift>}{Enter}{/Shift}');
  expect(ask).not.toHaveBeenCalled();
  await user.selectOptions(screen.getByRole('combobox'), 'Làm cách nào để mượn sách?');
  expect(await screen.findByText('Hướng dẫn đã duyệt.')).toBeInTheDocument();
});

test('blocks empty questions and duplicate submissions while pending', async () => {
  ask.mockReturnValue(new Promise(() => {})); view(); await open();
  expect(screen.getByRole('button', { name: 'Gửi câu hỏi' })).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(ask).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '500');
});

test('Escape aborts pending request, restores launcher focus and ignores a late response', async () => {
  let resolve!: (value: unknown) => void;
  ask.mockImplementation(() => new Promise(done => { resolve = done; }));
  view(); await open();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  const signal = ask.mock.calls[0][2] as AbortSignal;
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(signal.aborted).toBe(true);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mở trợ lý hướng dẫn' })).toHaveFocus();
  await act(async () => { resolve({ data: { answer: 'Stale result' } }); });
  await open(); expect(screen.queryByText('Stale result')).not.toBeInTheDocument();
});

test('clear aborts outstanding work and removes local conversation', async () => {
  ask.mockReturnValue(new Promise(() => {})); view(); await open();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Private question' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  const signal = ask.mock.calls[0][2] as AbortSignal;
  await userEvent.click(screen.getByRole('button', { name: 'Xóa hội thoại' }));
  expect(signal.aborted).toBe(true);
  expect(screen.queryByText('Private question')).not.toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveFocus();
});

test('request error retains the question for retry and handles throttling', async () => {
  ask.mockRejectedValue({ response: { status: 429 } }); view(); await open();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(await screen.findByRole('alert')).toHaveTextContent('một phút');
  expect(screen.getByRole('textbox')).toHaveValue('Question');
  expect(screen.getByRole('button', { name: 'Gửi câu hỏi' })).toBeEnabled();
});

test('unavailable answers are displayed without inventing a source', async () => {
  ask.mockResolvedValue({ data: { status: 'UNAVAILABLE', answer: 'Hãy chọn câu gợi ý.' } });
  view(); await open(); await userEvent.selectOptions(screen.getByRole('combobox'), 'Làm cách nào để mượn sách?');
  expect(await screen.findByText('Hãy chọn câu gợi ý.')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Xem hướng dẫn/ })).not.toBeInTheDocument();
});

test('renders text safely and refuses an unapproved source URL', async () => {
  ask.mockResolvedValue({ data: { status: 'ANSWERED', answer: '<img src=x onerror=alert(1)>', sourceTitle: 'Unsafe', sourcePath: 'https://evil.example' } });
  const { container } = view(); await open();
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Làm cách nào để mượn sách?');
  expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  expect(container.querySelector('img')).toBeNull();
  expect(screen.queryByRole('link', { name: /Unsafe/ })).not.toBeInTheDocument();
});

test('suggestion failure leaves manual entry and the guide available', async () => {
  suggestions.mockRejectedValue(new Error('offline')); view();
  await userEvent.click(screen.getByRole('button', { name: 'Mở trợ lý hướng dẫn' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Chưa tải được'));
  expect(screen.getByRole('textbox')).toBeEnabled();
  expect(screen.getByRole('link', { name: 'Mở hướng dẫn' })).toBeInTheDocument();
});

test('language change clears conversation and aborts pending requests', async () => {
  ask.mockReturnValue(new Promise(() => {})); const rendered = view(); await open();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  const signal = ask.mock.calls[0][2] as AbortSignal;
  mockLanguage = 'en'; rendered.rerender(<MemoryRouter><FaqChatbot /></MemoryRouter>);
  expect(signal.aborted).toBe(true);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Open help assistant' }));
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Library74 help assistant');
  expect(screen.queryByText('Question')).not.toBeInTheDocument();
  await waitFor(() => expect(suggestions).toHaveBeenLastCalledWith('en', expect.any(AbortSignal)));
});

test('upload progress takes priority so the two floating panels do not overlap', () => {
  mockUploads = [{ id: 'uploading' }]; view();
  expect(screen.queryByRole('button', { name: 'Mở trợ lý hướng dẫn' })).not.toBeInTheDocument();
});
