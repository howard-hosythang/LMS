import { isPublicRequest } from '../../api/publicRequestPolicy';

describe('axiosInstance public route detection', () => {
  it('keeps public publication discovery endpoints unauthenticated', () => {
    expect(isPublicRequest({ method: 'get', url: '/publications/search?keyword=ai' })).toBe(true);
    expect(isPublicRequest({ method: 'get', url: '/publications/123' })).toBe(true);
    expect(isPublicRequest({ method: 'get', url: '/publications/123/similar?limit=6' })).toBe(true);
  });

  it('requires auth for librarian publication management endpoints', () => {
    expect(isPublicRequest({ method: 'get', url: '/publications/librarian?page=0&size=20' })).toBe(false);
    expect(isPublicRequest({ method: 'get', url: '/publications/123/document-upload-url?filename=book.pdf' })).toBe(false);
    expect(isPublicRequest({ method: 'get', url: '/publications/book-lookup?q=9780521809269' })).toBe(false);
    expect(isPublicRequest({ method: 'get', url: '/authors?keyword=martin' })).toBe(false);
    expect(isPublicRequest({ method: 'get', url: '/publishers?keyword=pearson' })).toBe(false);
    expect(isPublicRequest({ method: 'get', url: '/tags?keyword=ai' })).toBe(false);
    expect(isPublicRequest({ method: 'get', url: '/categories/search?keyword=computer' })).toBe(false);
  });
});
