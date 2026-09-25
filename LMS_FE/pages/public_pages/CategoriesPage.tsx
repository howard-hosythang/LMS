import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Grid, List, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import categoriesService from '../../api/categoriesService';
import { Category } from '../../api/publicationTypes';
import { useTranslation } from '../../contexts/LanguageContext';

const colorClasses = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-rose-100 text-rose-700 border-rose-200',
];

const getCategoryName = (category: Category) =>
  category.name || category.categoryName || 'Danh mục chưa đặt tên';

const formatBookCount = (count?: number) => (count ?? 0).toLocaleString('vi-VN');

const CategoriesPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/librarianpage/public')
    ? '/librarianpage/public'
    : location.pathname.startsWith('/userpage')
      ? '/userpage'
      : '/publicpage';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    categoriesService.getAllCategories()
      .then((res) => {
        if (res.code === 200) setCategories(res.data ?? []);
      })
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter((category) =>
      getCategoryName(category).toLowerCase().includes(keyword)
    );
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('categories.title')}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            {t('categories.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('categories.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                aria-label="Grid view"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                aria-label="List view"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-44 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600 text-lg">{t('categories.noMatch')}</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredCategories.map((category, index) => {
              const name = getCategoryName(category);
              const colorClass = colorClasses[index % colorClasses.length];
              return (
                <Link
                  key={category.id}
                  to={`${prefix}/search?categoryIds=${category.id}`}
                  className={`block bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all ${viewMode === 'list' ? 'p-6 flex items-center gap-6' : 'p-6'}`}
                >
                  <div className={`${viewMode === 'list' ? 'w-16 h-16' : 'w-14 h-14 mb-4'} ${colorClass} rounded-xl flex items-center justify-center border-2 flex-shrink-0`}>
                    <BookOpen size={viewMode === 'list' ? 28 : 24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
                    {category.parentCategoryName && (
                      <p className="text-sm text-gray-500 mb-2">
                        {t('categories.parent')} {category.parentCategoryName}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {category.bio || t('categories.defaultDescription')}
                    </p>
                    <div className="mt-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {formatBookCount(category.publicationCount)} {t('common.books')}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">{categories.length}</div>
              <div className="text-blue-100">{t('categories.realCategories')}</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {categories.reduce((sum, category) => sum + (category.publicationCount ?? 0), 0).toLocaleString('vi-VN')}
              </div>
              <div className="text-blue-100">{t('categories.bookClassifications')}</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">{t('categories.onlineLookup')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
