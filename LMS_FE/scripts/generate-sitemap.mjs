import { writeFile } from 'node:fs/promises';

const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://library74.uk').replace(/\/$/, '');
const apiBase = (process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || '').replace(/\/$/, '');

const staticPaths = [
  ['/publicpage', '1.0'],
  ['/publicpage/search', '0.9'],
  ['/publicpage/categories', '0.8'],
  ['/publicpage/contact', '0.7'],
  ['/publicpage/privacy-policy', '0.5'],
  ['/publicpage/cookie-policy', '0.5'],
  ['/publicpage/terms', '0.5'],
  ['/publicpage/service-terms', '0.5'],
];

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const urlEntry = (path, priority) => `  <url>
    <loc>${escapeXml(`${siteUrl}/#${path}`)}</loc>
    <priority>${priority}</priority>
  </url>`;

const fetchBookIds = async () => {
  if (!apiBase) return [];
  const ids = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const url = `${apiBase}/publications/search?page=${page}&size=50&sortBy=newest`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch publications for sitemap: HTTP ${response.status}`);
    const body = await response.json();
    const data = body.data ?? body;
    ids.push(...(data.content ?? []).map((item) => item.publicationId).filter(Boolean));
    totalPages = Number(data.totalPages ?? 0);
    page += 1;
    if (page > 200) break;
  }

  return Array.from(new Set(ids.map(String)));
};

const bookIds = await fetchBookIds().catch((error) => {
  console.warn(error.message);
  return [];
});

const entries = [
  ...staticPaths.map(([path, priority]) => urlEntry(path, priority)),
  ...bookIds.map((id) => urlEntry(`/publicpage/book/${id}`, '0.8')),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml, 'utf8');
console.log(`Generated public/sitemap.xml with ${entries.length} URLs`);
