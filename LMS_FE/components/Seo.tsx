import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type SeoProps = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: string | null;
  type?: 'website' | 'book';
  jsonLd?: Record<string, unknown> | null;
};

const DEFAULT_TITLE = 'Library74';
const DEFAULT_DESCRIPTION = 'Library74 là hệ thống thư viện số hỗ trợ tìm kiếm sách, mượn sách, đặt trước và khám phá nội dung bằng AI.';
const DEFAULT_IMAGE = '/logo.png';

const getSiteUrl = () => {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL;
  if (configured) return String(configured).replace(/\/$/, '');
  return window.location.origin;
};

const absoluteUrl = (value?: string | null) => {
  if (!value) return `${getSiteUrl()}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${getSiteUrl()}${value.startsWith('/') ? value : `/${value}`}`;
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    const name = attrs.name ?? attrs.property;
    if (attrs.name) element.setAttribute('name', name);
    if (attrs.property) element.setAttribute('property', name);
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  image,
  type = 'website',
  jsonLd,
}: SeoProps) => {
  useEffect(() => {
    const fullTitle = title === DEFAULT_TITLE ? title : `${title} | Library74`;
    const siteUrl = getSiteUrl();
    const canonical = canonicalPath
      ? `${siteUrl}/#${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
      : `${siteUrl}${window.location.hash || '#/publicpage'}`;
    const imageUrl = absoluteUrl(image);

    document.title = fullTitle;
    document.documentElement.lang = 'vi';
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Library74' });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });
    upsertLink('canonical', canonical);

    document.getElementById('library74-jsonld')?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'library74-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [canonicalPath, description, image, jsonLd, title, type]);

  return null;
};

export const RouteSeo = () => {
  const location = useLocation();
  const path = location.pathname;

  const route = path.includes('/search')
    ? {
        title: 'Tìm kiếm sách',
        description: 'Tìm kiếm sách theo từ khóa, danh mục, thẻ AI và ngữ nghĩa nội dung tại Library74.',
      }
    : path.includes('/categories')
      ? {
          title: 'Danh mục sách',
          description: 'Khám phá danh mục sách và tài liệu học tập trong thư viện Library74.',
        }
      : path.includes('/contact') || path.includes('/contact-tickets')
        ? {
            title: 'Liên hệ hỗ trợ',
            description: 'Kênh hỗ trợ Library74 với SLA xử lý rõ ràng cho tài khoản, mượn trả và lỗi hệ thống.',
          }
        : path.includes('/privacy-policy')
          ? {
              title: 'Chính sách bảo mật',
              description: 'Chính sách bảo mật dữ liệu cá nhân và quyền riêng tư của người dùng Library74.',
            }
          : path.includes('/cookie-policy')
            ? {
                title: 'Chính sách Cookie',
                description: 'Cách Library74 dùng bộ nhớ trình duyệt cần thiết, cookie analytics và lựa chọn opt-in hoặc opt-out.',
              }
            : {
                title: DEFAULT_TITLE,
                description: DEFAULT_DESCRIPTION,
              };

  return <Seo {...route} canonicalPath={path} />;
};

export default Seo;
