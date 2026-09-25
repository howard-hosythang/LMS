import { AlertCircle, AlertTriangle, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import fineService, { Fine, FineStatus } from '../../api/fineService';
import { useTranslation } from '../../contexts/LanguageContext';

const TYPE_LABEL: Record<string, { labelKey: string; fallback: string; color: string }> = {
  OVERDUE_RETURN: { labelKey: 'fines.type.overdue', fallback: 'Quá hạn', color: 'bg-orange-100 text-orange-700' },
  DAMAGED_BOOK:  { labelKey: 'fines.type.damaged', fallback: 'Hư hỏng', color: 'bg-red-100 text-red-700' },
  LOST_BOOK:     { labelKey: 'fines.type.lost', fallback: 'Mất sách', color: 'bg-red-100 text-red-700' },
};

const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const FineItem = ({ fine }: { fine: Fine }) => {
  const { t } = useTranslation();
  const typeCfg = TYPE_LABEL[fine.type] ?? { labelKey: fine.type, fallback: fine.type, color: 'bg-gray-100 text-gray-600' };
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      <div className={`p-2.5 rounded-full flex-shrink-0 ${fine.status === 'UNPAID' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
        {fine.status === 'UNPAID' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{fine.publicationTitle}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeCfg.color}`}>{t(typeCfg.labelKey, typeCfg.fallback)}</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {formatDate(fine.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="font-bold text-gray-900">{formatVND(fine.fineAmount)}</span>
        {fine.status === 'UNPAID' ? (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">{t('fines.unpaid')}</span>
        ) : (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            {t('fines.paid')} {fine.paidDate ? `• ${formatDate(fine.paidDate)}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};

const FinesPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FineStatus>('UNPAID');
  const [fines, setFines] = useState<Fine[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Tổng nợ UNPAID (load riêng 1 lần)
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const [u, p] = await Promise.all([
          fineService.getMyFines('UNPAID', 0, 100),
          fineService.getMyFines('PAID', 0, 100),
        ]);
        if (u.code === 200) setUnpaidTotal(u.data.content.reduce((s, f) => s + f.fineAmount, 0));
        if (p.code === 200) setPaidTotal(p.data.content.reduce((s, f) => s + f.fineAmount, 0));
      } catch (e) { console.error(e); }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await fineService.getMyFines(activeTab, page, 10);
        if (res.code === 200) {
          setFines(res.data.content);
          setTotalPages(res.data.totalPages);
          setTotalElements(res.data.totalElements);
        }
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [activeTab, page]);

  const switchTab = (tab: FineStatus) => { setActiveTab(tab); setPage(0); };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('fines.title')}</h1>
        <p className="text-gray-500 text-sm">{t('fines.subtitle')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border-l-4 border-red-500 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">{t('fines.unpaid')}</p>
          <h3 className="text-3xl font-bold text-red-600">{formatVND(unpaidTotal)}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">{t('fines.paid')}</p>
          <h3 className="text-3xl font-bold text-green-600">{formatVND(paidTotal)}</h3>
        </div>
        <div className="bg-blue-600 p-5 rounded-xl text-white shadow-lg">
          <p className="text-blue-100 text-sm mb-1">{t('fines.total')}</p>
          <h3 className="text-3xl font-bold">{formatVND(unpaidTotal + paidTotal)}</h3>
        </div>
      </div>

      {/* Tab + list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab header */}
        <div className="flex border-b border-gray-200">
          {(['UNPAID', 'PAID'] as FineStatus[]).map(tab => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? tab === 'UNPAID' ? 'border-b-2 border-red-500 text-red-600' : 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'UNPAID' ? t('fines.unpaid') : t('fines.paid')}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="py-12 text-center text-gray-400">{t('common.loading')}</div>
        ) : fines.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-gray-400">
            <CheckCircle size={32} className="mb-2 text-green-400" />
            <p className="text-sm">{activeTab === 'UNPAID' ? t('fines.noUnpaid') : t('fines.noPaid')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {fines.map(f => <FineItem key={f.fineId} fine={f} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              {t('common.showing')} <span className="font-semibold text-gray-800">{page * 10 + 1}–{Math.min((page + 1) * 10, totalElements)}</span>{' '}
              {t('common.in')} <span className="font-semibold text-gray-800">{totalElements}</span> {t('fines.items')}
            </p>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:text-gray-300 border-r border-gray-200">
                ‹ {t('common.previous')}
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`px-3.5 py-1.5 text-sm font-medium border-r border-gray-200 last:border-0 ${
                    page === i ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:text-gray-300">
                {t('common.next')} ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hướng dẫn */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center">
          <AlertCircle size={18} className="mr-2" /> {t('fines.paymentGuide')}
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong>{t('fines.payDirect')}:</strong> {t('fines.payDirectDesc')}</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong>{t('fines.note')}:</strong> {t('fines.noteDesc')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FinesPage;
