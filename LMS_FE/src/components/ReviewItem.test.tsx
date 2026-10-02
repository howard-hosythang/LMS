import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import publicationsService from '../../api/publicationsService';
import { ReviewItem } from '../../pages/public_pages/BookDetailPage';

jest.mock('../../api/axiosInstance', () => ({ __esModule: true, default: {} }));
jest.mock('../../components/Seo', () => ({ __esModule: true, default: () => null }));
jest.mock('../../contexts/LanguageContext', () => ({
  useTranslation: () => ({ language: 'vi', t: (key: string) => key }),
}));
jest.mock('../../api/publicationsService', () => ({
  __esModule: true, default: { updatePublicationRating: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

test('edit textarea excludes the tag header and saving retains tags', async () => {
  const onRefresh = jest.fn();
  jest.mocked(publicationsService.updatePublicationRating).mockResolvedValue({ code: 200 } as any);
  render(<ReviewItem name="Bạn đọc" faculty="Khoa CNTT" date="01/10/2026" rating={5}
    text={'Nhãn: Đáng đọc, Nhãn riêng\n\nNội dung cũ'} likes={0} liked={false}
    editableByCurrentUser userType="student" publicationId="1" ratingId="2" onRefresh={onRefresh} />);
  fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa đánh giá' }));
  const textarea = screen.getByRole('textbox', { name: 'bookDetail.comment' });
  expect(textarea).toHaveValue('Nội dung cũ');
  expect(screen.getByText('Đáng đọc')).toHaveClass('border-emerald-200');
  expect(screen.getByText('Nhãn riêng')).toHaveClass('border-slate-200');
  fireEvent.change(textarea, { target: { value: 'Nội dung mới' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chỉnh sửa' }));
  await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  expect(publicationsService.updatePublicationRating).toHaveBeenCalledWith('1', '2', {
    star: 5, comment: 'Nhãn: Đáng đọc, Nhãn riêng\n\nNội dung mới',
  });
});
