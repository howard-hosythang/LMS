import { AlertCircle, FileText, Lock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CirculationPolicy } from '../../api/adminService';
import circulationPolicyService from '../../api/circulationPolicyService';
import { useTranslation } from '../../contexts/LanguageContext';

const TermsPage = () => {
  const { language } = useTranslation();
  const [policy, setPolicy] = useState<CirculationPolicy | null>(null);

  useEffect(() => {
    let mounted = true;
    circulationPolicyService
      .getPolicy()
      .then((response) => {
        if (mounted && response.code === 200) setPolicy(response.data);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const currentPolicy = {
    pickupDeadlineHours: policy?.pickupDeadlineHours ?? 24,
    defaultLoanDays: policy?.defaultLoanDays ?? 14,
    maxActiveBorrows: policy?.maxActiveBorrows ?? 5,
    maxActiveReservations: policy?.maxActiveReservations ?? 2,
    overdueFinePerDay: policy?.overdueFinePerDay ?? 1000,
    defaultDepositAmount: policy?.defaultDepositAmount ?? 0,
    blockBorrowWhenUnpaidFines: policy?.blockBorrowWhenUnpaidFines ?? true,
  };
  const fineText = new Intl.NumberFormat(
    language === 'en' ? 'en-US' : 'vi-VN'
  ).format(currentPolicy.overdueFinePerDay);
  const depositText = new Intl.NumberFormat(
    language === 'en' ? 'en-US' : 'vi-VN'
  ).format(currentPolicy.defaultDepositAmount);

  if (language === 'en') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <FileText size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Terms of Use</h1>
            </div>
            <p className="text-xl text-blue-100">
              Rules and conditions for using Library74
            </p>
            <p className="text-sm text-blue-200 mt-2">
              Last updated: 01/01/2025
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Acceptance of terms
              </h2>
              <p>
                By accessing and using Library74, you agree to follow these
                terms and all applicable library policies.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Account registration
              </h2>
              <p>
                You are responsible for providing accurate information, keeping
                your password secure, and notifying us of any unauthorized
                account activity.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Borrowing rules
              </h2>
              <p>
                Borrowing limits, due dates, renewals, reservations, returns,
                and fines follow the policies displayed in the system and
                communicated by the library.
              </p>
              <ul className="mt-3 list-disc list-inside space-y-1">
                <li>
                  Current default loan period: {currentPolicy.defaultLoanDays}{' '}
                  days.
                </li>
                <li>
                  Current active borrow or pickup-waiting limit:{' '}
                  {currentPolicy.maxActiveBorrows} items.
                </li>
                <li>
                  Current active reservation limit:{' '}
                  {currentPolicy.maxActiveReservations} requests.
                </li>
                <li>
                  Current pickup window after a reserved item is ready:{' '}
                  {currentPolicy.pickupDeadlineHours} hours.
                </li>
                <li>
                  Current borrow deposit: {depositText} VND per physical copy,
                  collected by the librarian when the item is handed over.
                </li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Fines and compensation
              </h2>
              <p>
                Currently, overdue fines are {fineText} VND per day for each
                overdue item. Overdue, damaged, or lost materials may result in
                fines or replacement requirements. Please contact the library
                desk for settlement.
              </p>
              <p className="mt-3">
                Borrow deposits are offset against overdue, damaged, or lost
                item fines. If the deposit is higher than the fine, the
                remaining balance is refunded. If the fine is higher, the
                remaining amount must be paid at the library desk.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. User responsibilities
              </h2>
              <p>
                Users must protect borrowed materials, return them on time,
                respect intellectual property rights, and avoid misuse of
                digital content.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Contact
              </h2>
              <p>
                For questions about these terms, contact support@library74.uk or
                +84 88 676 5392.
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={48} />
            <h1 className="text-4xl md:text-5xl font-bold">
              Điều khoản sử dụng
            </h1>
          </div>
          <p className="text-xl text-blue-100">
            Các quy định và điều khoản khi sử dụng dịch vụ Library74
          </p>
          <p className="text-sm text-blue-200 mt-2">
            Cập nhật lần cuối: 01/01/2025
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8">
          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                1. Chấp nhận điều khoản
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Bằng việc truy cập và sử dụng Library74, bạn đồng ý tuân thủ và bị
              ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng
              ý với bất kỳ phần nào của các điều khoản này, bạn không được phép
              sử dụng dịch vụ.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Đăng ký tài khoản
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Để sử dụng một số tính năng của Library74, bạn cần đăng ký tài
                khoản. Khi đăng ký, bạn cam kết:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cung cấp thông tin chính xác, đầy đủ và cập nhật</li>
                <li>
                  Bảo mật mật khẩu và chịu trách nhiệm về mọi hoạt động diễn ra
                  dưới tài khoản của bạn
                </li>
                <li>
                  Thông báo ngay cho chúng tôi nếu phát hiện bất kỳ vi phạm bảo
                  mật nào
                </li>
                <li>Không chia sẻ tài khoản của bạn với người khác</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Quy định mượn sách
            </h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  3.1. Thời gian mượn
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Hiện tại, thời gian mượn mặc định:{' '}
                    {currentPolicy.defaultLoanDays} ngày
                  </li>
                  <li>
                    Hiện tại, thời hạn nhận sách sau khi sẵn sàng:{' '}
                    {currentPolicy.pickupDeadlineHours} giờ
                  </li>
                  <li>
                    Tiền cọc khi mượn: {depositText} VND/cuốn, do thủ thư thu
                    khi giao sách và được ghi nhận trên giao dịch.
                  </li>
                  <li>
                    Gia hạn, nếu áp dụng, phụ thuộc vào quy định vận hành và
                    tình trạng đặt trước của từng đầu sách
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  3.2. Số lượng sách
                </h3>
                <p>
                  Hiện tại, mỗi người dùng có thể có tối đa{' '}
                  {currentPolicy.maxActiveBorrows} sách đang mượn hoặc đang chờ
                  lấy, và tối đa {currentPolicy.maxActiveReservations} yêu cầu
                  đặt trước đang hoạt động.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  3.3. Trả sách
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Trả sách đúng hạn tại quầy thư viện</li>
                  <li>Kiểm tra tình trạng sách trước khi trả</li>
                  <li>Báo cáo ngay nếu sách bị hư hỏng trong quá trình mượn</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-orange-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                4. Phí phạt và bồi thường
              </h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  4.1. Phí phạt quá hạn
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Hiện tại, phí quá hạn là {fineText} VND/ngày cho mỗi cuốn
                    sách quá hạn
                  </li>
                  <li>
                    Phí phạt được tính từ ngày hết hạn đến ngày trả sách thực tế
                  </li>
                  <li>
                    Khi trả sách, hệ thống cấn tiền cọc vào phạt gốc. Nếu còn
                    dư cọc thì hoàn lại; nếu phạt vượt cọc thì người dùng cần
                    đóng thêm phần chênh lệch.
                  </li>
                  <li>Thanh toán tại quầy thư viện khi trả sách</li>
                  {currentPolicy.blockBorrowWhenUnpaidFines && (
                    <li>
                      Người dùng còn phí chưa thanh toán sẽ bị chặn tạo giao
                      dịch mượn/đặt trước mới
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  4.2. Mất hoặc hư hỏng sách
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Báo cáo ngay với thư viện nếu làm mất hoặc hư hỏng sách
                  </li>
                  <li>
                    Bồi thường bằng giá trị sách hoặc mua sách mới để thay thế
                  </li>
                  <li>Nếu hư hỏng nhẹ, có thể chỉ cần sửa chữa</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Quyền và trách nhiệm
            </h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  5.1. Quyền của người dùng
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Truy cập và sử dụng các dịch vụ của Library74</li>
                  <li>Mượn sách theo quy định</li>
                  <li>Đề xuất sách mới</li>
                  <li>Nhận hỗ trợ từ đội ngũ thư viện</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  5.2. Trách nhiệm của người dùng
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tuân thủ các quy định của thư viện</li>
                  <li>Bảo quản sách mượn cẩn thận</li>
                  <li>Trả sách đúng hạn</li>
                  <li>Thanh toán phí phạt (nếu có)</li>
                  <li>Không sao chép, phân phối trái phép nội dung sách</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                6. Bảo mật và quyền riêng tư
              </h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Thông tin
                bạn cung cấp sẽ được sử dụng để:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Quản lý tài khoản và dịch vụ thư viện</li>
                <li>Gửi thông báo về sách và dịch vụ</li>
                <li>Cải thiện chất lượng dịch vụ</li>
              </ul>
              <p className="leading-relaxed">
                Chúng tôi không chia sẻ thông tin cá nhân của bạn với bên thứ ba
                mà không có sự đồng ý của bạn, trừ khi được yêu cầu bởi pháp
                luật.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Sở hữu trí tuệ
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Tất cả nội dung trên Library74, bao gồm nhưng không giới hạn ở văn
              bản, đồ họa, logo, và phần mềm, là tài sản của chúng tôi hoặc được
              cấp phép sử dụng. Bạn không được phép sao chép, phân phối, hoặc sử
              dụng nội dung này cho mục đích thương mại mà không có sự cho phép
              bằng văn bản.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Từ chối trách nhiệm
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Library74 được cung cấp "như hiện tại" và "như có sẵn". Chúng tôi
              không đảm bảo rằng:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600">
              <li>
                Dịch vụ sẽ luôn hoạt động không gián đoạn hoặc không có lỗi
              </li>
              <li>Mọi thông tin đều chính xác 100%</li>
              <li>Dịch vụ sẽ đáp ứng mọi yêu cầu của bạn</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Thay đổi điều khoản
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào. Các
              thay đổi sẽ có hiệu lực ngay sau khi được đăng tải trên trang web.
              Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi được coi là
              bạn đã chấp nhận các điều khoản mới.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Liên hệ
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui lòng liên
              hệ với chúng tôi:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>
                Email:{' '}
                <a
                  href="mailto:support@library74.uk"
                  className="text-blue-600 hover:underline"
                >
                  support@library74.uk
                </a>
              </li>
              <li>
                Điện thoại:{' '}
                <a
                  href="tel:+84886765392"
                  className="text-blue-600 hover:underline"
                >
                  +84 88 676 5392
                </a>
              </li>
              <li>
                Địa chỉ: 268 Lý Thường Kiệt, Phường 14, Quận 10, Thành phố Hồ
                Chí Minh
              </li>
            </ul>
          </section>

          {/* Agreement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <p className="text-gray-700 leading-relaxed">
              <strong>
                Bằng việc sử dụng Library74, bạn xác nhận rằng bạn đã đọc, hiểu
                và đồng ý tuân thủ tất cả các điều khoản và điều kiện nêu trên.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
