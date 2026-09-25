# 📚 Library74 — AI-Powered Library Management System (Frontend)

Giao diện người dùng cho hệ thống quản lý thư viện thông minh, được xây dựng với **React 19 + TypeScript + Vite**. Hỗ trợ đầy đủ nghiệp vụ cho **sinh viên** (mượn/trả sách, tra cứu, đặt trước) và **thủ thư** (quản lý sách, bản sao, lưu thông, yêu cầu).

---

## 🚀 Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | ^19.2.3 | UI Framework |
| TypeScript | ~5.8.2 | Type safety |
| Vite | ^6.4.1 | Build tool / Dev server |
| React Router DOM | ^7.10.1 | Client-side routing (HashRouter) |
| Axios | ^1.13.2 | HTTP client |
| Lucide React | ^0.561.0 | Icon library |
| React Select | ^5.10.2 | Dropdown / Multi-select |

---

## ⚙️ Yêu cầu hệ thống

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Backend LMS đang chạy (mặc định tại `http://localhost:8080/api/v1`)

---

## 🛠️ Cài đặt & Chạy dự án

### 1. Clone & cài đặt dependencies

```bash
git clone <repository-url>
cd LMS_fe
npm install
```

### 2. Cấu hình biến môi trường

Sao chép file `.env.example` thành `.env` và chỉnh sửa cho phù hợp:

```bash
cp .env.example .env
```

Nội dung `.env`:

```env
# URL base của backend API
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Timeout mỗi request (milliseconds)
VITE_API_TIMEOUT=10000
```

### 3. Chạy môi trường development

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3000**

### 4. Build production

```bash
npm run build
```

### 5. Preview bản build

```bash
npm run preview
```

---

## 📁 Cấu trúc dự án

