import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LibrarianI18nBridge } from './LibrarianI18nBridge';
import { Footer } from '../public_pages/Layout';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeModeToggle } from '../ThemeModeToggle';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';

const LibrarianPublicHeader = ({ leftControl }: { leftControl: React.ReactNode }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const publicNavItems = [
    { label: t('nav.home'), to: '/librarianpage/public' },
    { label: t('nav.search'), to: '/librarianpage/public/search' },
    { label: t('nav.categories'), to: '/librarianpage/public/categories' },
    { label: t('nav.about'), to: '/librarianpage/public/about' },
  ];

  const isActive = (path: string) =>
    path === '/librarianpage/public'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:px-6">
      <div className="flex w-24 items-center">
        {leftControl}
      </div>

      <nav className="hidden items-center justify-center gap-8 xl:flex">
        {publicNavItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`text-sm font-semibold transition-colors ${
              isActive(item.to)
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <ThemeModeToggle compact />
        <LanguageSwitcher compact />
        <Link
          to="/librarianpage/notifications"
          className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label={t('notifications.title')}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white dark:border-slate-950">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};

export const LibrarianLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = React.useState(false);
  const isPublicBrowsing = location.pathname.startsWith('/librarianpage/public');
  const routeScrollKey = `${location.pathname}${location.search}`;
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    element.scrollTop = 0;
    element.scrollLeft = 0;
    element.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [routeScrollKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncViewport = () => setIsDesktopViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  const toggleSidebar = () => {
    const isDesktop =
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
      setCollapsed((value) => !value);
      setMobileSidebarOpen(false);
      return;
    }

    setMobileSidebarOpen((value) => !value);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          aria-label="Đóng thanh điều hướng"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileSidebarOpen}
        hidden={isDesktopViewport ? collapsed : !mobileSidebarOpen}
        onNavigate={() => setMobileSidebarOpen(false)}
      />
      <main className={`flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${collapsed ? 'lg:ml-0' : 'lg:ml-64'}`} data-librarian-content>
        <LibrarianI18nBridge />
        <LibrarianPublicHeader
          leftControl={(
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label={mobileSidebarOpen || (!collapsed && isDesktopViewport) ? 'Ẩn thanh điều hướng' : 'Hiện thanh điều hướng'}
              aria-expanded={isDesktopViewport ? !collapsed : mobileSidebarOpen}
            >
              <Menu size={20} />
            </button>
          )}
        />
        <div
          key={routeScrollKey}
          ref={contentRef}
          className={`min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden ${isPublicBrowsing ? 'p-0' : ''}`}
          data-route-scroll-container
        >
          {children}
          {isPublicBrowsing && <Footer />}
        </div>
      </main>
    </div>
  );
};
