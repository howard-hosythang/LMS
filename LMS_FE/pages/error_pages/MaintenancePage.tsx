import { Clock, Mail, Phone, Search, Shield, Wrench, Zap } from 'lucide-react';
import React from 'react';

const MaintenancePage: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 py-12">
      <div className="max-w-4xl w-full text-center">
        {/* Header Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center ring-8 ring-yellow-50/50">
            <Wrench className="w-10 h-10 text-yellow-600 transform rotate-90" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hệ thống đang bảo trì
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-10">
          Chúng tôi đang nâng cấp hệ thống thư viện để mang đến trải nghiệm tốt
          hơn cho bạn.
        </p>

        {/* Time Estimation Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 inline-block w-full max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-gray-900 font-semibold mb-3">
              <Clock className="w-5 h-5 text-primary-600" />
              Thời gian dự kiến
            </div>
            <div className="text-5xl font-extrabold text-primary-600 mb-2">
              2 giờ
            </div>
            <div className="text-sm text-gray-500">
              Hoàn thành vào lúc 14:00 hôm nay
            </div>
          </div>
        </div>

        {/* Feature Improvements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">
              Cải thiện tìm kiếm AI
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Nâng cấp thuật toán tìm kiếm ngữ nghĩa, giúp kết quả chính xác
              hơn.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Tăng hiệu suất</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tối ưu hóa tốc độ tải trang và phản hồi của hệ thống.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Bảo mật nâng cao</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Cập nhật các tính năng bảo mật mới bảo vệ dữ liệu người dùng.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-gray-700">
              Tiến độ bảo trì
            </span>
            <span className="text-sm font-bold text-primary-600">75%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="bg-primary-600 h-3 rounded-full w-3/4 animate-pulse"></div>
          </div>
        </div>

        {/* Contact Footer */}
        <div className="bg-primary-50 rounded-xl p-6 max-w-2xl mx-auto">
          <h4 className="font-semibold text-gray-900 mb-4">
            Cần hỗ trợ khẩn cấp?
          </h4>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="mailto:support@library74.uk"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Mail className="w-4 h-4 text-primary-600" />
              <span className="text-sm">support@library74.uk</span>
            </a>
            <div className="hidden sm:block text-gray-300">|</div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-primary-600" />
              <span className="text-sm">+84 88 676 5392</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
