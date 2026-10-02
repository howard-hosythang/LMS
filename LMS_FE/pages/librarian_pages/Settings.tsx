import {
  BookOpen,
  Banknote,
  Building,
  Clock,
  CreditCard,
  Languages,
  Laptop,
  Mail,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CirculationPolicy } from '../../api/adminService';
import circulationPolicyService from '../../api/circulationPolicyService';
import OperationalAccountSettings from '../../components/account/OperationalAccountSettings';
import { Language, useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const buildPolicyItems = (policy: CirculationPolicy | null) => [
  {
    icon: Clock,
    title: {
      vi: 'Thời hạn nhận sách sau khi đặt mượn',
      en: 'Reservation pickup window',
    },
    value: {
      vi: `${policy?.pickupDeadlineHours ?? '-'} giờ`,
      en: `${policy?.pickupDeadlineHours ?? '-'} hours`,
    },
    description: {
      vi: 'Sau thời gian này, giao dịch chờ lấy sách có thể bị hủy bởi scheduler.',
      en: 'After this window, waiting-for-pickup transactions may be cancelled by the scheduler.',
    },
  },
  {
    icon: BookOpen,
    title: { vi: 'Thời hạn mượn mặc định', en: 'Default loan period' },
    value: {
      vi: `${policy?.defaultLoanDays ?? '-'} ngày`,
      en: `${policy?.defaultLoanDays ?? '-'} days`,
    },
    description: {
      vi: 'Áp dụng cho cả mượn trực tiếp tại quầy và xác nhận lấy sách đã đặt.',
      en: 'Applies to direct counter loans and confirmed reservation pickups.',
    },
  },
  {
    icon: Users,
    title: {
      vi: 'Số sách đang mượn/chờ lấy tối đa',
      en: 'Maximum active books',
    },
    value: {
      vi: `${policy?.maxActiveBorrows ?? '-'} quyển`,
      en: `${policy?.maxActiveBorrows ?? '-'} books`,
    },
    description: {
      vi: 'Tính trên các giao dịch WAITING_FOR_PICKUP và BORROWING.',
      en: 'Counts WAITING_FOR_PICKUP and BORROWING transactions.',
    },
  },
  {
    icon: Clock,
    title: { vi: 'Số lượt đặt trước tối đa', en: 'Maximum reservations' },
    value: {
      vi: `${policy?.maxActiveReservations ?? '-'} yêu cầu`,
      en: `${policy?.maxActiveReservations ?? '-'} requests`,
    },
    description: {
      vi: 'Tính trên các đặt trước PENDING và READY_FOR_PICKUP của từng độc giả.',
      en: "Counts each reader's PENDING and READY_FOR_PICKUP reservations.",
    },
  },
  {
    icon: RefreshCw,
    title: {
      vi: 'Số lượt gia hạn tối đa mỗi lần mượn',
      en: 'Maximum renewals per loan',
    },
    value: {
      vi: `${policy?.maxRenewals ?? '-'} lần`,
      en: `${policy?.maxRenewals ?? '-'} times`,
    },
    description: {
      vi: 'Số lần tối đa một giao dịch mượn được phép gia hạn thêm thời gian.',
      en: 'Maximum number of times a borrowing transaction can be renewed.',
    },
  },
  {
    icon: Clock,
    title: {
      vi: 'Cho phép gia hạn trước hạn trả',
      en: 'Renewal window before due date',
    },
    value: {
      vi: `${policy?.renewalWindowDays ?? '-'} ngày`,
      en: `${policy?.renewalWindowDays ?? '-'} days`,
    },
    description: {
      vi: 'Chỉ cho phép độc giả và thủ thư gia hạn khi hạn trả còn lại ít hơn hoặc bằng số ngày này.',
      en: 'Renewals are only allowed when the remaining loan time is within this number of days.',
    },
  },
  {
    icon: CreditCard,
    title: { vi: 'Phí trễ hạn', en: 'Overdue fine' },
    value: {
      vi: `${Number(policy?.overdueFinePerDay ?? 0).toLocaleString('vi-VN')}đ/ngày`,
      en: `${Number(policy?.overdueFinePerDay ?? 0).toLocaleString('vi-VN')}đ/day`,
    },
    description: {
      vi: 'Tự động tạo khi trả sách quá hạn hoặc khi thủ thư ghi nhận mất/hỏng có quá hạn.',
      en: 'Created automatically for overdue returns or overdue lost/damaged reports.',
    },
  },
  {
    icon: Banknote,
    title: { vi: 'Tiền cọc khi mượn', en: 'Borrow deposit' },
    value: {
      vi: `${Number(policy?.defaultDepositAmount ?? 0).toLocaleString('vi-VN')}đ/cuốn`,
      en: `${Number(policy?.defaultDepositAmount ?? 0).toLocaleString('vi-VN')}đ/book`,
    },
    description: {
      vi: 'Thủ thư thu khi giao sách. Khi trả, hệ thống tự cấn vào phạt rồi ghi số hoàn lại hoặc thu thêm.',
      en: 'Collected at pickup. On return, the system offsets fines and records refund or extra amount due.',
    },
  },
  {
    icon: Shield,
    title: {
      vi: 'Điều kiện chặn mượn/đặt trước',
      en: 'Borrowing/reservation block',
    },
    value: {
      vi:
        policy?.blockBorrowWhenUnpaidFines === false
          ? 'Tắt kiểm soát'
          : 'Có phí chưa thanh toán',
      en:
        policy?.blockBorrowWhenUnpaidFines === false
          ? 'Disabled'
          : 'Unpaid fines',
    },
    description: {
      vi: 'Người dùng còn phí UNPAID sẽ không được tạo giao dịch mượn hoặc đặt trước mới.',
      en: 'Users with UNPAID fines cannot create new loan or reservation transactions.',
    },
  },
];

const notificationItems = {
  vi: [
    'Thông báo trong ứng dụng qua WebSocket/STOMP.',
    'Email nghiệp vụ được gửi qua Kafka topic LIBRARY_EMAIL.',
    'Nhắc nhận sách, sách sẵn sàng, quá hạn, phí phạt và xác nhận thanh toán.',
    'Các thông báo nghiệp vụ bắt buộc luôn được gửi để đảm bảo an toàn vận hành.',
  ],
  en: [
    'In-app notifications are delivered through WebSocket/STOMP.',
    'Operational emails are sent through the LIBRARY_EMAIL Kafka topic.',
    'Pickup reminders, ready notices, overdue notices, fines, and payment confirmations are active.',
    'Mandatory operational notifications are always sent to keep library workflows reliable.',
  ],
};

const copy = {
  vi: {
    title: 'Cấu hình vận hành',
    subtitle: 'Tùy chỉnh giao diện thủ thư và xem các quy tắc của thư viện.',
    interfaceTitle: 'Giao diện',
    interfaceDesc: 'Áp dụng cho toàn bộ giao diện sau khi đăng nhập.',
    rulesTitle: 'Quy định mượn trả',
    rulesDesc: 'Được cấu hình bởi Admin hệ thống qua Circulation Module.',
    systemInfo: 'Thông tin hệ thống',
    systemName: 'Tên hệ thống',
    deploymentUnit: 'Đơn vị triển khai',
    address: 'Địa chỉ',
    contact: 'Liên hệ',
    notifications: 'Thông báo & Email',
    notificationsDesc: 'Các luồng gửi thông báo đang hoạt động trong hệ thống.',
    dataDeploy: 'Dữ liệu & triển khai',
    dataDeployDesc:
      'Thông tin để thủ thư hiểu phạm vi vận hành, không phải form cấu hình.',
    managedByFlyway: 'Schema được quản lý bằng Flyway migration.',
    aiServiceDesc: 'Xử lý vector hóa, summary, tag và semantic search.',
  },
  en: {
    title: 'Operational Settings',
    subtitle:
      'Customize the librarian interface and review backend-enforced rules.',
    interfaceTitle: 'Interface',
    interfaceDesc: 'Applies across the authenticated application.',
    rulesTitle: 'Circulation Rules',
    rulesDesc: 'Configured by the system Admin through the Circulation Module.',
    systemInfo: 'System Information',
    systemName: 'System name',
    deploymentUnit: 'Deployment unit',
    address: 'Address',
    contact: 'Contact',
    notifications: 'Notifications & Email',
    notificationsDesc: 'Notification flows currently active in the system.',
    dataDeploy: 'Data & Deployment',
    dataDeployDesc:
      'Operational scope information for librarians, not an editable configuration form.',
    managedByFlyway: 'Schema is managed by Flyway migrations.',
    aiServiceDesc:
      'Handles vectorization, summaries, tags, and semantic search.',
  },
};

const Settings = () => {
  const { language, setLanguage, t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const [policy, setPolicy] = useState<CirculationPolicy | null>(null);
  const c = copy[language];
  const policyItems = useMemo(() => buildPolicyItems(policy), [policy]);

  useEffect(() => {
    circulationPolicyService
      .getPolicy()
      .then((response) => setPolicy(response.data))
      .catch(() =>
        toast.error(
          language === 'vi'
            ? 'Không tải được quy định mượn trả'
            : 'Failed to load circulation rules'
        )
      );
  }, [language]);

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: t('settings.light') },
    { value: 'dark' as const, icon: Moon, label: t('settings.dark') },
    { value: 'system' as const, icon: Laptop, label: t('settings.system') },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">{c.title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{c.subtitle}</p>
      </div>

      <OperationalAccountSettings
        title={language === 'vi' ? 'Tài khoản thủ thư' : 'Librarian account'}
      />

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
          <Sun className="text-blue-600 dark:text-blue-400" size={20} />
          <div>
            <h2 className="font-semibold">{c.interfaceTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {c.interfaceDesc}
            </p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-end">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              {t('settings.theme')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setThemeMode(option.value)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
                    themeMode === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <option.icon size={16} /> {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              <Languages size={16} /> {t('common.language')}
            </label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 text-sm bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="vi">{t('common.vietnamese')}</option>
              <option value="en">{t('common.english')}</option>
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
            <Shield className="text-blue-600 dark:text-blue-400" size={20} />
            <div>
              <h2 className="font-semibold">{c.rulesTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {c.rulesDesc}
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {policyItems.map((item) => (
              <div
                key={item.title.vi}
                className="p-5 flex items-start justify-between gap-5"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                    <item.icon size={19} />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title[language]}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {item.description[language]}
                    </p>
                  </div>
                </div>
                <div className="text-right font-semibold whitespace-nowrap">
                  {item.value[language]}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
              <Building
                className="text-blue-600 dark:text-blue-400"
                size={20}
              />
              <h2 className="font-semibold">{c.systemInfo}</h2>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  {c.systemName}
                </div>
                <div className="font-semibold">Library74</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  NEXT-GEN DISCOVERY
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  {c.deploymentUnit}
                </div>
                <div className="font-medium">
                  Trường Đại học Bách khoa - ĐHQG TP.HCM
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  {c.address}
                </div>
                <div className="font-medium">
                  268 Lý Thường Kiệt, Phường 14, Quận 10, TPHCM
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
              <Mail className="text-blue-600 dark:text-blue-400" size={20} />
              <h2 className="font-semibold">{c.contact}</h2>
            </div>
            <div className="p-5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div>support@library74.uk</div>
              <div>+84 88 676 5392</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Settings;
