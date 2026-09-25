import { Bell, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { BrandLogo } from '../BrandLogo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeModeToggle } from '../ThemeModeToggle';
import { Button } from '../ui';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userType } = useAuth();
  const { t } = useTranslation();
  const isAuthenticated = !!userType;
  const logoTarget =
    userType === 'student' ? '/userpage/dashboard' : '/publicpage';

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-blue-600 font-semibold'
      : 'text-gray-600 hover:text-blue-600';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={logoTarget} className="flex items-center">
              <BrandLogo size="md" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/publicpage" className={isActive('/publicpage')}>
              {t('nav.home')}
            </Link>
            <Link
              to="/publicpage/search"
              className={isActive('/publicpage/search')}
            >
              {t('nav.search')}
            </Link>
            <Link
              to="/publicpage/about"
              className={isActive('/publicpage/about')}
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/publicpage/categories"
              className={isActive('/publicpage/categories')}
            >
              {t('nav.categories')}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeModeToggle compact />
            <LanguageSwitcher compact />
            {isAuthenticated && (
              <button
                onClick={() => navigate('/userpage/notifications')}
                className="p-2 text-gray-500 hover:text-gray-600 relative"
              >
                <Bell size={20} />
              </button>
            )}
            <div className="h-6 w-px bg-gray-300"></div>
            {isAuthenticated ? (
              <Link
                to={
                  userType === 'librarian'
                    ? '/librarianpage/dashboard'
                    : '/userpage/dashboard'
                }
              >
                <Button size="sm">{t('nav.enterDashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link to="/publicpage/login">
                  <Button variant="ghost" size="sm">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/publicpage/register">
                  <Button size="sm">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/publicpage"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/publicpage/search"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
            >
              {t('nav.search')}
            </Link>
            <Link
              to="/publicpage/categories"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
            >
              {t('nav.categories')}
            </Link>
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
            {isAuthenticated ? (
              <Link
                to={
                  userType === 'librarian'
                    ? '/librarianpage/dashboard'
                    : '/userpage/dashboard'
                }
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
              >
                {t('nav.enterDashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/publicpage/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/publicpage/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer = () => {
  const { language, t } = useTranslation();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/librarianpage/public')
    ? '/librarianpage/public'
    : location.pathname.startsWith('/userpage')
      ? '/userpage'
      : '/publicpage';

  return (
    <footer className="bg-white text-gray-900 pt-12 pb-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <BrandLogo size="sm" className="mb-4" />
            <p className="text-gray-500 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.facebook.com/howard.hosythang"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-blue-600 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="tel:+84886765392"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-green-600 hover:text-white transition-colors"
                aria-label="Call"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900">
              {t('footer.discover')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to={prefix} className="hover:text-blue-400">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to={`${prefix}/search`} className="hover:text-blue-400">
                  {t('nav.search')}
                </Link>
              </li>
              <li>
                <Link
                  to={`${prefix}/categories`}
                  className="hover:text-blue-400"
                >
                  {t('nav.categories')}
                </Link>
              </li>
              <li>
                <Link
                  to={`${prefix}/search?sort=newest`}
                  className="hover:text-blue-400"
                >
                  {t('footer.newBooks')}
                </Link>
              </li>
              <li>
                <Link
                  to={`${prefix}/search?sort=most_borrowed`}
                  className="hover:text-blue-400"
                >
                  {language === 'en' ? 'Most borrowed' : 'Mượn nhiều nhất'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900">
              {t('footer.support')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to={`${prefix}/about`} className="hover:text-blue-400">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to={`${prefix}/guide`} className="hover:text-blue-400">
                  {t('footer.guide')}
                </Link>
              </li>
              <li>
                <Link to={`${prefix}/faq`} className="hover:text-blue-400">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to={`${prefix}/contact`} className="hover:text-blue-400">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link to={`${prefix}/terms`} className="hover:text-blue-400">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex items-start">
                <MapPin size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  {t('footer.address')
                    .split('\n')
                    .map((line, index) => (
                      <React.Fragment key={line}>
                        {index > 0 && <br />}
                        {line}
                      </React.Fragment>
                    ))}
                </span>
              </li>
              <li className="flex items-center">
                <Mail size={16} className="mr-2 flex-shrink-0" />
                <a
                  href="mailto:support@library74.uk"
                  className="hover:text-blue-400"
                >
                  support@library74.uk
                </a>
              </li>
              <li className="flex items-center">
                <Phone size={16} className="mr-2 flex-shrink-0" />
                <a href="tel:+84886765392" className="hover:text-blue-400">
                  +84 88 676 5392
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2025 Library74. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              to={`${prefix}/privacy-policy`}
              className="hover:text-blue-600"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              to={`${prefix}/service-terms`}
              className="hover:text-blue-600"
            >
              {t('footer.serviceTerms')}
            </Link>
            <Link
              to={`${prefix}/cookie-policy`}
              className="hover:text-blue-600"
            >
              {t('footer.cookie')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const routeScrollKey = `${location.pathname}${location.search}`;
  const contentRef = React.useRef<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    element.scrollTop = 0;
    element.scrollLeft = 0;
    element.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [routeScrollKey]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main
        key={routeScrollKey}
        ref={contentRef}
        className="flex-grow"
        data-public-content
        data-route-scroll-container
      >
        {children}
      </main>
      <Footer />
    </div>
  );
};
