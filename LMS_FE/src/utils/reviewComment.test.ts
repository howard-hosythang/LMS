import { formatReviewComment, getReviewTagClass, parseReviewComment } from '../../utils/reviewComment';

describe('review comment parsing', () => {
  it('separates Vietnamese tags and multiline review content', () => {
    expect(parseReviewComment('Nhãn: Đáng đọc, Dễ áp dụng\n\nDòng một\nDòng hai')).toEqual({
      tags: ['Đáng đọc', 'Dễ áp dụng'], cleanComment: 'Dòng một\nDòng hai',
    });
  });

  it('supports English headers and Windows line endings', () => {
    expect(parseReviewComment('Tags: Practical, Hard to follow\r\n\r\nUseful book')).toEqual({
      tags: ['Practical', 'Hard to follow'], cleanComment: 'Useful book',
    });
  });

  it('preserves ordinary comments verbatim, including embedded tag-like text', () => {
    const text = '  Nhận xét\nNhãn: Đây là nội dung, không phải metadata.\n';
    expect(parseReviewComment(text)).toEqual({ tags: [], cleanComment: text });
  });

  it('supports tags-only reviews without blank body', () => {
    expect(parseReviewComment('Nhãn: Đáng đọc\n\n')).toEqual({ tags: ['Đáng đọc'], cleanComment: '' });
    expect(formatReviewComment(['Đáng đọc'], '')).toBe('Nhãn: Đáng đọc');
  });

  it('trims empty tags, removes duplicates and keeps unknown tags', () => {
    expect(parseReviewComment('Tags: Practical, , Custom tag, Practical\nReview')).toEqual({
      tags: ['Practical', 'Custom tag'], cleanComment: 'Review',
    });
  });

  it('preserves the original tags when serializing edited body', () => {
    const parsed = parseReviewComment('Tags: Practical, Custom tag\n\nOld comment');
    expect(parseReviewComment(formatReviewComment(parsed.tags, '  New comment  '))).toEqual({
      tags: ['Practical', 'Custom tag'], cleanComment: 'New comment',
    });
  });

  it.each([
    ['Đáng đọc', 'emerald'], ['Practical', 'emerald'],
    ['Khó hiểu', 'rose'], ['Hard to follow', 'rose'],
    ['Nhiều lý thuyết', 'blue'], ['Needs companion reading', 'blue'],
    ['Custom tag', 'slate'],
  ])('maps %s to its tone in both themes', (tag, color) => {
    expect(getReviewTagClass(tag)).toContain(`border-${color}-`);
    expect(getReviewTagClass(tag)).toContain(`dark:text-${color}-300`);
  });
});
