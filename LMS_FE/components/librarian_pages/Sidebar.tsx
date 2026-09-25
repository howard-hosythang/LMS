import {
  Barcode,
  Book,
  BookOpen,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  LogOut,
  BarChart3,
  RefreshCcw,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import contactService from '../../api/contactService';
import librarianDashboardService from '../../api/librarianDashboardService';
import usersService, { UserProfileResponse } from '../../api/usersService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { BrandLogo } from '../BrandLogo';

type SidebarItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
  badgeColor?: string;
};

const Sidebar = ({
  collapsed = false,
  mobileOpen = false,
  hidden = false,
  onNavigate,
}: {
  collapsed?: boolean;
  mobileOpen?: boolean;
  hidden?: boolean;
  onNavigate?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language, t } = useTranslation();
  const [profile, setProfile] = useState<UserProfileResponse['data'] | null>(
    null
  );
  const [sidebarStats, setSidebarStats] = useState({
    totalPublications: 0,
    pendingActions: 0,
    newContactMessages: 0,
  });

  useEffect(() => {
    let mounted = true;

    const loadSidebarStats = async () => {
      try {
        const response = await librarianDashboardService.getSummary();
        if (mounted && response.code === 200) {
          const pending = response.data.pendingActions;
          const contactSummary = await contactService.summary().catch(() => null);
          setSidebarStats({
            totalPublications: response.data.overview.totalPublications || 0,
            pendingActions:
              (pending.waitingForPickup || 0) +
              (pending.reservationsPending || 0) +
              (pending.overdueTransactions || 0),
            newContactMessages: contactSummary?.data?.newCount || 0,
          });
        }
      } catch (error) {
        console.error('Failed to load librarian sidebar stats:', error);
      }
    };

    loadSidebarStats();
    const intervalId = window.setInterval(loadSidebarStats, 60_000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    usersService
      .getMyProfile()
      .then((response) => {
        if (mounted) setProfile(response.data);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const menuSections = useMemo<{ label: string; items: SidebarItem[] }[]>(
    () => [
      {
        label: language === 'en' ? 'Workspace' : 'Bàn làm việc',
        items: [
          {
            icon: LayoutDashboard,
            label: t('librarian.home'),
            path: '/librarianpage/dashboard',
          },
          {
            icon: RefreshCcw,
            label: t('librarian.circulation'),
            path: '/librarianpage/circulation',
          },
        ],
      },
      {
        label: language === 'en' ? 'Catalog' : 'Kho sách',
        items: [
          {
            icon: Book,
            label: t('librarian.books'),
            path: '/librarianpage/books',
            badge:
              sidebarStats.totalPublications > 0
                ? sidebarStats.totalPublications
                : undefined,
          },
          {
            icon: Barcode,
            label: t('librarian.copies'),
            path: '/librarianpage/copies',
          },
        ],
      },
      {
        label: language === 'en' ? 'Operations' : 'Vận hành',
        items: [
          {
            icon: ClipboardList,
            label: t('librarian.transactions'),
            path: '/librarianpage/transactions',
            badge:
              sidebarStats.pendingActions > 0
                ? sidebarStats.pendingActions
                : undefined,
            badgeColor: 'bg-red-100 text-red-600',
          },
          {
            icon: Inbox,
            label: t('librarian.contactInbox'),
            path: '/librarianpage/contact-inbox',
            badge: sidebarStats.newContactMessages > 0 ? sidebarStats.newContactMessages : undefined,
            badgeColor: 'bg-amber-100 text-amber-700',
          },
        ],
      },
      {
        label: language === 'en' ? 'Analytics' : 'Báo cáo',
        items: [
          {
            icon: BarChart3,
            label: t('librarian.reports'),
            path: '/librarianpage/reports',
          },
        ],
      },
    ],
    [language, sidebarStats.newContactMessages, sidebarStats.pendingActions, sidebarStats.totalPublications, t]
  );

  const systemItems: SidebarItem[] = [
    {
      icon: Settings,
      label: t('librarian.settings'),
      path: '/librarianpage/settings',
    },
  ];

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside
      aria-hidden={hidden}
      className={`fixed left-0 top-0 z-40 flex h-screen w-64 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 ${
        mobileOpen
          ? 'translate-x-0'
          : collapsed
            ? '-translate-x-full'
            : '-translate-x-[calc(100%+1rem)] lg:translate-x-0'
      }`}
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between gap-3">
        <Link
          to="/librarianpage/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <BrandLogo size="lg" subtitle={t('librarian.librarianPages')} />
        </Link>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {menuSections.map((section) => (
          <div key={section.label} className="mb-6">
            <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 dark:text-slate-500">
              {section.label}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-5 h-5 ${
                        isActive(item.path) ? 'text-blue-600 dark:text-blue-200' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.badgeColor || 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-100'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 dark:text-slate-500">
            {t('librarian.system')}
          </h2>
          <div className="space-y-1">
            {systemItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive(item.path) ? 'text-blue-600 dark:text-blue-200' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.badgeColor || 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {profile?.profilePictureUrl ? (
            <img
              src={profile.profilePictureUrl}
              alt={profile.fullName}
              className="h-10 w-10 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 truncate dark:text-white">
              {profile?.fullName || t('librarian.role')}
            </p>
            <p className="text-xs text-slate-500 truncate dark:text-slate-300">
              {profile?.studentId
                ? `Mã thủ thư: ${profile.studentId}`
                : t('librarian.role')}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/15 dark:hover:text-red-100"
        >
          <LogOut className="h-5 w-5" />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
