import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { LibrarianLayout } from '../../components/librarian_pages/LibrarianLayout';

jest.mock('../../components/librarian_pages/Sidebar', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/librarian_pages/LibrarianI18nBridge', () => ({ LibrarianI18nBridge: () => null }));
jest.mock('../../components/public_pages/Layout', () => ({ Footer: () => null }));
jest.mock('../../components/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }));
jest.mock('../../components/ThemeModeToggle', () => ({ ThemeModeToggle: () => null }));
jest.mock('../../contexts/LanguageContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../contexts/NotificationContext', () => ({ useNotifications: () => ({ unreadCount: 0 }) }));

beforeAll(() => {
  // jsdom does not implement the browser's element.scrollTo API.
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: jest.fn() });
});

function Content() {
  const [count, setCount] = useState(0);
  return <><button onClick={() => setCount(value => value + 1)}>Count {count}</button>
    <Link to="/librarianpage/transactions?keyword=Book">Filter</Link>
    <Link to="/librarianpage/books">Other page</Link></>;
}

test('query changes preserve the librarian content DOM, state and scroll; a different pathname resets them', () => {
  const { container } = render(<MemoryRouter initialEntries={['/librarianpage/transactions']}>
    <LibrarianLayout><Content /></LibrarianLayout>
  </MemoryRouter>);
  const content = container.querySelector<HTMLElement>('[data-route-scroll-container]')!;
  content.scrollTop = 850;
  fireEvent.click(screen.getByRole('button', { name: 'Count 0' }));
  fireEvent.click(screen.getByText('Filter'));
  expect(container.querySelector('[data-route-scroll-container]')).toBe(content);
  expect(content.scrollTop).toBe(850);
  expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
  fireEvent.click(screen.getByText('Other page'));
  const nextContent = container.querySelector<HTMLElement>('[data-route-scroll-container]')!;
  expect(nextContent).not.toBe(content);
  expect(nextContent.scrollTop).toBe(0);
  expect(screen.getByRole('button', { name: 'Count 0' })).toBeInTheDocument();
});
