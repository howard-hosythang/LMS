import { Bell, ChevronDown } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../BrandLogo';
import { useTranslation } from '../../contexts/LanguageContext';

const Header: React.FC = () => {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link
            to="/publicpage"
            className="flex items-center gap-3 cursor-pointer"
          >
            <BrandLogo size="md" />
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/publicpage"
              className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/publicpage/search"
              className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
            >
              {t('nav.search')}
            </Link>
            <Link
              to="/publicpage/about"
              className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/publicpage/categories"
              className="relative group cursor-pointer flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
            >
              <span>{t('nav.categories')}</span>
              <ChevronDown className="w-4 h-4" />
            </Link>
            <Link
              to="/publicpage/contact"
              className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
            >
              {t('nav.contact')}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            <Link
              to="/publicpage/login"
              className="hidden sm:block text-sm font-medium text-gray-700 hover:text-gray-900 px-2"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/publicpage/register"
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors shadow-sm shadow-primary-500/30"
            >
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
