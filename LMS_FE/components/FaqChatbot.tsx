import { FormEvent, useEffect, useRef, useState } from 'react';
import { BookOpen, Loader2, MessageCircle, Send, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useUpload } from '../contexts/UploadContext';
import { chatbotService, FaqAnswer, FaqSuggestion } from '../api/chatbotService';

type Message = { role: 'user' | 'assistant'; text: string; sourceTitle?: string; sourcePath?: string };
const safeSource = (path?: string) => !!path && /^\/publicpage\/(guide|faq|about|contact|privacy-policy)$/.test(path);
const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

/** No browser persistence, account access, HTML/Markdown rendering or conversation upload. */
function FaqChatbotPanel({ language }: { language: 'vi' | 'en' }) {
  const en = language === 'en';
  const t = (vi: string, english: string) => en ? english : vi;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<FaqSuggestion[]>([]);
  const [suggestionError, setSuggestionError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const current = useRef<AbortController | null>(null);

  useEffect(() => () => current.current?.abort(), []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    input.current?.focus({ preventScroll: true });
    setSuggestionError(false);
    chatbotService.suggestions(language, controller.signal).then(response => {
      if (!controller.signal.aborted) setSuggestions(response.data);
    }).catch(() => { if (!controller.signal.aborted) setSuggestionError(true); });
    return () => controller.abort();
  }, [open, language]);
  useEffect(() => {
    // Scroll the transcript only; never scroll the page or change route/query params.
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, busy]);

  const cancelRequest = () => {
    current.current?.abort(); current.current = null; setBusy(false);
  };
  const close = () => {
    cancelRequest(); setOpen(false); launcher.current?.focus({ preventScroll: true });
  };
  const clear = () => {
    cancelRequest(); setMessages([]); setDraft(''); setError(''); input.current?.focus({ preventScroll: true });
  };
  const send = async (text: string) => {
    const question = text.trim();
    if (!question || question.length > 500 || current.current) return;
    const controller = new AbortController(); current.current = controller;
    setBusy(true); setError(''); setDraft('');
    setMessages(previous => [...previous, { role: 'user' as const, text: question }].slice(-39));
    try {
      const response = await chatbotService.ask(question, language, controller.signal);
      if (controller.signal.aborted || current.current !== controller) return;
      const answer: FaqAnswer = response.data;
      setMessages(previous => [...previous, { role: 'assistant' as const, text: answer.answer,
        sourceTitle: answer.sourceTitle, sourcePath: answer.sourcePath }].slice(-40));
    } catch (reason: unknown) {
      if (controller.signal.aborted || current.current !== controller) return;
      const status = (reason as { response?: { status?: number } })?.response?.status;
      setError(status === 429
        ? t('Trợ lý đang nhận nhiều câu hỏi. Vui lòng thử lại sau một phút.', 'The assistant is receiving many questions. Please try again in a minute.')
        : t('Chưa gửi được câu hỏi. Bạn có thể thử lại hoặc mở hướng dẫn.', 'The question could not be sent. Please retry or open the guide.'));
      setDraft(question);
    } finally {
      if (current.current === controller) { current.current = null; setBusy(false); }
    }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void send(draft); };

  return <>
    {open && <section id="library74-faq-chat" role="dialog" aria-modal="false" aria-labelledby="faq-chat-title"
      aria-describedby="faq-chat-scope"
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}
      className="fixed bottom-24 left-3 right-3 z-40 flex h-[min(36rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl sm:left-auto sm:right-6 sm:w-[25rem] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-blue-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <BookOpen aria-hidden="true" size={24} className="text-blue-700 dark:text-blue-300" />
        <div className="min-w-0 flex-1"><h2 id="faq-chat-title" className="font-bold">{t('Trợ lý hướng dẫn Library74', 'Library74 help assistant')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">{t('Chỉ dùng câu trả lời đã duyệt', 'Reviewed answers only')}</p></div>
        <button type="button" onClick={clear} aria-label={t('Xóa hội thoại', 'Clear conversation')} className={`rounded-lg p-2.5 hover:bg-blue-100 dark:hover:bg-slate-700 ${focusClass}`}><Trash2 aria-hidden="true" size={18} /></button>
        <button type="button" onClick={close} aria-label={t('Đóng trợ lý', 'Close assistant')} className={`rounded-lg p-2.5 hover:bg-blue-100 dark:hover:bg-slate-700 ${focusClass}`}><X aria-hidden="true" size={18} /></button>
      </header>
      <p id="faq-chat-scope" className="shrink-0 border-b border-slate-200 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300">
        {t('Chỉ hướng dẫn sử dụng, không tra cứu tài khoản hoặc dữ liệu hiện tại. Câu hỏi có thể được gửi tới AI để chọn chủ đề; không nhập thông tin nhạy cảm.', 'Instructions only, without account or live data access. Questions may be sent to AI for topic matching; do not enter sensitive information.')}
      </p>
      <div ref={transcript} role="log" aria-label={t('Hội thoại hướng dẫn', 'Help conversation')} aria-live="polite" aria-relevant="additions" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        <p className="rounded-xl bg-slate-100 p-3 text-sm leading-relaxed dark:bg-slate-800">{t('Xin chào! Bạn cần hướng dẫn mượn sách, đặt trước hay sử dụng Library74? Mỗi câu hỏi nên tập trung vào một chủ đề.', 'Hello! Do you need help borrowing, reserving or using Library74? Please ask about one topic at a time.')}</p>
        {messages.map((message, index) => <div key={index} className={`max-w-[95%] rounded-xl p-3 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
          <span className="sr-only">{message.role === 'user' ? t('Bạn: ', 'You: ') : t('Trợ lý: ', 'Assistant: ')}</span>
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          {safeSource(message.sourcePath) && <Link to={message.sourcePath!} onClick={close} className={`mt-2 inline-block rounded text-xs font-semibold text-blue-700 underline dark:text-blue-300 ${focusClass}`}>
            {t('Xem hướng dẫn: ', 'Read guide: ')}{message.sourceTitle}
          </Link>}
        </div>)}
        {busy && <p role="status" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Loader2 aria-hidden="true" size={16} className="motion-safe:animate-spin" />{t('Đang đối chiếu hướng dẫn…', 'Matching reviewed guidance…')}</p>}
      </div>
      <div className="shrink-0 space-y-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
        {suggestionError && <p role="status" className="text-xs text-amber-800 dark:text-amber-300">{t('Chưa tải được câu hỏi gợi ý. Bạn có thể nhập câu hỏi hoặc mở hướng dẫn.', 'Suggested questions could not be loaded. Type a question or open the guide.')}</p>}
        {suggestions.length > 0 && <><label htmlFor="faq-chat-topics" className="sr-only">{t('Chọn câu hỏi gợi ý', 'Choose a suggested question')}</label>
          <select id="faq-chat-topics" value="" disabled={busy} onChange={event => { if (event.target.value) void send(event.target.value); }}
            className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 ${focusClass}`}>
            <option value="">{t('Chọn câu hỏi gợi ý…', 'Choose a suggested question…')}</option>
            {suggestions.map(item => <option key={item.id} value={item.question}>{item.question}</option>)}
          </select></>}
        {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
        <form onSubmit={submit} className="flex items-end gap-2">
          <label htmlFor="faq-chat-question" className="sr-only">{t('Câu hỏi về Library74', 'Question about Library74')}</label>
          <textarea ref={input} id="faq-chat-question" rows={2} maxLength={500} value={draft} onChange={event => setDraft(event.target.value)}
            placeholder={t('Ví dụ: Làm cách nào để mượn sách?', 'For example: How can I borrow a book?')}
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(draft); } }}
            className={`min-w-0 flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-400 ${focusClass}`} />
          <button type="submit" disabled={busy || !draft.trim()} aria-label={t('Gửi câu hỏi', 'Send question')} className={`rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusClass}`}><Send aria-hidden="true" size={20} /></button>
        </form>
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300"><Link to="/publicpage/guide" onClick={close} className={`rounded underline ${focusClass}`}>{t('Mở hướng dẫn', 'Open user guide')}</Link><span>{draft.length}/500</span></div>
      </div>
    </section>}
    <button ref={launcher} type="button" onClick={() => open ? close() : setOpen(true)} aria-label={open ? t('Ẩn trợ lý hướng dẫn', 'Hide help assistant') : t('Mở trợ lý hướng dẫn', 'Open help assistant')}
      aria-expanded={open} aria-controls="library74-faq-chat"
      className={`fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-800 sm:right-6 ${focusClass}`}>
      <MessageCircle aria-hidden="true" size={26} />
    </button>
  </>;
}

export default function FaqChatbot() {
  const { language } = useLanguage();
  const { uploads } = useUpload();
  // The existing upload panel occupies this corner and takes priority over help.
  if (uploads.length > 0) return null;
  // Language changes discard pending requests and local conversation instead of mixing responses.
  return <FaqChatbotPanel key={language} language={language} />;
}
