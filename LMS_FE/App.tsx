import React, { Suspense, lazy } from 'react';
import {
  Navigate,
  Route,
  HashRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AdminLayout } from './components/admin_pages/AdminLayout';
import { LibrarianLayout } from './components/librarian_pages/LibrarianLayout';
import { ErrorLayout } from './components/public_pages/ErrorLayout';
import { Layout } from './components/public_pages/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { ProtectedLayout } from './components/user_pages/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDialogProvider } from './contexts/AppDialogContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UploadProvider } from './contexts/UploadContext';
import UploadPanel from './components/UploadPanel';
import { Toaster } from 'sonner';
import CookieConsentBanner from './components/CookieConsentBanner';
import { RouteSeo } from './components/Seo';

const AboutPage = lazy(() => import('./pages/public_pages/AboutPage'));
const BookDetailPage = lazy(() => import('./pages/public_pages/BookDetailPage'));
const CategoriesPage = lazy(() => import('./pages/public_pages/CategoriesPage'));
const ContactPage = lazy(() => import('./pages/public_pages/ContactPage'));
const CookiePolicyPage = lazy(() => import('./pages/public_pages/CookiePolicyPage'));
const FAQPage = lazy(() => import('./pages/public_pages/FAQPage'));
const HomePage = lazy(() => import('./pages/public_pages/HomePage'));
const LoginPage = lazy(() => import('./pages/public_pages/LoginPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/public_pages/PrivacyPolicyPage'));
const RegisterPage = lazy(() => import('./pages/public_pages/RegisterPage'));
const CheckEmailPage = lazy(() => import('./pages/public_pages/CheckEmailPage'));
const VerificationSuccessPage = lazy(() => import('./pages/public_pages/VerificationSuccessPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public_pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/public_pages/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('./pages/public_pages/OnboardingPage'));
const PublicSearchPage = lazy(() => import('./pages/public_pages/SearchPage'));
const ServiceTermsPage = lazy(() => import('./pages/public_pages/ServiceTermsPage'));
const SystemReviewsPage = lazy(() => import('./pages/public_pages/SystemReviewsPage'));
const TermsPage = lazy(() => import('./pages/public_pages/TermsPage'));
const UserGuidePage = lazy(() => import('./pages/public_pages/UserGuidePage'));
const OAuth2CallbackPage = lazy(() => import('./pages/public_pages/OAuth2CallbackPage'));

const DashboardPage = lazy(() => import('./pages/user_pages/DashboardPage'));
const FinesPage = lazy(() => import('./pages/user_pages/FinesPage'));
const MyBooksPage = lazy(() => import('./pages/user_pages/MyBooksPage'));
const NotificationsPage = lazy(() => import('./pages/user_pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/user_pages/ProfilePage'));
const ReservationsPage = lazy(() => import('./pages/user_pages/ReservationsPage'));
const ContactTicketsPage = lazy(() => import('./pages/user_pages/ContactTicketsPage'));
const UserSearchPage = lazy(() => import('./pages/user_pages/SearchPage'));
const SettingsPage = lazy(() => import('./pages/user_pages/SettingsPage'));
const WishlistPage = lazy(() => import('./pages/user_pages/WishlistPage'));

const BookDetails = lazy(() => import('./pages/librarian_pages/BookDetails'));
const BookList = lazy(() => import('./pages/librarian_pages/BookList'));
const Circulation = lazy(() => import('./pages/librarian_pages/Circulation'));
const CopyDetails = lazy(() => import('./pages/librarian_pages/CopyDetails'));
const CopyList = lazy(() => import('./pages/librarian_pages/CopyList'));
const ContactInbox = lazy(() => import('./pages/librarian_pages/ContactInbox'));
const LibrarianDashboard = lazy(() => import('./pages/librarian_pages/Dashboard'));
const LibrarianNotificationsPage = lazy(() => import('./pages/librarian_pages/NotificationsPage'));
const Requests = lazy(() => import('./pages/librarian_pages/Requests'));
const Reports = lazy(() => import('./pages/librarian_pages/Reports'));
const Settings = lazy(() => import('./pages/librarian_pages/Settings'));
const TransactionList = lazy(() => import('./pages/librarian_pages/TransactionList'));
const AdminLibrariansPage = lazy(() => import('./pages/admin_pages/AdminLibrariansPage'));
const AdminUsersPage = lazy(() => import('./pages/admin_pages/AdminUsersPage'));
const AdminPoliciesPage = lazy(() => import('./pages/admin_pages/AdminPoliciesPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/admin_pages/AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin_pages/AdminSettingsPage'));

const ForbiddenPage = lazy(() => import('./pages/error_pages/ForbiddenPage'));
const MaintenancePage = lazy(() => import('./pages/error_pages/MaintenancePage'));
const NotFoundPage = lazy(() => import('./pages/error_pages/NotFoundPage'));

const PUBLIC_PREFIX = '/publicpage';
const USER_PREFIX = '/userpage';
const LIB_PREFIX = '/librarianpage';
const ADMIN_PREFIX = '/adminpage';

const PageFallback = () => (
  <div className="min-h-screen bg-white dark:bg-neutral-950" aria-hidden="true" />
);

const PublicRoutes = () => (
  <Routes>
    <Route path={`${PUBLIC_PREFIX}`} element={<HomePage />} />
    <Route
      path={`${PUBLIC_PREFIX}/search`}
      element={<PublicSearchPage />}
    />
    <Route
      path={`${PUBLIC_PREFIX}/book/:id`}
      element={<BookDetailPage />}
    />
    <Route path={`${PUBLIC_PREFIX}/about`} element={<AboutPage />} />
    <Route path={`${PUBLIC_PREFIX}/guide`} element={<UserGuidePage />} />
    <Route path={`${PUBLIC_PREFIX}/faq`} element={<FAQPage />} />
    <Route path={`${PUBLIC_PREFIX}/contact`} element={<ContactPage />} />
    <Route path={`${PUBLIC_PREFIX}/reviews`} element={<SystemReviewsPage />} />
    <Route path={`${PUBLIC_PREFIX}/terms`} element={<TermsPage />} />
    <Route
      path={`${PUBLIC_PREFIX}/categories`}
      element={<CategoriesPage />}
    />
    <Route
      path={`${PUBLIC_PREFIX}/privacy-policy`}
      element={<PrivacyPolicyPage />}
    />
    <Route
      path={`${PUBLIC_PREFIX}/service-terms`}
      element={<ServiceTermsPage />}
    />
    <Route
      path={`${PUBLIC_PREFIX}/cookie-policy`}
      element={<CookiePolicyPage />}
    />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedUserType: 'student' | 'librarian' | 'admin' | 'both';
}> = ({ children, allowedUserType }) => {
  const { userType } = useAuth();
  const location = useLocation();

  if (!userType) {
    return (
      <Navigate
        to={`${PUBLIC_PREFIX}/login`}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (allowedUserType !== 'both' && userType !== allowedUserType) {
    // Redirect to appropriate dashboard
    if (userType === 'student') {
      return <Navigate to={`${USER_PREFIX}/dashboard`} replace />;
    } else if (userType === 'librarian') {
      return <Navigate to={`${LIB_PREFIX}/dashboard`} replace />;
    } else {
      return <Navigate to={`${ADMIN_PREFIX}/librarians`} replace />;
    }
  }

  return <>{children}</>;
};

// Wrapper to conditionally render Layout
const AppContent = () => {
  // Bắt callback từ Google OAuth2 (Google redirect trực tiếp vào trình duyệt, không có dấu #)
  if (window.location.pathname === '/oauth2/callback') {
    return <OAuth2CallbackPage />;
  }

  const location = useLocation();
  const { userType } = useAuth();

  const legacyRedirects: Record<string, string> = {
    '/': `${PUBLIC_PREFIX}`,
    '/login': `${PUBLIC_PREFIX}/login`,
    '/register': `${PUBLIC_PREFIX}/register`,
    '/dashboard': `${USER_PREFIX}/dashboard`,
    '/search': `${USER_PREFIX}/search`,
    '/my-books': `${USER_PREFIX}/my-books`,
    '/reservations': `${USER_PREFIX}/reservations`,
    '/fines': `${USER_PREFIX}/fines`,
    '/profile': `${USER_PREFIX}/profile`,
    '/settings': `${USER_PREFIX}/settings`,
    '/wishlist': `${USER_PREFIX}/wishlist`,
    '/notifications': `${USER_PREFIX}/notifications`,
    '/librarian/dashboard': `${LIB_PREFIX}/dashboard`,
    '/librarian/circulation': `${LIB_PREFIX}/circulation`,
    '/librarian/books': `${LIB_PREFIX}/books`,
    '/librarian/copies': `${LIB_PREFIX}/copies`,
    '/librarian/requests': `${LIB_PREFIX}/requests`,
    '/librarian/settings': `${LIB_PREFIX}/settings`,
    '/librarian/notifications': `${LIB_PREFIX}/notifications`,
    '/librarian/transactions': `${LIB_PREFIX}/transactions`,
    '/admin': `${ADMIN_PREFIX}/librarians`,
    '/admin/librarians': `${ADMIN_PREFIX}/librarians`,
    '/admin/users': `${ADMIN_PREFIX}/users`,
    '/admin/policies': `${ADMIN_PREFIX}/policies`,
    '/admin/audit-logs': `${ADMIN_PREFIX}/audit-logs`,
    '/admin/settings': `${ADMIN_PREFIX}/settings`,
    '/about': `${PUBLIC_PREFIX}/about`,
    '/guide': `${PUBLIC_PREFIX}/guide`,
    '/faq': `${PUBLIC_PREFIX}/faq`,
    '/contact': `${PUBLIC_PREFIX}/contact`,
    '/terms': `${PUBLIC_PREFIX}/terms`,
    '/categories': `${PUBLIC_PREFIX}/categories`,
    '/privacy-policy': `${PUBLIC_PREFIX}/privacy-policy`,
    '/service-terms': `${PUBLIC_PREFIX}/service-terms`,
    '/cookie-policy': `${PUBLIC_PREFIX}/cookie-policy`,
  };

  if (legacyRedirects[location.pathname]) {
    return <Navigate to={legacyRedirects[location.pathname]} replace state={location.state} />;
  }

  // Handle dynamic nested routes (e.g., /librarian/books/1)
  if (location.pathname.startsWith('/librarian/')) {
    return <Navigate to={location.pathname.replace('/librarian/', `${LIB_PREFIX}/`)} replace state={location.state} />;
  }

  if (location.pathname.startsWith('/admin/')) {
    return <Navigate to={location.pathname.replace('/admin/', `${ADMIN_PREFIX}/`)} replace state={location.state} />;
  }

  const isAuthPage =
    location.pathname === `${PUBLIC_PREFIX}/login` ||
    location.pathname === `${PUBLIC_PREFIX}/register` ||
    location.pathname === `${PUBLIC_PREFIX}/check-email` ||
    location.pathname === `${PUBLIC_PREFIX}/verify-success` ||
    location.pathname === `${PUBLIC_PREFIX}/forgot-password` ||
    location.pathname === `${PUBLIC_PREFIX}/reset-password` ||
    location.pathname === `${PUBLIC_PREFIX}/onboarding`;

  // List of paths that use the user protected layout
  const userProtectedPaths = [
    `${USER_PREFIX}/dashboard`,
    `${USER_PREFIX}/search`,
    `${USER_PREFIX}/book`,
    `${USER_PREFIX}/my-books`,
    `${USER_PREFIX}/reservations`,
    `${USER_PREFIX}/fines`,
    `${USER_PREFIX}/contact-tickets`,
    `${USER_PREFIX}/profile`,
    `${USER_PREFIX}/settings`,
    `${USER_PREFIX}/wishlist`,
    `${USER_PREFIX}/notifications`,
  ];
  const isUserProtectedPage = userProtectedPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // List of paths that use the librarian layout
  const librarianPaths = [
    `${LIB_PREFIX}/dashboard`,
    `${LIB_PREFIX}/circulation`,
    `${LIB_PREFIX}/books`,
    `${LIB_PREFIX}/copies`,
    `${LIB_PREFIX}/contact-inbox`,
    `${LIB_PREFIX}/requests`,
    `${LIB_PREFIX}/reports`,
    `${LIB_PREFIX}/settings`,
    `${LIB_PREFIX}/transactions`,
    `${LIB_PREFIX}/notifications`,
    `${LIB_PREFIX}/public`,
  ];
  const isLibrarianPage = librarianPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  const adminPaths = [
    `${ADMIN_PREFIX}/librarians`,
    `${ADMIN_PREFIX}/users`,
    `${ADMIN_PREFIX}/contact-tickets`,
    `${ADMIN_PREFIX}/policies`,
    `${ADMIN_PREFIX}/audit-logs`,
    `${ADMIN_PREFIX}/settings`,
  ];
  const isAdminPage = adminPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // List of error pages that use the error layout
  const errorPaths = ['/403', '/404', '/500'];
  const isErrorPage = errorPaths.includes(location.pathname);

  // Error pages (403, 404, 500) - separate layout with Header only
  if (isErrorPage) {
    return (
      <ErrorLayout>
        <Routes>
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/500" element={<MaintenancePage />} />
        </Routes>
      </ErrorLayout>
    );
  }

  // Redirect if logged in user tries to access auth pages
  if (isAuthPage && userType && location.pathname !== `${PUBLIC_PREFIX}/onboarding`) {
    if (userType === 'librarian') {
      return <Navigate to={`${LIB_PREFIX}/dashboard`} replace />;
    } else if (userType === 'admin') {
      return <Navigate to={`${ADMIN_PREFIX}/librarians`} replace />;
    } else {
      return <Navigate to={`${USER_PREFIX}/dashboard`} replace />;
    }
  }

  // Auth pages (login, register, onboarding)
  if (isAuthPage) {
    return (
      <Routes>
        <Route path={`${PUBLIC_PREFIX}/login`} element={<LoginPage />} />
        <Route path={`${PUBLIC_PREFIX}/register`} element={<RegisterPage />} />
        <Route path={`${PUBLIC_PREFIX}/check-email`} element={<CheckEmailPage />} />
        <Route path={`${PUBLIC_PREFIX}/verify-success`} element={<VerificationSuccessPage />} />
        <Route path={`${PUBLIC_PREFIX}/forgot-password`} element={<ForgotPasswordPage />} />
        <Route path={`${PUBLIC_PREFIX}/reset-password`} element={<ResetPasswordPage />} />
        <Route path={`${PUBLIC_PREFIX}/onboarding`} element={<OnboardingPage />} />
      </Routes>
    );
  }

  if (userType === 'librarian' && location.pathname.startsWith(PUBLIC_PREFIX)) {
    return <Navigate to={`${LIB_PREFIX}/public${location.pathname.slice(PUBLIC_PREFIX.length)}${location.search}`} replace />;
  }

  if (userType === 'admin' && location.pathname.startsWith(PUBLIC_PREFIX)) {
    return <Navigate to={`${ADMIN_PREFIX}/librarians`} replace />;
  }

  if (userType === 'student' && location.pathname.startsWith(PUBLIC_PREFIX)) {
    if (location.pathname === `${PUBLIC_PREFIX}/contact`) {
      return <Navigate to={`${USER_PREFIX}/contact-tickets`} replace />;
    }
    return (
      <ProtectedLayout>
        <PublicRoutes />
      </ProtectedLayout>
    );
  }

  // User protected pages
  if (isUserProtectedPage) {
    return (
      <ProtectedRoute allowedUserType="student">
        <ProtectedLayout>
          <Routes>
            <Route
              path={`${USER_PREFIX}/dashboard`}
              element={<DashboardPage />}
            />
            <Route
              path={`${USER_PREFIX}/search`}
              element={<UserSearchPage />}
            />
            <Route
              path={`${USER_PREFIX}/book/:id`}
              element={<BookDetailPage />}
            />
            <Route path={`${USER_PREFIX}/my-books`} element={<MyBooksPage />} />
            <Route
              path={`${USER_PREFIX}/reservations`}
              element={<ReservationsPage />}
            />
            <Route path={`${USER_PREFIX}/fines`} element={<FinesPage />} />
            <Route path={`${USER_PREFIX}/contact-tickets`} element={<ContactTicketsPage />} />
            <Route path={`${USER_PREFIX}/profile`} element={<ProfilePage />} />
            <Route
              path={`${USER_PREFIX}/settings`}
              element={<SettingsPage />}
            />
            <Route
              path={`${USER_PREFIX}/wishlist`}
              element={<WishlistPage />}
            />
            <Route
              path={`${USER_PREFIX}/notifications`}
              element={<NotificationsPage />}
            />
          </Routes>
        </ProtectedLayout>
      </ProtectedRoute>
    );
  }

  // Librarian pages
  if (isLibrarianPage) {
    return (
      <ProtectedRoute allowedUserType="librarian">
        <LibrarianLayout>
          <Routes>
            <Route
              path={`${LIB_PREFIX}/dashboard`}
              element={<LibrarianDashboard />}
            />
            <Route
              path={`${LIB_PREFIX}/circulation`}
              element={<Circulation />}
            />
            <Route path={`${LIB_PREFIX}/books`} element={<BookList />} />
            <Route path={`${LIB_PREFIX}/books/:id`} element={<BookDetails />} />
            <Route path={`${LIB_PREFIX}/copies`} element={<CopyList />} />
            <Route
              path={`${LIB_PREFIX}/copies/:id`}
              element={<CopyDetails />}
            />
            <Route path={`${LIB_PREFIX}/contact-inbox`} element={<ContactInbox />} />
            <Route path={`${LIB_PREFIX}/notifications`} element={<LibrarianNotificationsPage />} />
            <Route path={`${LIB_PREFIX}/requests`} element={<Requests />} />
            <Route path={`${LIB_PREFIX}/reports`} element={<Reports />} />
            <Route path={`${LIB_PREFIX}/settings`} element={<Settings />} />
            <Route path={`${LIB_PREFIX}/public`} element={<HomePage />} />
            <Route path={`${LIB_PREFIX}/public/search`} element={<PublicSearchPage />} />
            <Route path={`${LIB_PREFIX}/public/book/:id`} element={<BookDetailPage />} />
            <Route path={`${LIB_PREFIX}/public/about`} element={<AboutPage />} />
            <Route path={`${LIB_PREFIX}/public/guide`} element={<UserGuidePage />} />
            <Route path={`${LIB_PREFIX}/public/faq`} element={<FAQPage />} />
            <Route path={`${LIB_PREFIX}/public/contact`} element={<ContactPage />} />
            <Route path={`${LIB_PREFIX}/public/reviews`} element={<SystemReviewsPage />} />
            <Route path={`${LIB_PREFIX}/public/terms`} element={<TermsPage />} />
            <Route path={`${LIB_PREFIX}/public/categories`} element={<CategoriesPage />} />
            <Route path={`${LIB_PREFIX}/public/privacy-policy`} element={<PrivacyPolicyPage />} />
            <Route path={`${LIB_PREFIX}/public/service-terms`} element={<ServiceTermsPage />} />
            <Route path={`${LIB_PREFIX}/public/cookie-policy`} element={<CookiePolicyPage />} />
            <Route
              path={`${LIB_PREFIX}/transactions`}
              element={<TransactionList />}
            />
          </Routes>
        </LibrarianLayout>
      </ProtectedRoute>
    );
  }

  if (isAdminPage) {
    return (
      <ProtectedRoute allowedUserType="admin">
        <AdminLayout>
          <Routes>
            <Route path={`${ADMIN_PREFIX}/librarians`} element={<AdminLibrariansPage />} />
            <Route path={`${ADMIN_PREFIX}/users`} element={<AdminUsersPage />} />
            <Route path={`${ADMIN_PREFIX}/contact-tickets`} element={<ContactInbox readOnly />} />
            <Route path={`${ADMIN_PREFIX}/policies`} element={<AdminPoliciesPage />} />
            <Route path={`${ADMIN_PREFIX}/audit-logs`} element={<AdminAuditLogsPage />} />
            <Route path={`${ADMIN_PREFIX}/settings`} element={<AdminSettingsPage />} />
          </Routes>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  // Public pages
  return (
    <Layout>
      <PublicRoutes />
    </Layout>
  );
};

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <UploadProvider>
              <AppDialogProvider>
                <Router>
                  <ScrollToTop />
                  <RouteSeo />
                  <Suspense fallback={<PageFallback />}>
                    <AppContent />
                  </Suspense>
                  <CookieConsentBanner />
                </Router>
                <Toaster
                  position="bottom-right"
                  richColors
                  closeButton
                  duration={5000}
                  toastOptions={{
                    classNames: {
                      toast: 'rounded-xl border-slate-200 shadow-xl',
                      title: 'font-semibold',
                      description: 'text-sm',
                    },
                  }}
                />
                <UploadPanel />
              </AppDialogProvider>
            </UploadProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
