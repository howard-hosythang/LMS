import { BookOpen, Clock, CreditCard, Save, Shield, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import adminService, { CirculationPolicy } from '../../api/adminService';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminPoliciesPage = () => {
  const dialog = useAppDialog();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [policy, setPolicy] = useState<CirculationPolicy | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getPolicy()
      .then((response) => setPolicy(response.data))
      .catch(() => toast.error(isEn ? 'Could not load circulation policies' : 'Không tải được quy định mượn trả'));
  }, [isEn]);

  const update = (key: keyof CirculationPolicy, value: number | boolean) => {
    if (!policy) return;
    setPolicy({ ...policy, [key]: value });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!policy) return;
    const confirmed = await dialog.confirm({
      title: isEn ? 'Confirm policy changes' : 'Xác nhận thay đổi quy định',
      message: isEn ? 'Save the new circulation policies? This affects borrowing, reservations, and fine calculation immediately.' : 'Bạn có chắc chắn lưu quy định mượn trả mới? Thay đổi này sẽ ảnh hưởng trực tiếp đến mượn sách, đặt trước và tính phí phạt.',
      confirmText: isEn ? 'Save policies' : 'Lưu quy định',
      variant: 'warning',
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const response = await adminService.updatePolicy(policy);
      setPolicy(response.data);
      toast.success(isEn ? 'Policies updated and applied immediately' : 'Quy định đã được cập nhật và backend sẽ áp dụng ngay');
    } catch {
      toast.error(isEn ? 'Could not save policies' : 'Lưu quy định thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!policy) {
    return <div className="p-8 text-slate-500 dark:text-slate-400">{isEn ? 'Loading policies...' : 'Đang tải quy định...'}</div>;
  }

  const fields = [
    { key: 'pickupDeadlineHours' as const, icon: Clock, label: isEn ? 'Pickup deadline after reservation' : 'Thời hạn nhận sách sau khi đặt mượn', suffix: isEn ? 'hours' : 'giờ', min: 1, max: 168 },
    { key: 'defaultLoanDays' as const, icon: BookOpen, label: isEn ? 'Default loan duration' : 'Thời hạn mượn mặc định', suffix: isEn ? 'days' : 'ngày', min: 1, max: 365 },
    { key: 'maxActiveBorrows' as const, icon: Users, label: isEn ? 'Maximum active borrows / pickups' : 'Số sách đang mượn/chờ lấy tối đa', suffix: isEn ? 'books' : 'quyển', min: 1, max: 50 },
    { key: 'maxActiveReservations' as const, icon: Clock, label: isEn ? 'Maximum active reservations' : 'Số lượt đặt trước tối đa', suffix: isEn ? 'requests' : 'yêu cầu', min: 0, max: 50 },
    { key: 'maxRenewals' as const, icon: BookOpen, label: isEn ? 'Maximum renewals per loan' : 'Số lượt gia hạn tối đa mỗi lần mượn', suffix: isEn ? 'times' : 'lần', min: 0, max: 20 },
    { key: 'renewalWindowDays' as const, icon: Clock, label: isEn ? 'Renewal window before due date' : 'Cửa sổ gia hạn trước hạn trả', suffix: isEn ? 'days' : 'ngày', min: 1, max: 30 },
    { key: 'overdueFinePerDay' as const, icon: CreditCard, label: isEn ? 'Overdue fine' : 'Phí trễ hạn', suffix: isEn ? 'VND/day' : 'VNĐ/ngày', min: 0, max: 1000000 },
    { key: 'defaultDepositAmount' as const, icon: CreditCard, label: isEn ? 'Default borrowing deposit' : 'Tiền cọc khi mượn sách', suffix: isEn ? 'VND/book' : 'VNĐ/cuốn', min: 0, max: 10000000 },
  ];

  return (
    <form onSubmit={submit} className="w-full space-y-6 p-4 lg:p-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold uppercase text-blue-600">
          <Shield size={18} />
          {isEn ? 'Policies' : 'Quy định'}
        </div>
        <h1 className="mt-2 text-3xl font-bold">{isEn ? 'CIRCULATION POLICIES' : 'QUY ĐỊNH MƯỢN TRẢ'}</h1>
        <p className="mt-1 max-w-4xl text-slate-500 dark:text-slate-400">
          {isEn ? 'Manage borrowing, reservation, and fine policies. Changes are applied immediately across circulation workflows.' : 'Admin có thể thay đổi quy định mượn trả tại đây. Các quy định này sẽ được áp dụng ngay lập tức cho tất cả các giao dịch mượn sách, đặt trước và tính phí phạt.'}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 lg:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center dark:border-slate-800 dark:bg-slate-950">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                  <field.icon size={19} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold">{field.label}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{isEn ? 'Checked before circulation transactions are created.' : 'Được kiểm tra trực tiếp trước khi tạo giao dịch nghiệp vụ.'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={policy[field.key] as number}
                  onChange={(event) => update(field.key, Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="w-24 text-sm font-semibold text-slate-500 dark:text-slate-400">{field.suffix}</span>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center dark:border-slate-800 dark:bg-slate-950">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                <Shield size={19} />
              </div>
              <div>
                <h3 className="font-bold">{isEn ? 'Block borrowing/reservation with unpaid fines' : 'Chặn mượn/đặt trước khi còn phí chưa thanh toán'}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isEn ? 'Applies to online borrowing, desk borrowing, and reservations.' : 'Áp dụng cho mượn online, mượn tại quầy và tạo reservation.'}</p>
              </div>
            </div>
            <label className="flex items-center justify-end gap-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={policy.blockBorrowWhenUnpaidFines}
                onChange={(event) => update('blockBorrowWhenUnpaidFines', event.target.checked)}
                className="h-5 w-5 rounded border-slate-300"
              />
              {isEn ? 'Enable control' : 'Bật kiểm soát'}
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {isEn ? 'Last updated by: ' : 'Cập nhật gần nhất: '}<span className="font-semibold text-slate-800 dark:text-slate-100">{policy.updatedByAdminName || (isEn ? 'Not available' : 'Chưa có')}</span>
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
          <Save size={17} />
          {saving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save policies' : 'Lưu quy định')}
        </button>
      </div>
    </form>
  );
};

export default AdminPoliciesPage;
