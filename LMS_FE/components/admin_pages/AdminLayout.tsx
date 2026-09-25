import { BookOpen, ClipboardList, GraduationCap, LogOut, Menu, MessageSquare, Settings, Users } from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import usersService, { UserProfileResponse } from '../../api/usersService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { BrandLogo } from '../BrandLogo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeModeToggle } from '../ThemeModeToggle';

const items = [
  { icon: Users, labelVi: 'Tài khoản thủ thư', labelEn: 'Librarian accounts', path: '/adminpage/librarians' },
  { icon: GraduationCap, labelVi: 'Tài khoản người dùng', labelEn: 'User accounts', path: '/adminpage/users' },
  { icon: MessageSquare, labelVi: 'Phiếu hỗ trợ', labelEn: 'Support tickets', path: '/adminpage/contact-tickets' },
  { icon: Settings, labelVi: 'Quy định mượn trả', labelEn: 'Circulation policies', path: '/adminpage/policies' },
  { icon: ClipboardList, labelVi: 'Nhật ký thao tác', labelEn: 'Audit logs', path: '/adminpage/audit-logs' },
  { icon: Settings, labelVi: 'Cài đặt tài khoản', labelEn: 'Account settings', path: '/adminpage/settings' },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language } = useTranslation();
  const [profile, setProfile] = React.useState<UserProfileResponse['data'] | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = React.useState(false);
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
    let mounted = true;
    usersService.getMyProfile()
      .then((response) => {
        if (mounted) setProfile(response.data);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncViewport = () => setIsDesktopViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/publicpage/login');
  };

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
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          aria-label={language === 'en' ? 'Close navigation' : 'Đóng thanh điều hướng'}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside aria-hidden={isDesktopViewport ? collapsed : !mobileSidebarOpen} className={`fixed left-0 top-0 z-40 flex h-screen w-64 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 ${
        mobileSidebarOpen
          ? 'translate-x-0'
          : collapsed
            ? '-translate-x-full'
            : '-translate-x-[calc(100%+1rem)] lg:translate-x-0'
      }`}>
        <div className="flex items-center justify-between p-6">
        <Link to="/adminpage/librarians" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3">
          <BrandLogo size="lg" subtitle="Admin Portal" />
        </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {language === 'en' ? 'System administration' : 'Quản trị hệ thống'}
          </div>
          <div className="space-y-1">
            {items.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active ? 'bg-slate-900 text-white dark:bg-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  {language === 'en' ? item.labelEn : item.labelVi}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4">
            {profile?.profilePictureUrl ? (
              <img src={profile.profilePictureUrl} alt={profile.fullName} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BookOpen size={19} />
              </div>
            )}
            <div>
              <div className="text-sm font-bold">{profile?.fullName || (language === 'en' ? 'Administrator' : 'Quản trị viên')}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{profile?.email || (language === 'en' ? 'Primary admin account' : 'Tài khoản admin duy nhất')}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={18} />
            {language === 'en' ? 'Sign out' : 'Đăng xuất'}
          </button>
        </div>
      </aside>
      <main
        className={`flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${collapsed ? 'lg:ml-0' : 'lg:ml-64'}`}
        data-admin-content
      >
        <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label={mobileSidebarOpen || (!collapsed && isDesktopViewport) ? (language === 'en' ? 'Hide navigation' : 'Ẩn thanh điều hướng') : (language === 'en' ? 'Show navigation' : 'Hiện thanh điều hướng')}
              aria-expanded={isDesktopViewport ? !collapsed : mobileSidebarOpen}
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-black uppercase text-blue-600">Admin Portal</div>
              <div className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'System administration' : 'Quản trị hệ thống'}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeModeToggle compact />
            <LanguageSwitcher compact />
          </div>
        </header>
        <div
          key={routeScrollKey}
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
          data-route-scroll-container
        >
          {children}
        </div>
      </main>
    </div>
  );
};