```
LMS_fe/
├── api/                          # Tầng giao tiếp với backend
│   ├── axiosInstance.ts          # Axios config, interceptors, auto token refresh
│   ├── authService.ts            # Đăng nhập, đăng xuất, OAuth2 callback
│   ├── publicationsService.ts    # CRUD sách / ấn phẩm
│   ├── copyTypes.ts              # Loại bản sao sách
│   ├── usersService.ts           # Thông tin người dùng
│   ├── authorsService.ts         # Danh sách tác giả
│   ├── categoriesService.ts      # Danh mục sách
│   ├── publishersService.ts      # Nhà xuất bản
│   └── tagsService.ts            # Tags / nhãn sách
│
├── components/
│   ├── public_pages/             # Layout dùng chung cho trang public
│   │   ├── Layout.tsx            # Layout chính (Header + Footer + Navbar)
│   │   ├── Header.tsx            # Header public
│   │   └── ErrorLayout.tsx       # Layout trang lỗi
│   ├── user_pages/               # Layout cho trang sinh viên
│   │   ├── Sidebar.tsx           # Sidebar + ProtectedLayout cho sinh viên
│   │   ├── Header.tsx            # Header sinh viên
│   │   └── ui/                   # UI components tái sử dụng
│   ├── librarian_pages/          # Layout cho trang thủ thư
│   │   ├── LibrarianLayout.tsx   # Layout wrapper thủ thư
│   │   └── Sidebar.tsx           # Sidebar thủ thư
│   ├── ScrollToTop.tsx           # Reset scroll khi chuyển trang
│   └── ui.tsx                    # Shared UI components (Button, Modal, ...)
│
├── contexts/
│   └── AuthContext.tsx            # Auth state global (login, logout, socialLogin)
│
├── pages/
│   ├── public_pages/             # Trang công khai (không cần đăng nhập)
│   │   ├── HomePage.tsx          # Trang chủ
│   │   ├── SearchPage.tsx        # Tìm kiếm sách
│   │   ├── BookDetailPage.tsx    # Chi tiết sách
│   │   ├── CategoriesPage.tsx    # Danh mục sách
│   │   ├── LoginPage.tsx         # Đăng nhập
│   │   ├── RegisterPage.tsx      # Đăng ký
│   │   ├── OAuth2CallbackPage.tsx# Xử lý callback Google OAuth2
│   │   ├── AboutPage.tsx         # Giới thiệu
│   │   ├── ContactPage.tsx       # Liên hệ
│   │   ├── FAQPage.tsx           # Câu hỏi thường gặp
│   │   ├── UserGuidePage.tsx     # Hướng dẫn sử dụng
│   │   ├── TermsPage.tsx         # Điều khoản dịch vụ
│   │   ├── PrivacyPolicyPage.tsx # Chính sách bảo mật
│   │   ├── ServiceTermsPage.tsx  # Điều khoản sử dụng dịch vụ
│   │   └── CookiePolicyPage.tsx  # Chính sách Cookie
│   │
│   ├── user_pages/               # Trang dành cho sinh viên (cần đăng nhập)
│   │   ├── DashboardPage.tsx     # Tổng quan tài khoản
│   │   ├── MyBooksPage.tsx       # Sách đang mượn
│   │   ├── ReservationsPage.tsx  # Sách đặt trước
│   │   ├── FinesPage.tsx         # Phí phạt
│   │   ├── WishlistPage.tsx      # Danh sách yêu thích
│   │   ├── ProfilePage.tsx       # Hồ sơ cá nhân
│   │   ├── SettingsPage.tsx      # Cài đặt tài khoản
│   │   ├── NotificationsPage.tsx # Thông báo
│   │   └── SearchPage.tsx        # Tìm kiếm (trong khu vực sinh viên)
│   │
│   ├── librarian_pages/          # Trang dành cho thủ thư (cần đăng nhập)
│   │   ├── Dashboard.tsx         # Tổng quan hệ thống
│   │   ├── BookList.tsx          # Danh sách đầu sách
│   │   ├── BookDetails.tsx       # Chi tiết đầu sách
│   │   ├── CopyList.tsx          # Danh sách bản sao
│   │   ├── CopyDetails.tsx       # Chi tiết bản sao
│   │   ├── Circulation.tsx       # Nghiệp vụ lưu thông (mượn/trả/gia hạn)
│   │   ├── TransactionList.tsx   # Lịch sử giao dịch và tác vụ cần xử lý
│   │   ├── Requests.tsx          # Alias sang lịch sử giao dịch
│   │   └── Settings.tsx          # Cài đặt hệ thống
│   │
│   └── error_pages/              # Trang lỗi
│       ├── NotFoundPage.tsx      # 404
│       ├── ForbiddenPage.tsx     # 403
│       └── MaintenancePage.tsx   # 500 / Bảo trì
│
├── App.tsx                       # Root component, cấu hình routing
├── index.tsx                     # Entry point
├── types.ts                      # TypeScript interfaces dùng chung
├── constants.ts                  # Dữ liệu tĩnh / mock data
├── vite.config.ts                # Cấu hình Vite
├── tsconfig.json                 # Cấu hình TypeScript
├── .env.example                  # Mẫu biến môi trường
└── index.html                    # HTML template
```

---

## 🗺️ Routing

Ứng dụng sử dụng **HashRouter** (URL dạng `/#/...`) để tương thích với các môi trường hosting tĩnh.

| Tiền tố | Mô tả |
|---------|-------|
| `/#/publicpage/...` | Trang công khai |
| `/#/userpage/...` | Khu vực sinh viên (cần đăng nhập) |
| `/#/librarianpage/...` | Khu vực thủ thư (cần đăng nhập) |
| `/oauth2/callback` | Xử lý OAuth2 callback (không qua HashRouter) |

### Trang công khai (`/publicpage`)

| Route | Trang |
|-------|-------|
| `/publicpage` | Trang chủ |
| `/publicpage/search` | Tìm kiếm sách |
| `/publicpage/book/:id` | Chi tiết sách |
| `/publicpage/categories` | Danh mục |
| `/publicpage/login` | Đăng nhập |
| `/publicpage/register` | Đăng ký |
| `/publicpage/about` | Giới thiệu |
| `/publicpage/guide` | Hướng dẫn |
| `/publicpage/faq` | FAQ |
| `/publicpage/contact` | Liên hệ |
| `/publicpage/terms` | Điều khoản |
| `/publicpage/privacy-policy` | Chính sách bảo mật |
| `/publicpage/service-terms` | Điều khoản dịch vụ |
| `/publicpage/cookie-policy` | Chính sách Cookie |

