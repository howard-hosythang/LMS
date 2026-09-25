import {
  Bell,
  Book,
  BookOpen,
  Clock,
  DollarSign,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import usersService, { UserProfileResponse } from '../../api/usersService';
import { useNotifications } from '../../contexts/NotificationContext';
import { getMyReservations } from '../../api/reservationService';
import transactionsService from '../../api/transactionsService';
import wishlistService from '../../api/wishlistService';
import fineService from '../../api/fineService';
import { Footer } from '../public_pages/Layout';
import { useTranslation } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeModeToggle } from '../ThemeModeToggle';
import { BrandLogo } from '../BrandLogo';

const SidebarItem = ({ to, icon: Icon, label, active, count }: any) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <div className="flex items-center">
      <Icon
        size={20}
        className={`mr-3 ${active ? 'text-white' : 'text-gray-500'}`}
      />
      {label}
    </div>
    {count !== undefined && count > 0 && (
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {count}
      </span>
    )}
  </Link>
);

export const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = React.useState(false);
  const [profile, setProfile] = useState<UserProfileResponse['data'] | null>(null);
  const [pendingReservations, setPendingReservations] = useState(0);
  const [activeBorrows, setActiveBorrows] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unpaidFineCount, setUnpaidFineCount] = useState(0);
  const { unreadCount } = useNotifications();
  const { t } = useTranslation();
  const isPublicBrowsing = location.pathname.startsWith('/publicpage');
  const routeScrollKey = `${location.pathname}${location.search}`;
  const contentRef = React.useRef<HTMLElement | null>(null);
  const publicNavItems = [
    { label: t('nav.home'), to: '/publicpage' },
    { label: t('nav.search'), to: '/publicpage/search' },
    { label: t('nav.categories'), to: '/publicpage/categories' },
    { label: t('nav.about'), to: '/publicpage/about' },
  ];

  React.useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    element.scrollTop = 0;
    element.scrollLeft = 0;
    element.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [routeScrollKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncViewport = () => setIsDesktopViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await usersService.getMyProfile();
        if (res && res.data) setProfile(res.data);
      } catch {}
    };
    const fetchCounts = async () => {
      try {
        const [resData, txData, wishlistData, fineData] = await Promise.all([
          getMyReservations(0, 50),
          transactionsService.getMyTransactions(0, 50),
          wishlistService.getMyWishlist(),
          fineService.getMyFines('UNPAID', 0, 50),
        ]);
        setPendingReservations(
          resData.content.filter(r => r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP').length
        );
        setActiveBorrows(
          txData.data.content.filter(
            (t: any) => t.status === 'BORROWING' || t.status === 'OVERDUE' || t.status === 'WAITING_FOR_PICKUP'
          ).length
        );
        setWishlistCount(wishlistData.data.length);
        setUnpaidFineCount(fineData.data.content.length);
      } catch {}
    };
    fetchProfile();
    fetchCounts();
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname.includes(path);

  const { logout } = useAuth();

  const toggleSidebar = () => {
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      setSidebarCollapsed((collapsed) => !collapsed);
      setSidebarOpen(false);
      return;
    }

    setSidebarCollapsed(false);
    setSidebarOpen((open) => !open);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-hidden={isDesktopViewport ? isSidebarCollapsed : !isSidebarOpen}
        className={`
        fixed lg:sticky top-0 h-screen left-0 z-50 w-64 shrink-0 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${
          isSidebarOpen ? 'translate-x-0' : isSidebarCollapsed ? '-translate-x-[calc(100%+1rem)]' : '-translate-x-[calc(100%+1rem)] lg:translate-x-0'
        }
      `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
          <Link to="/userpage/dashboard" className="flex items-center">
            <BrandLogo size="sm" subtitle="NEXT-GEN DISCOVERY" />
          </Link>
        </div>

        <div className="flex-grow p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-2">
            {t('user.section.overview')}
          </div>
          <SidebarItem
            to="/userpage/dashboard"
            icon={LayoutDashboard}
            label={t('common.dashboard')}
            active={isActive('/dashboard')}
          />
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-6">
            {t('user.section.personal')}
          </div>
          <SidebarItem
            to="/userpage/my-books"
            icon={Book}
            label={t('user.borrowedBooks')}
            count={activeBorrows || undefined}
            active={isActive('/my-books')}
          />
          <SidebarItem
            to="/userpage/reservations"
            icon={Clock}
            label={t('user.reservations')}
            count={pendingReservations || undefined}
            active={isActive('/reservations')}
          />
          <SidebarItem
            to="/userpage/wishlist"
            icon={Heart}
            label={t('user.wishlist')}
            count={wishlistCount || undefined}
            active={isActive('/wishlist')}
          />
          <SidebarItem
            to="/userpage/fines"
            icon={DollarSign}
            label={t('user.fines')}
            count={unpaidFineCount || undefined}
            active={isActive('/fines')}
          />
          <SidebarItem
            to="/userpage/contact-tickets"
            icon={MessageSquare}
            label={t('user.contactSupport')}
            active={isActive('/contact-tickets')}
          />
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-2">
            {t('user.section.settings')}
          </div>
          <SidebarItem
            to="/userpage/profile"
            icon={User}
            label={t('user.profile')}
            active={isActive('/profile')}
          />
          <SidebarItem
            to="/userpage/settings"
            icon={Settings}
            label={t('user.settings')}
            active={isActive('/settings')}
          />
        </div>

        {/* User Mini Profile in Sidebar - Above Settings */}
        <div className="p-4 border-t border-gray-200 mt-6">
          <div className="flex items-center mb-3">
            {profile?.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt="User"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
                <User size={20} className="text-gray-500" />
              </div>
            )}
            <div className="ml-3 overflow-hidden flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.fullName || t('common.loading')}
              </p>
              <p className="text-xs text-gray-500 truncate">{profile?.studentId || profile?.email || ''}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${isSidebarCollapsed ? 'lg:-ml-64' : ''}`}>
        {/* Top Header for public navigation and notifications */}
        <header className="z-30 flex h-20 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:px-8">
          <div className="flex items-center min-w-0 z-10">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
              aria-label="Ẩn/hiện thanh điều hướng"
              aria-expanded={!isSidebarCollapsed || isSidebarOpen}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-800 xl:hidden">
              Library74
            </h2>
          </div>

          <nav className="hidden xl:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2">
            {publicNavItems.map(item => {
              const active = item.to === '/publicpage'
                ? location.pathname === item.to
                : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-semibold transition-colors ${
                  active
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4 z-10">
            <ThemeModeToggle compact />
            <LanguageSwitcher compact />
            <Link
              to="/userpage/notifications"
              className="p-2 text-gray-400 hover:text-gray-600 relative rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 rounded-full border-2 border-white text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main
          key={routeScrollKey}
          ref={contentRef}
          className={`min-h-0 flex-1 overflow-y-auto ${isPublicBrowsing ? 'p-0' : 'p-4 lg:p-8'}`}
          data-user-content
          data-route-scroll-container
        >
          {children}
          {isPublicBrowsing && <Footer />}
        </main>
      </div>
    </div>
  );
};
