export const REVIEW_TAGS = [
  { vi: 'Đáng đọc', en: 'Worth reading', tone: 'positive' },
  { vi: 'Dễ áp dụng', en: 'Practical', tone: 'positive' },
  { vi: 'Ví dụ rõ ràng', en: 'Clear examples', tone: 'positive' },
  { vi: 'Nội dung cập nhật', en: 'Up to date', tone: 'positive' },
  { vi: 'Phù hợp sinh viên', en: 'Student-friendly', tone: 'positive' },
  { vi: 'Truyền cảm hứng', en: 'Inspiring', tone: 'positive' },
  { vi: 'Nền tảng tốt', en: 'Strong fundamentals', tone: 'positive' },
  { vi: 'Nhiều lý thuyết', en: 'Theory-heavy', tone: 'neutral' },
  { vi: 'Khó hiểu', en: 'Hard to follow', tone: 'critical' },
  { vi: 'Cần đọc kèm tài liệu khác', en: 'Needs companion reading', tone: 'neutral' },
] as const;

const TONE_CLASSES = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  critical: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  neutral: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
  default: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function getReviewTagClass(label: string): string {
  const normalized = label.trim().toLowerCase();
  const tag = REVIEW_TAGS.find(item => item.vi.toLowerCase() === normalized || item.en.toLowerCase() === normalized);
  return TONE_CLASSES[tag?.tone ?? 'default'];
}

// Keep compatibility with existing comments without changing the API/storage format.
export function parseReviewComment(rawText: string): { tags: string[]; cleanComment: string } {
  const header = /^(?:Nhãn|Tags):[ \t]*([^\r\n]*)(?:\r\n|\n|\r|$)/i.exec(rawText);
  if (!header) return { tags: [], cleanComment: rawText };
  return {
    tags: [...new Set(header[1].split(',').map(tag => tag.trim()).filter(Boolean))],
    cleanComment: rawText.slice(header[0].length).replace(/^(?:[ \t]*(?:\r\n|\n|\r))+/, ''),
  };
}

export function formatReviewComment(tags: string[], comment: string): string {
  const cleanComment = comment.trim();
  if (!tags.length) return cleanComment;
  return `Nhãn: ${tags.join(', ')}${cleanComment ? `\n\n${cleanComment}` : ''}`;
}
