import { AlertCircle, HelpCircle, Home, Lock, LogIn, Mail } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const ForbiddenPage: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
        {/* Red Header Card */}
        <div className="bg-[#EF4444] h-48 flex items-center justify-center relative overflow-hidden">
          {/* Background pattern decoration */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 shadow-inner">
              <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-6xl font-extrabold text-white tracking-tighter drop-shadow-md">
              403
            </h1>
            <div className="w-16 h-1 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 px-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Truy cập bị từ chối
          </h2>
          <p className="text-gray-500 mb-8">
            Bạn không có quyền truy cập khu vực này
          </p>

          {/* Explanation Box */}
          <div className="bg-red-50 rounded-xl p-5 text-left mb-8 border border-red-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-red-900 mb-2">
                  Tại sao tôi thấy trang này?
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-red-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Tài khoản của bạn không có quyền truy cập vào trang này
                  </li>
                  <li className="flex items-center gap-2 text-xs text-red-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Bạn cần đăng nhập với tài khoản có quyền phù hợp
                  </li>
                  <li className="flex items-start gap-2 text-xs text-red-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1"></span>
                    Tài khoản của bạn có thể đã bị tạm khoá hoặc hạn chế quyền
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link to="/publicpage/login">
              <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200">
                <LogIn className="w-4 h-4" />
                Đăng nhập với tài khoản khác
              </button>
            </Link>
            <Link to="/">
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </Link>
          </div>

          {/* Footer Divider */}
          <div className="border-t border-gray-100 my-6"></div>

          {/* Help Links */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Cần trợ giúp?</p>
            <div className="flex items-center justify-center gap-6">
              <a
                href="mailto:support@library74.uk"
                className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Mail className="w-4 h-4" />
                Email hỗ trợ
              </a>
              <a
                href="/#/publicpage/faq"
                className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <HelpCircle className="w-4 h-4" />
                Trung tâm trợ giúp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
        <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-white">
          !
        </div>
        Nếu bạn tin rằng đây là lỗi, vui lòng liên hệ quản trị viên hệ thống
      </div>
    </div>
  );
};

export default ForbiddenPage;
