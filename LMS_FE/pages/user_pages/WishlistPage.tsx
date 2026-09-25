import { Bell, BookOpen, CheckCircle2, Heart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import wishlistService, { WishlistItem } from '../../api/wishlistService';
import { Button } from '../../components/ui';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);

const WishlistPage = () => {
  const { language, t } = useTranslation();
  const dialog = useAppDialog();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    wishlistService.getMyWishlist()
      .then(res => setItems(res.data ?? []))
      .catch(() => toast.error(t('wishlist.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleRemove = async (publicationId: string) => {
    try {
      await wishlistService.removeFromWishlist(publicationId);
      setItems(prev => prev.filter(i => i.publicationId !== publicationId));
      toast.success(t('wishlist.removed'));
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, language));
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0 || clearing) return;
    const confirmed = await dialog.confirm({
      title: t('wishlist.clearAllTitle', 'Xóa tất cả wishlist'),
      message: fill(t('wishlist.clearAllConfirm', 'Bạn chắc chắn muốn xóa toàn bộ {count} sách khỏi wishlist? Hành động này không thể hoàn tác.'), { count: items.length }),
      confirmText: t('wishlist.clearAll', 'Xóa tất cả'),
      cancelText: t('common.cancel', 'Hủy'),
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setClearing(true);
      await wishlistService.clearWishlist();
      setItems([]);
      toast.success(t('wishlist.clearAllSuccess', 'Đã xóa toàn bộ wishlist.'));
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, language));
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="text-red-500 fill-red-500" /> {t('wishlist.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length > 0 ? fill(t('wishlist.savedCount'), { count: items.length }) : t('wishlist.noBooks')}
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={clearing}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={16} className="mr-2" />
            {clearing ? t('common.loading', 'Đang tải...') : t('wishlist.clearAll', 'Xóa tất cả')}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">{t('wishlist.emptyTitle')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('wishlist.emptyDesc')}</p>
          <Link to="/userpage/dashboard">
            <Button className="mt-4" size="sm">{t('wishlist.explore')}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => {
            const availableItems = Number(item.availableItems ?? 0);
            const outOfStock = availableItems <= 0;
            return (
              <div
                key={item.publicationId}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/userpage/book/${item.publicationId}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/userpage/book/${item.publicationId}`);
                  }
                }}
                className="flex cursor-pointer gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="w-20 h-28 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={24} className="text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                      {item.authorNames && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{item.authorNames}</p>
                      )}
                      {item.publicationYear && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.publicationYear}</p>
                      )}
                      <div className="mt-2">
                        {outOfStock ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Bell size={13} className="mr-1.5" />
                            {language === 'en' ? 'Out of stock - watching' : 'Hết bản - đang theo dõi'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={13} className="mr-1.5" />
                            {language === 'en' ? `${availableItems} available` : `Còn ${availableItems} bản`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemove(item.publicationId);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0 transition-colors"
                      title={t('wishlist.removeTitle')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-3">
                    <Button size="sm" variant="outline" className="text-xs">
                      {t('common.viewDetails')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
