import { Award, BookOpen, Heart, Sparkles, Target, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import publicationsService from '../../api/publicationsService';
import { PublicLibraryStats } from '../../api/publicationTypes';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

const fallbackStats: PublicLibraryStats = {
  totalPublications: 0,
  activeUsers: 0,
  totalBorrows: 0,
  totalCategories: 0,
  averageRating: 0,
  totalRatings: 0,
  satisfactionPercent: 0,
};

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const AboutPage = () => {
  const { userType } = useAuth();
  const { language, t } = useTranslation();
  const [stats, setStats] = useState<PublicLibraryStats>(fallbackStats);

  useEffect(() => {
    publicationsService
      .getPublicStats()
      .then((response) => {
        if (response.code === 200 && response.data) setStats(response.data);
      })
      .catch(() => setStats(fallbackStats));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'en' ? 'About Library74' : 'Về Library74'}
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              {language === 'en'
                ? 'A next-gen smart library platform elevating academic discovery and knowledge access for readers.'
                : 'Nền tảng thư viện thông minh thế hệ mới nâng tầm khả năng khám phá học thuật và tiếp cận tri thức cho người đọc.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Section */}
        <section className="mb-16">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-blue-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-900">
                {language === 'en' ? 'Our mission' : 'Sứ mệnh của chúng tôi'}
              </h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {language === 'en'
                ? 'Library74 is built to provide a modern digital library platform where students and lecturers can easily access rich academic resources. We believe knowledge should be shared and accessed as easily as possible.'
                : 'Library74 được xây dựng với mục tiêu tạo ra một nền tảng thư viện số hiện đại, nơi mọi sinh viên và giảng viên có thể dễ dàng tiếp cận với kho tài liệu phong phú. Chúng tôi tin rằng tri thức nên được chia sẻ và truy cập một cách dễ dàng nhất.'}
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              {language === 'en'
                ? 'With advanced AI, we do not only help you find books faster, but also recommend materials that match your interests and learning goals.'
                : 'Với công nghệ AI tiên tiến, chúng tôi không chỉ giúp bạn tìm sách nhanh chóng mà còn gợi ý những tài liệu phù hợp với sở thích và nhu cầu học tập của bạn.'}
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {language === 'en' ? 'Key features' : 'Tính năng nổi bật'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en'
                  ? 'AI semantic search'
                  : 'Tìm kiếm thông minh với AI'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Search with natural language instead of exact keywords. AI understands your intent and returns more relevant results.'
                  : 'Sử dụng ngôn ngữ tự nhiên để tìm sách, không cần từ khóa chính xác. AI sẽ hiểu ý định của bạn và đưa ra kết quả phù hợp nhất.'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en'
                  ? 'Rich academic collection'
                  : 'Kho tài liệu phong phú'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'A growing collection across many disciplines, supporting learning, research, and professional development.'
                  : 'Kho đầu sách đang được cập nhật liên tục theo nhiều lĩnh vực, từ khoa học kỹ thuật đến tài liệu học tập và nghiên cứu.'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en'
                  ? 'Easy borrowing management'
                  : 'Quản lý mượn trả dễ dàng'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Track borrowed books, due dates, reservations, and fines through a clear and automated circulation workflow.'
                  : 'Hệ thống quản lý mượn trả tự động, theo dõi lịch sử mượn sách, nhắc nhở hạn trả và quản lý phí phạt một cách minh bạch.'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en'
                  ? 'Personalized recommendations'
                  : 'Gợi ý cá nhân hóa'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Recommendations are generated from your borrowing history and interests to match your study goals.'
                  : 'Dựa trên lịch sử mượn sách và sở thích của bạn, hệ thống sẽ gợi ý những cuốn sách phù hợp với chuyên ngành và mục tiêu học tập.'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="text-indigo-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'Wishlist' : 'Danh sách yêu thích'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Save books you care about and receive updates when they become available.'
                  : 'Lưu lại những cuốn sách bạn quan tâm vào danh sách yêu thích, nhận thông báo khi sách có sẵn để mượn.'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'Digital materials' : 'Tài liệu số'}
              </h3>
              <p className="text-gray-600">
                {language === 'en'
                  ? 'Access digital materials when the library provides the corresponding file and license.'
                  : 'Truy cập tài liệu số khi thư viện cung cấp tệp và quyền sử dụng phù hợp cho từng đầu sách.'}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {language === 'en'
              ? 'Library74 in numbers'
              : 'Library74 trong số liệu'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatNumber(stats.totalPublications)}
              </div>
              <div className="text-blue-100">
                {language === 'en' ? 'Publications' : 'Đầu sách'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatNumber(stats.activeUsers)}
              </div>
              <div className="text-blue-100">{t('home.users')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {formatNumber(stats.totalBorrows)}
              </div>
              <div className="text-blue-100">{t('home.borrows')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {stats.totalRatings > 0 ? `${stats.satisfactionPercent}%` : '0'}
              </div>
              <div className="text-blue-100">{t('home.satisfaction')}</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!userType && (
          <section className="text-center">
            <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('home.readyTitle')}
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('home.readyDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/publicpage/register"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {language === 'en' ? 'Sign up now' : 'Đăng ký ngay'}
                </Link>
                <Link
                  to="/publicpage/search"
                  className="px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  {language === 'en' ? 'Explore library' : 'Khám phá thư viện'}
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AboutPage;
