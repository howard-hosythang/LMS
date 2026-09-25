import { AlertTriangle, CheckCircle, FileText, XCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const ServiceTermsPage = () => {
  const { language } = useTranslation();
  if (language === 'en') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <FileText size={48} />
              <h1 className="text-4xl md:text-5xl font-bold">Service Terms</h1>
            </div>
            <p className="text-xl text-blue-100">
              Conditions for using Library74 services
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
                1. Service scope
              </h2>
              <p>
                Library74 provides catalog search, borrowing support,
                reservations, notifications, fines tracking, and digital
                material access where available.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Availability
              </h2>
              <p>
                We aim to keep services available, but maintenance, network
                issues, or operational needs may temporarily limit access.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Acceptable use
              </h2>
              <p>
                Users must not disrupt the system, attempt unauthorized access,
                scrape restricted data, or misuse library materials.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Support
              </h2>
              <p>
                For service support, contact the library through the Contact
                page.
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
              Điều khoản dịch vụ
            </h1>
          </div>
          <p className="text-xl text-blue-100">
            Các quy định và điều kiện sử dụng dịch vụ Library74
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
              Điều khoản dịch vụ này quy định các điều kiện và quy tắc khi sử
              dụng dịch vụ Library74. Vui lòng đọc kỹ trước khi sử dụng dịch vụ
              của chúng tôi.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Chấp nhận điều khoản
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Bằng việc truy cập và sử dụng Library74, bạn đồng ý tuân thủ và bị
              ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng
              ý với bất kỳ phần nào, bạn không được phép sử dụng dịch vụ.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Mô tả dịch vụ
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Library74 cung cấp các dịch vụ sau:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tìm kiếm và duyệt danh mục sách</li>
                <li>Mượn và trả sách</li>
                <li>Đặt trước sách</li>
                <li>Quản lý danh sách yêu thích</li>
                <li>Truy cập tài liệu số và ebook</li>
                <li>Nhận thông báo và gợi ý cá nhân hóa</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Điều kiện sử dụng
            </h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  3.1. Yêu cầu tài khoản
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Bạn phải đăng ký tài khoản để sử dụng một số tính năng
                  </li>
                  <li>Thông tin đăng ký phải chính xác và đầy đủ</li>
                  <li>Bạn chịu trách nhiệm bảo mật tài khoản của mình</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  3.2. Hành vi bị cấm
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                  <li>Vi phạm quyền sở hữu trí tuệ</li>
                  <li>Phát tán virus, malware hoặc mã độc</li>
                  <li>Can thiệp vào hoạt động của hệ thống</li>
                  <li>Giả mạo danh tính hoặc cung cấp thông tin sai lệch</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Quyền và trách nhiệm
            </h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  Quyền của người dùng
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Truy cập và sử dụng các dịch vụ được cung cấp</li>
                  <li>Mượn sách theo quy định</li>
                  <li>Đề xuất cải thiện dịch vụ</li>
                  <li>Nhận hỗ trợ từ đội ngũ thư viện</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <XCircle className="text-red-600" size={20} />
                  Trách nhiệm của người dùng
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tuân thủ các quy định của thư viện</li>
                  <li>Bảo quản sách mượn cẩn thận</li>
                  <li>Trả sách đúng hạn</li>
                  <li>Thanh toán phí phạt (nếu có)</li>
                  <li>Báo cáo sự cố hoặc vi phạm</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Sở hữu trí tuệ
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Tất cả nội dung trên Library74, bao gồm nhưng không giới hạn ở văn
              bản, đồ họa, logo, và phần mềm, là tài sản của chúng tôi hoặc được
              cấp phép sử dụng. Bạn không được phép sao chép, phân phối, hoặc sử
              dụng nội dung này cho mục đích thương mại mà không có sự cho phép
              bằng văn bản.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-orange-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                6. Từ chối trách nhiệm
              </h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Library74 được cung cấp "như hiện tại" và "như có sẵn". Chúng
                tôi không đảm bảo:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Dịch vụ sẽ luôn hoạt động không gián đoạn hoặc không có lỗi
                </li>
                <li>Mọi thông tin đều chính xác 100%</li>
                <li>Dịch vụ sẽ đáp ứng mọi yêu cầu của bạn</li>
                <li>Hệ thống sẽ không bị tấn công hoặc xâm nhập</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát
                sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Giới hạn trách nhiệm
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Trong phạm vi tối đa được pháp luật cho phép, Library74 và các đối
              tác không chịu trách nhiệm cho bất kỳ thiệt hại trực tiếp, gián
              tiếp, ngẫu nhiên, đặc biệt hoặc hậu quả nào phát sinh từ việc sử
              dụng hoặc không thể sử dụng dịch vụ.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Chấm dứt dịch vụ
            </h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Chúng tôi có quyền tạm ngưng hoặc chấm dứt quyền truy cập của
                bạn nếu:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Vi phạm các điều khoản này</li>
                <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                <li>Không thanh toán phí phạt trong thời gian dài</li>
                <li>Yêu cầu của cơ quan có thẩm quyền</li>
              </ul>
            </div>
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
              10. Luật áp dụng
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi
              tranh chấp phát sinh sẽ được giải quyết tại tòa án có thẩm quyền
              tại TP. Hồ Chí Minh.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Liên hệ
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nếu bạn có câu hỏi về các điều khoản dịch vụ, vui lòng liên hệ:
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
                và đồng ý tuân thủ tất cả các điều khoản dịch vụ nêu trên.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTermsPage;
