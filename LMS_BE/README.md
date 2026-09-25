# SmartLibrary Backend

Backend cho hệ thống quản lý thư viện thông minh, xây dựng bằng Spring Boot 3, Java 21 và PostgreSQL. Dự án tổ chức theo multi-module Maven, tách rõ các bounded context nghiệp vụ và dùng Flyway để quản lý schema database.

## Tính năng chính

- Xác thực, đăng ký, đăng nhập, Google OAuth2, refresh token và phân quyền theo vai trò.
- Quản lý tài khoản người dùng, thủ thư, trạng thái tài khoản và nhật ký kiểm toán.
- Quản lý ấn phẩm, bản sao sách, tác giả, nhà xuất bản, danh mục, tags, ảnh bìa và tài liệu PDF.
- Luồng mượn, trả, đặt trước, xác nhận nhận sách, báo sự cố, ghi chú giao dịch và phí phạt.
- Tích hợp AI Gateway cho semantic search, recommendation và xử lý metadata PDF.
- Tích hợp PayOS cho thanh toán phí phạt.
- OpenAPI/Swagger UI phục vụ kiểm thử và báo cáo API.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Runtime | Java 21 |
| Framework | Spring Boot 3.3.5 |
| Build | Maven multi-module |
| Database | PostgreSQL 15 + pgvector |
| Migration | Flyway |
| Security | Spring Security, JWT, OAuth2 Client |
| Persistence | Spring Data JPA, Hibernate |
| API Docs | Springdoc OpenAPI |
| Messaging | Kafka |
| Testing | JUnit 5, Mockito, Spring Boot Test, Testcontainers |

## Cấu trúc module

```text
LMS_BE/
├── library-bootstrap/          # Ứng dụng Spring Boot chính, cấu hình và Flyway migrations
├── library-shared/             # Base entity, exception, response, shared service
├── library-auth-module/        # Authentication, authorization, JWT, OAuth2, audit filter
├── library-user-module/        # User, role, permission, admin/librarian account management
├── library-catalog-module/     # Publication, item/copy, author, category, publisher, tag
├── library-circulation-module/ # Borrow/return/reservation/fine/policy/transaction notes
└── library-recommendation-module/ # Rating, review and recommendation-facing contracts
```

## Yêu cầu hệ thống

- Java 21
- Maven 3.8+
- Docker Desktop hoặc PostgreSQL 15+ cài sẵn
- AI service chạy tại `http://localhost:8001` nếu muốn dùng search/recommendation/AI processing
- Frontend chạy tại `http://localhost:3000` để test OAuth2 callback và CORS

## Cài đặt

```bash
git clone <repository-url>
cd LMS_BE
cp .env.example .env
```

Chỉnh các biến trong `.env` theo môi trường local:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/library
DATABASE_USERNAME=library
DATABASE_PASSWORD=library

FRONTEND_URL=http://localhost:3000
BASE_URL_WEBSITE=http://localhost:8080

AI_GATEWAY_BASE_URL=http://localhost:8001
AI_CALLBACK_SECRET=change-this-to-the-same-long-random-secret-as-backend-webhook-secret
```

Không commit file `.env` thật vì có secret OAuth2, mail, AWS và PayOS.

## Chạy database và Kafka

```bash
docker compose up -d
```

Compose mặc định tạo:

- PostgreSQL: `localhost:5432`, database/user/password là `library`
- Kafka: `localhost:9092`

Flyway sẽ tự chạy migrations trong `library-bootstrap/src/main/resources/db/migration` khi backend khởi động.

## Chạy backend

```bash
mvn clean install
mvn -pl library-bootstrap spring-boot:run
```

API chạy mặc định tại:

- Base URL: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Kiểm thử

Chạy toàn bộ test:

```bash
mvn test
```

Chạy test của một module:

```bash
mvn -pl library-circulation-module test
```

Build toàn bộ project và bỏ qua test khi cần kiểm tra compile nhanh:

```bash
mvn clean install -DskipTests
```

## Tích hợp AI

Backend gọi AI Gateway qua `AI_GATEWAY_BASE_URL` để:

- Tìm kiếm ngữ nghĩa theo nội dung sách.
- Gợi ý sách cá nhân hóa.
- Kích hoạt xử lý PDF và nhận callback cập nhật metadata.

Khi AI chạy trong Docker, tránh dùng `localhost` cho webhook callback về backend nếu container không nhìn thấy host. Dùng `host.docker.internal` hoặc IP LAN phù hợp.

## Ghi chú triển khai

- Schema do Flyway quản lý, `spring.jpa.hibernate.ddl-auto=validate`.
- Không chạy `flyway clean` trong môi trường có dữ liệu thật.
- JWT key nằm trong classpath `certs/privateKey.pem` và `certs/publicKey.pem`.
- Các secret OAuth2, AWS, mail và PayOS phải cấu hình qua biến môi trường.
