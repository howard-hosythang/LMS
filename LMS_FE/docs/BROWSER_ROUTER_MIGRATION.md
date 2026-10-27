# Chuyển Library74 từ HashRouter sang BrowserRouter

Ngày cập nhật: 27/10/2026. Thay đổi mã nguồn, chưa tự push hoặc deploy production.

## Hành vi mới

```text
Cũ: https://library74.uk/#/publicpage/guide
Mới: https://library74.uk/publicpage/guide
```

`App.tsx` sử dụng BrowserRouter. Các route chức năng giữ nguyên tên và phân quyền.
`LegacyHashRedirect` bọc nội dung router: nhận link `#/...` cũ và chuyển bằng replace trước khi trang đích mount/gọi API. Giữ query params, anchor trong route và state; tham số bên trong hash được ưu tiên nếu trùng tham số bên ngoài. Anchor thông thường như `#borrowing` không bị coi là route. Không cho fragment trở thành redirect sang domain khác.

Redirect các đường dẫn viết tắt cũ (`/login`, `/librarian/...`, `/admin/...`) cũng giữ search/hash. Bộ lọc dùng useSearchParams tiếp tục hoạt động. ScrollToTop vẫn chỉ phụ thuộc pathname; đóng/mở drawer hoặc đổi query không tạo cơ chế scroll mới.

## Những thành phần đã cập nhật

- Router chính và tương thích link hash đã chia sẻ trước đây.
- Link đầu sách/bản sao mở tab mới và link vòng đời sách trong ReaderHistory: dùng đường dẫn không hash; NewTabLink dùng React Router Link.
- Link đăng nhập khi hết phiên, link thông báo và nhận diện khu vực public của thủ thư bằng pathname.
- Google OAuth callback nhận code từ query như cũ, chuyển bằng navigate replace sang route theo vai trò/onboarding; chặn gọi lại mã một lần do StrictMode replay effect. URL callback đăng ký với Google vẫn là `/oauth2/callback`.
- Backend tạo link đặt lại mật khẩu, redirect xác minh email thành công/thất bại và URL payOS quay về/hủy cho cọc và phí phạt theo đường dẫn mới.
- Route xác minh email thất bại được khai báo để callback không rơi vào 404; hiển thị trạng thái thất bại và liên kết đăng nhập.
- Canonical/og:url và sitemap tĩnh/script sinh sitemap bỏ `/#`.
- Nginx frontend đã có SPA fallback; giữ cấu hình cache riêng cho index và assets.

Không đổi API, database, schema, khóa môi trường hoặc redirect URI Google. Link email/đơn payOS cũ vẫn cần được phục vụ qua LegacyHashRedirect. Không sửa các bản ghi lịch sử chỉ để đổi URL.

## Cấu hình máy chủ cần có

Container frontend đã cấu hình trong `nginx-fe.conf`:

```nginx
location /assets/ {
    try_files $uri =404;
}
location / {
    try_files $uri $uri/ /index.html;
}
```

Reverse proxy ngoài container phải chuyển các route frontend tới frontend, còn `/api/`, websocket và các đường dẫn backend khác tới đúng dịch vụ. Cấu hình reverse proxy đang chạy trên production không nằm trong repo nên phải kiểm tra khi triển khai; cấu hình container không chứng minh proxy bên ngoài đã đúng.

Không redirect mọi request thành `/` vì sẽ mất route/query. Không để SPA fallback thay response API hoặc trả HTML thay asset trong `/assets/`.

`FRONTEND_URL`/`base.frontend-url` tiếp tục là origin, ví dụ `https://library74.uk`, không thêm `/#` vào biến môi trường. Nếu cấu hình server thực tế có hash thì cần sửa tại môi trường triển khai. Không đọc hoặc sửa `.env.prod` trong task này.

## Thứ tự phát hành

