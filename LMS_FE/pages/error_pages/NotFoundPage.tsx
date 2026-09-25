import {
  ArrowRight,
  Book,
  BookOpen,
  Bot,
  GraduationCap,
  Home,
  Search,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 py-12 overflow-hidden relative">
      {/* Decorative background elements (optional) */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-3xl w-full text-center relative">
        {/* Floating Icons Animation Wrapper */}
        <div className="relative h-64 flex items-center justify-center mb-6">
          {/* 404 Text */}
          <h1 className="text-[10rem] font-bold text-primary-600 leading-none tracking-tighter select-none relative z-10">
            404
            {/* Underline decoration */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-primary-600 rounded-full"></div>
          </h1>

          {/* Floating Elements */}
          <div className="absolute top-10 left-[20%] animate-float p-3 bg-green-100 rounded-full shadow-sm text-green-600">
            <Book className="w-6 h-6" />
          </div>
          <div className="absolute top-0 right-[25%] animate-float-delayed p-4 bg-blue-100 rounded-full shadow-sm text-primary-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="absolute bottom-10 left-[30%] animate-float-delayed p-3 bg-orange-100 rounded-full shadow-sm text-orange-600">
            <Search className="w-5 h-5" />
          </div>
          <div className="absolute -bottom-2 right-[30%] animate-float p-2 bg-purple-100 rounded-full shadow-sm text-purple-600">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-500 text-lg mb-2">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <p className="text-gray-500 mb-8">
          Hãy thử tìm kiếm sách hoặc quay về trang chủ để khám phá thêm tài
          liệu.
        </p>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/">
            <button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/30">
              <Home className="w-4 h-4" />
              Về trang chủ
            </button>
          </Link>
          <Link to="/search">
            <button className="w-full sm:w-auto bg-white border border-gray-300 hover:border-primary-600 hover:text-primary-600 text-gray-700 font-medium py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Search className="w-4 h-4" />
              Tới trang tìm kiếm
            </button>
          </Link>
        </div>

        {/* Suggestions Section */}
        <div className="text-left">
          <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
            Có thể bạn đang tìm kiếm:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Suggestion 1 */}
            <Link to="/search">
              <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6 text-primary-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Tìm kiếm AI</h4>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8">
                  Tìm sách bằng ngôn ngữ tự nhiên với công nghệ AI tiên tiến
                </p>
                <div className="flex items-center text-sm font-semibold text-primary-600 group-hover:gap-2 transition-all">
                  Thử ngay <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* Suggestion 2 */}
            <Link to="/search?sort=newest">
              <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-100 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Sách mới</h4>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8">
                  Khám phá những tài liệu mới nhất được thêm vào thư viện
                </p>
                <div className="flex items-center text-sm font-semibold text-primary-600 group-hover:gap-2 transition-all">
                  Xem thêm <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* Suggestion 3 */}
            <Link to="/categories">
              <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-100 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Theo chủ đề</h4>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8">
                  Duyệt tài liệu theo ngành học và lĩnh vực quan tâm
                </p>
                <div className="flex items-center text-sm font-semibold text-primary-600 group-hover:gap-2 transition-all">
                  Khám phá <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
