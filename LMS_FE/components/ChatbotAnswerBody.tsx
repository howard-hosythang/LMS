import { Link } from 'react-router-dom';
import type { FaqCard, FaqContent } from '../api/chatbotService';

export const safeChatPath = (path?: string) => !!path && (
  /^\/publicpage\/(guide|faq|about|contact|privacy-policy|login|search)$/.test(path)
  || /^\/publicpage\/book\/[1-9][0-9]*$/.test(path)
  || /^\/userpage\/(my-books|fines|reservations|wishlist|notifications)$/.test(path)
);
const safeImage = (url?: string | null) => !!url && (/^https?:\/\/[^\s]+$/i.test(url)
  || (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')));

export function ChatbotAnswerBody({ text, content }: { text: string; content?: FaqContent | null }) {
  if (!content || typeof content.summary !== 'string' || typeof content.note !== 'string'
    || !Array.isArray(content.steps) || !content.steps.every(step => typeof step === 'string')
    || !Array.isArray(content.bullets) || !content.bullets.every(bullet => typeof bullet === 'string')) {
    return <p className="whitespace-pre-wrap break-words">{text}</p>;
  }
  return <div className="space-y-3 break-words">
    {content.summary && <p>{content.summary}</p>}
    {content.steps.length > 0 && <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-blue-700 dark:marker:text-blue-300">
      {content.steps.map((step, index) => <li key={index} className="pl-1">{step}</li>)}
    </ol>}
    {content.bullets.length > 0 && <ul className="list-disc space-y-2 pl-5">
      {content.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}
    </ul>}
    {content.note && <p className="border-l-2 border-blue-400 pl-3 text-slate-600 dark:text-slate-300">{content.note}</p>}
  </div>;
}

export function ChatbotCards({ cards, language }: { cards: FaqCard[]; language: 'vi' | 'en' }) {
  const en = language === 'en';
  return <div className="mt-3 space-y-3">{cards.slice(0, 5).map((card, index) => <article key={`${card.id}-${index}`}
    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-900">
    <div className="flex items-start gap-3">
      {safeImage(card.imageUrl) && <img src={card.imageUrl!} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-20 w-14 shrink-0 rounded object-cover" />}
      <div className="min-w-0 flex-1">
        <h3 className="break-words font-semibold">{card.title}</h3>
        {card.subtitle && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-600 dark:text-slate-300">{card.subtitle}</p>}
      </div>
    </div>
    <dl className="mt-2 space-y-2 text-xs">{card.facts.map((fact, field) => <div key={field}>
      <dt className="font-medium text-slate-500 dark:text-slate-400">{fact.label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words">{fact.value}</dd>
    </div>)}</dl>
    {safeChatPath(card.path) && <Link to={card.path} target="_blank" rel="noopener noreferrer"
      className="mt-3 inline-block rounded font-semibold text-blue-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300">
      {en ? 'Open details in a new tab' : 'Mở chi tiết ở tab mới'}
    </Link>}
  </article>)}</div>;
}
