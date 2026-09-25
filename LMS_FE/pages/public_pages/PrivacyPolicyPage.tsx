import { AlertCircle, Eye, Lock, Shield } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const PrivacyPolicyPage = () => {
  const { language } = useTranslation();
  if (language === 'en') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-xl text-blue-100">
              Our commitment to protecting your personal information
            </p>
            <p className="text-sm text-blue-200 mt-2">
              Last updated: 01/01/2025
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8 text-gray-600 leading-relaxed">
            <p>
              Library74 respects your privacy and protects the information you
              provide when using library services.
            </p>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Information we collect
              </h2>
              <p>
                We may collect profile details, contact information, borrowing
                records, reservations, fines, search activity, and system usage
                data needed to operate the service.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. How we use information
              </h2>
              <p>
                Information is used to manage accounts, provide borrowing and
                reservation services, send notifications, improve
                recommendations, and maintain system security.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Data protection
              </h2>
              <p>
                We apply access control and reasonable safeguards to protect
                user data. We do not sell personal information.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Contact
              </h2>
              <p>For privacy questions, contact support@library74.uk.</p>
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
            <Shield size={48} />
            <h1 className="text-4xl md:text-5xl font-bold">
              Chính sách bảo mật
            </h1>
          </div>
          <p className="text-xl text-blue-100">
            Cam kết bảo vệ thông tin cá nhân của bạn
          </p>
          <p className="text-sm text-blue-200 mt-2">
            Cập nhật lần cuối: 01/01/2025
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              Library74 cam kết bảo vệ quyền riêng tư và thông tin cá nhân của
              người dùng. Chính sách bảo mật này mô tả cách chúng tôi thu thập,
              sử dụng, lưu trữ và bảo vệ thông tin của bạn khi sử dụng dịch vụ
              của chúng tôi.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                1. Thông tin chúng tôi thu thập
              </h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  1.1. Thông tin cá nhân
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Họ và tên</li>
                  <li>Email hoặc mã sinh viên</li>
                  <li>Số điện thoại (nếu cung cấp)</li>
                  <li>Địa chỉ (nếu cung cấp)</li>
                  <li>Thông tin về khoa/ngành học</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  1.2. Thông tin sử dụng dịch vụ
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Lịch sử tìm kiếm và duyệt sách</li>
                  <li>Lịch sử mượn và trả sách</li>
                  <li>Sách yêu thích và danh sách đặt trước</li>
                  <li>Thông tin về thiết bị và trình duyệt</li>
                  <li>Địa chỉ IP và dữ liệu log</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Cách chúng tôi sử dụng thông tin
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Chúng tôi sử dụng thông tin thu thập được để:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cung cấp và cải thiện dịch vụ thư viện</li>
                <li>Xử lý yêu cầu mượn sách và quản lý tài khoản</li>
                <li>
                  Gửi thông báo về sách, hạn trả và các cập nhật quan trọng
                </li>
                <li>Cá nhân hóa trải nghiệm và gợi ý sách phù hợp</li>
                <li>Phân tích và cải thiện hiệu suất hệ thống</li>
                <li>Tuân thủ các yêu cầu pháp lý</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                3. Bảo mật thông tin
              </h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù
                hợp để bảo vệ thông tin của bạn:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Mã hóa dữ liệu trong quá trình truyền (SSL/TLS)</li>
                <li>Lưu trữ an toàn với hệ thống bảo mật nhiều lớp</li>
                <li>Kiểm soát truy cập nghiêm ngặt</li>
                <li>Giám sát và phát hiện các hoạt động bất thường</li>
                <li>Đào tạo nhân viên về bảo mật thông tin</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Chia sẻ thông tin
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của
                bạn với bên thứ ba, trừ các trường hợp sau:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Khi có sự đồng ý của bạn</li>
                <li>
                  Khi được yêu cầu bởi pháp luật hoặc cơ quan có thẩm quyền
                </li>
                <li>
                  Với các nhà cung cấp dịch vụ đáng tin cậy (như hosting, email)
                  với cam kết bảo mật
                </li>
                <li>
                  Trong trường hợp khẩn cấp để bảo vệ quyền lợi và an toàn của
                  người dùng
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Quyền của người dùng
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">Bạn có quyền:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Truy cập và xem thông tin cá nhân của mình</li>
                <li>Yêu cầu chỉnh sửa thông tin không chính xác</li>
                <li>Yêu cầu xóa tài khoản và dữ liệu cá nhân</li>
                <li>
                  Từ chối nhận email marketing (vẫn nhận thông báo quan trọng về
                  dịch vụ)
                </li>
                <li>Xuất dữ liệu cá nhân của mình</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Để thực hiện các quyền trên, vui lòng liên hệ với chúng tôi qua
                email hoặc trang Liên hệ.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Cookie và công nghệ theo dõi
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Chúng tôi sử dụng bộ nhớ trình duyệt cần thiết để duy trì đăng
                nhập, bảo mật và tùy chọn của bạn. Cookie analytics hoặc công
                nghệ theo dõi tương tự chỉ được bật khi bạn chủ động đồng ý. Xem
                thêm chi tiết tại{' '}
                <a
                  href="/publicpage/cookie-policy"
                  className="text-blue-600 hover:underline"
                >
                  Chính sách Cookie
                </a>
                .
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Bảo lưu dữ liệu
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Chúng tôi lưu trữ thông tin của bạn trong thời gian cần thiết để
                cung cấp dịch vụ và tuân thủ các nghĩa vụ pháp lý. Khi bạn xóa
                tài khoản, chúng tôi sẽ xóa hoặc ẩn danh hóa dữ liệu cá nhân của
                bạn, trừ khi pháp luật yêu cầu lưu trữ.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-orange-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                8. Thay đổi chính sách
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian.
              Các thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo
              trên trang web. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay
              đổi được coi là bạn đã chấp nhận chính sách mới.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Liên hệ
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nếu bạn có câu hỏi hoặc lo ngại về chính sách bảo mật này, vui
              lòng liên hệ với chúng tôi:
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
                Địa chỉ: Trường Đại học Bách khoa - ĐHQG TP.HCM, 268 Lý Thường
                Kiệt, Phường 14, Quận 10, TPHCM
              </li>
            </ul>
          </section>

          {/* Agreement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <p className="text-gray-700 leading-relaxed">
              <strong>
                Bằng việc sử dụng Library74, bạn xác nhận rằng bạn đã đọc, hiểu
                và đồng ý với chính sách bảo mật này.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