1. Kiểm tra reverse proxy phục vụ được đường dẫn sâu.
2. Triển khai **FE trước**, xác nhận URL mới và link hash cũ cùng hoạt động.
3. Sau đó triển khai BE tạo link email/payOS mới. Nếu BE lên trước FE cũ chỉ có HashRouter, link không hash có thể mở sai trang.
4. Hai workflow FE/BE hiện có chạy độc lập; trong đợt chuyển đổi cần điều phối thứ tự trên. Không giả định chạy CI thành công đồng nghĩa đã kiểm thử proxy hoặc đồng bộ rollout.
5. Khi rollback, ưu tiên giữ FE có tương thích cả hai dạng URL cho đến khi xử lý xong các link mới đã phát hành.

Không cần thay URI Google đang đăng ký nếu nó vốn là `https://library74.uk/oauth2/callback`. URL return/cancel payOS nằm trong đơn thanh toán; đơn cũ không cần tạo lại chỉ để thay dạng URL, và URL quay về không phải bằng chứng đã thanh toán. Đồng bộ/webhook vẫn quyết định trạng thái.

## Kiểm tra sau triển khai

- Mở trực tiếp và F5 `/publicpage/guide`, `/publicpage/book/:id`, `/librarianpage/transactions?tab=reader&userId=...&page=2`.
- Kiểm tra HTTP các đường dẫn sâu trả tài liệu ứng dụng; trình duyệt render đúng trang. Chỉ kiểm tra status 200 chưa đủ chứng minh route đúng.
- Back/Forward khôi phục URL/bộ lọc; drawer không làm mất vị trí cuộn do đổi query.
- Link `/#/publicpage/reset-password?token=...` cũ giữ đúng token; link mới cũng hoạt động.
- Đăng nhập Google đủ vai trò và onboarding; thiếu/sai code có đường quay lại đăng nhập.
- Xác minh email thành công/thất bại; đặt lại mật khẩu với link gửi từ BE mới.
- Link đầu sách/bản sao/vòng đời mở tab mới đúng URL; thông báo điều hướng đúng trang.
- Cọc/phạt payOS: return/cancel theo URL mới và link hash cũ; kiểm tra bằng môi trường được phép, không tự tạo giao dịch thật trong bước unit test.
- API vẫn trả JSON; asset không tồn tại trong `/assets/` trả 404; tải asset hiện có thành công.
- Canonical, sitemap và URL chia sẻ không còn hash dùng làm route.

Bỏ hash không tự tạo SSR/prerender. Trang React vẫn cần JavaScript để render; việc crawl/RAG tiếp tục được thảo luận riêng tại `LMS_BE/docs/CHATBOT_RAG_DISCUSSION.md`.

## Kiểm thử mã nguồn

```powershell
# Từ LMS_FE
npm test -- --runInBand
npx tsc --noEmit
npm run build

# Từ LMS_BE
mvn --batch-mode --no-transfer-progress test -pl library-circulation-module,library-auth-module -am
```

Test mới kiểm tra BrowserRouter/link cũ/query/anchor/Back-Forward, OAuth chuyển vai trò và URL email/payOS. Test TransactionInquiry được cập nhật kỳ vọng href mới, giữ các kiểm tra target, rel, drawer và bộ lọc. Unit test dùng jsdom/provider mock; không thay cho kiểm tra Nginx, OAuth hoặc thanh toán thật trên production.

### Kết quả kiểm tra ngày 27/10/2026

- Backend auth/circulation và các module phụ thuộc: **230 test pass**, 0 failure/error/skip.
- Frontend: **33 suites, 211 test pass**; các test callback Google chạy trong StrictMode và xác nhận chỉ gọi socialLogin một lần.
- TypeScript `--noEmit`: pass. Vite production build: pass; còn cảnh báo chunk lớn hơn 500 kB có sẵn.
- `git diff --check`: pass. Không sửa/xóa các test nghiệp vụ cũ để che lỗi; chỉ cập nhật kỳ vọng URL cần thay đổi và bổ sung kiểm thử hồi quy.
- Docker local không kết nối được daemon `dockerDesktopLinuxEngine`, nên chưa chạy Nginx trong container để xác minh request/F5 thật. Chưa kiểm thử trình duyệt thật hoặc proxy production, OAuth Google thật và giao dịch payOS thật.
- Không thay đổi dữ liệu, secret hoặc `.env.prod`; chưa commit/push/deploy trong task này.
