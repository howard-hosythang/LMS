import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogIn,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';

const ContactPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Trung tâm hỗ trợ
            </p>
            <h1 className="mt-3 text-4xl font-black text-slate-950 md:text-5xl">
              Liên hệ với thư viện
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Để bảo mật và theo dõi xử lý tốt hơn, mọi yêu cầu hỗ trợ được mở
              bằng tài khoản Library74.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/publicpage/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <LogIn size={17} />
                Đăng nhập để mở phiếu hỗ trợ
              </Link>
              <Link
                to="/publicpage/faq"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <MessageSquare size={17} />
                Xem câu hỏi thường gặp
              </Link>
            </div>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-black text-slate-950">
              Thông tin liên hệ trực tiếp
            </h2>
            <div className="mt-6 space-y-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <MapPin size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {t('contact.address', 'Địa chỉ')}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {t(
                      'contact.addressLine1',
                      'Trường Đại học Bách khoa - ĐHQG-HCM'
                    )}
                    <br />
                    {t('contact.addressLine2', '268 Lý Thường Kiệt, Quận 10')}
                    <br />
                    {t('contact.addressLine3', 'TP. Hồ Chí Minh')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Phone size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {t('contact.phone', 'Điện thoại')}
                  </p>
                  <a
                    href="tel:+84886765392"
                    className="mt-1 block text-sm font-semibold text-blue-600 hover:underline"
                  >
                    +84 88 676 5392
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <Mail size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Email</p>
                  <a
                    href="mailto:support@library74.uk"
                    className="mt-1 block text-sm font-semibold text-blue-600 hover:underline"
                  >
                    support@library74.uk
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Clock size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {t('contact.workingHours', 'Giờ làm việc')}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {t('contact.weekdays', 'Thứ 2 - Thứ 6')}: 8:00 - 20:00
                    <br />
                    {t('contact.saturday', 'Thứ 7')}: 8:00 - 17:00
                    <br />
                    {t('contact.sunday', 'Chủ nhật')}: 9:00 - 16:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600" size={22} />
              <h2 className="text-base font-black text-slate-950">
                SLA phản hồi
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Phiếu hỗ trợ tài khoản và mượn trả được phản hồi trong 1 ngày làm
              việc. Lỗi hệ thống nghiêm trọng được xác nhận trong 4 giờ làm
              việc.
            </p>
          </div>
          <div className="border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-600" size={22} />
              <h2 className="text-base font-black text-slate-950">
                Ưu tiên xử lý
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sự cố đăng nhập, thanh toán phạt, QR mượn sách và lỗi đặt trước
              được ưu tiên trước yêu cầu góp ý hoặc đề xuất sách.
            </p>
          </div>
          <div className="border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-blue-600" size={22} />
              <h2 className="text-base font-black text-slate-950">
                Theo dõi minh bạch
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Người dùng đã đăng nhập có thể xem trạng thái NEW, IN_PROGRESS, Đã
              xử lý hoặc Đã đóng trong trung tâm hỗ trợ cá nhân.
            </p>
          </div>
        </div>
        <div className="h-72 overflow-hidden border border-slate-200 bg-white">
          <iframe
            title={t(
              'contact.mapTitle',
              'Bản đồ Trường Đại học Bách khoa TP.HCM'
            )}
            src="https://www.google.com/maps?q=268%20L%C3%BD%20Th%C6%B0%E1%BB%9Dng%20Ki%E1%BB%87t%2C%20Qu%E1%BA%ADn%2010%2C%20TP.HCM&output=embed"
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