### Khu vực sinh viên (`/userpage`) — yêu cầu đăng nhập

| Route | Trang |
|-------|-------|
| `/userpage/dashboard` | Tổng quan |
| `/userpage/search` | Tìm kiếm |
| `/userpage/book/:id` | Chi tiết sách |
| `/userpage/my-books` | Sách đang mượn |
| `/userpage/reservations` | Đặt trước |
| `/userpage/fines` | Phí phạt |
| `/userpage/wishlist` | Yêu thích |
| `/userpage/profile` | Hồ sơ |
| `/userpage/settings` | Cài đặt |
| `/userpage/notifications` | Thông báo |

### Khu vực thủ thư (`/librarianpage`) — yêu cầu đăng nhập với vai trò `librarian`

| Route | Trang |
|-------|-------|
| `/librarianpage/dashboard` | Tổng quan hệ thống |
| `/librarianpage/books` | Quản lý đầu sách |
| `/librarianpage/books/:id` | Chi tiết đầu sách |
| `/librarianpage/copies` | Quản lý bản sao |
| `/librarianpage/copies/:id` | Chi tiết bản sao |
| `/librarianpage/circulation` | Lưu thông (mượn/trả/gia hạn) |
| `/librarianpage/transactions` | Lịch sử giao dịch và tác vụ cần xử lý |
| `/librarianpage/requests` | Chuyển sang lịch sử giao dịch |
| `/librarianpage/settings` | Cài đặt |

---

## 🔐 Xác thực (Authentication)

Hệ thống sử dụng **JWT (Access Token + Refresh Token)**:

- **Access Token** được lưu trong `localStorage` và tự động đính kèm vào header `Authorization: Bearer <token>` cho mọi request.
- **Refresh Token** được sử dụng để tự động làm mới Access Token khi hết hạn (logic trong `axiosInstance.ts`).
- Khi cả hai token hết hạn, người dùng sẽ bị tự động chuyển về trang đăng nhập.
- Khi đăng xuất, Refresh Token được gửi lên backend để **blacklist**, đảm bảo token cũ không thể tái sử dụng.

### Đăng nhập thông thường

```
POST /auth/login  →  { accessToken, refreshToken }
```

### Đăng nhập qua Google OAuth2

1. Người dùng click "Đăng nhập với Google"
2. Google redirect về `/oauth2/callback?code=...`
3. Frontend gửi `code` lên backend: `POST /auth/social-login/callback?registrationId=google&code=...`
4. Backend trả về `{ accessToken, refreshToken }`

### Phân quyền

JWT payload chứa trường `scope`. Nếu `scope` bao gồm chuỗi `LIBRARIAN`, người dùng được gán vai trò `librarian`; ngược lại là `student`.

```
student    →  Truy cập /userpage/*
librarian  →  Truy cập /librarianpage/*
```

---

## 🌐 API Layer

File `api/axiosInstance.ts` cấu hình Axios với các tính năng:

- ✅ **Base URL** từ `VITE_API_BASE_URL`
- ✅ **Timeout** từ `VITE_API_TIMEOUT`
- ✅ **Auto-attach Bearer token** trong request interceptor
- ✅ **Auto token refresh** khi nhận lỗi 401 (queue các request thất bại trong lúc refresh)
- ✅ **ngrok bypass header** (`ngrok-skip-browser-warning`) cho môi trường dev tunnel
- ✅ **Dev logging** (request & response log trong môi trường development)

---

## 👥 Vai trò người dùng

| Vai trò | Mô tả |
|---------|-------|
| **Guest** | Duyệt sách, tìm kiếm, xem chi tiết mà không cần đăng nhập |
| **Student** | Mượn sách, đặt trước, xem lịch sử, thanh toán phí phạt |
| **Librarian** | Quản lý sách, bản sao, lưu thông, xét duyệt yêu cầu |

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo nhánh mới: `git checkout -b feature/ten-tinh-nang`
3. Commit thay đổi: `git commit -m "feat: mô tả ngắn"`
4. Push lên nhánh: `git push origin feature/ten-tinh-nang`
5. Mở Pull Request

---

## 📄 License

Dự án nội bộ — Chưa có license công khai.
