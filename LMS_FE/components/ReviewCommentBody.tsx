import { getReviewTagClass, parseReviewComment } from '../utils/reviewComment';

export function ReviewTagBadges({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return <div className="flex flex-wrap gap-2">
    {tags.map((tag, index) => <span key={`${tag}-${index}`}
      className={`max-w-full break-words rounded-full border px-2.5 py-1 text-xs font-semibold ${getReviewTagClass(tag)}`}>
      {tag}
    </span>)}
  </div>;
}

export default function ReviewCommentBody({ text }: { text: string }) {
  const { tags, cleanComment } = parseReviewComment(text);
  if (!tags.length && !cleanComment) return null;
  return <div className="mb-3 flex flex-col gap-2.5">
    <ReviewTagBadges tags={tags} />
    {cleanComment && <p className="whitespace-pre-wrap break-words text-sm text-gray-700 leading-relaxed dark:text-slate-100">{cleanComment}</p>}
  </div>;
}
