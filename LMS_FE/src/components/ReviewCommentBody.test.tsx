import { render, screen } from '@testing-library/react';
import ReviewCommentBody from '../../components/ReviewCommentBody';

test('renders separate tone badges above the clean comment, not the stored header', () => {
  const { container } = render(<ReviewCommentBody text={'Nhãn: Đáng đọc, Khó hiểu, Nhiều lý thuyết, Khác\n\nNhận xét thực tế'} />);
  expect(screen.getByText('Đáng đọc')).toHaveClass('rounded-full', 'border', 'border-emerald-200', 'dark:text-emerald-300');
  expect(screen.getByText('Khó hiểu')).toHaveClass('border-rose-200', 'dark:text-rose-300');
  expect(screen.getByText('Nhiều lý thuyết')).toHaveClass('border-blue-200', 'dark:text-blue-300');
  expect(screen.getByText('Khác')).toHaveClass('border-slate-200', 'dark:text-slate-300');
  expect(container.querySelector('p')).toHaveTextContent('Nhận xét thực tế');
  expect(container.textContent).not.toContain('Nhãn:');
  expect(container.firstElementChild).toHaveClass('gap-2.5');
});

test('renders English tags and no empty paragraph for tags-only reviews', () => {
  const { container } = render(<ReviewCommentBody text={'Tags: Worth reading, Hard to follow\n\n'} />);
  expect(screen.getByText('Worth reading')).toHaveClass('border-emerald-200');
  expect(screen.getByText('Hard to follow')).toHaveClass('border-rose-200');
  expect(container.querySelector('p')).toBeNull();
  expect(container.textContent).not.toContain('Tags:');
});

test('keeps plain comments unchanged without generating badges', () => {
  const { container } = render(<ReviewCommentBody text={'Nội dung thường\nDòng thứ hai'} />);
  expect(container.querySelector('p')?.textContent).toBe('Nội dung thường\nDòng thứ hai');
  expect(container.querySelector('span')).toBeNull();
});
