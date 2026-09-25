# User Module

## Tổng Quan

User Module là bounded context chịu trách nhiệm quản lý người dùng, vai trò (roles) và quyền hạn (permissions) trong hệ thống Library Management System. Module này được xây dựng theo Clean Architecture và Domain-Driven Design (DDD).

## Chức Năng Chính

- **User Management**: Tạo, cập nhật, xóa người dùng
- **Role-Based Access Control (RBAC)**: Quản lý vai trò và quyền hạn
- **User Profile**: Quản lý thông tin cá nhân
- **Status Management**: Kích hoạt, tạm khóa, vô hiệu hóa tài khoản
- **AI Personalization**: Cho phép/tắt tính năng cá nhân hóa AI

## Kiến Trúc

### Domain Layer
```
domain/
├── model/
│   ├── UserAggregate.java          # User aggregate root
│   ├── RoleAggregate.java          # Role aggregate root
│   ├── Permission.java             # Permission entity
│   └── UserStatus.java             # User status enum
├── valueobject/
│   ├── UserId.java
│   ├── RoleId.java
│   ├── PermissionId.java
│   ├── Email.java
│   └── UserProfile.java
├── repository/
│   ├── UserRepositoryInterface.java
│   ├── RoleRepository.java
│   └── PermissionRepository.java
├── service/
│   ├── UserDomainService.java
│   └── UserDomainServiceImpl.java
└── specification/
    ├── CanBorrowBooksSpecification.java
    └── IsActiveUserSpecification.java
```

### Application Layer
```
application/
├── dto/
│   ├── request/
│   │   ├── CreateUserRequest.java
│   │   ├── UpdateUserProfileRequest.java
│   │   ├── ChangePasswordRequest.java
│   │   └── AssignRoleRequest.java
│   └── response/
│       ├── UserResponse.java
│       ├── RoleResponse.java
│       └── PermissionResponse.java
├── usecase/
│   ├── CreateUserUseCase.java
│   ├── GetUserByIdUseCase.java
│   ├── UpdateUserProfileUseCase.java
│   └── AssignRoleToUserUseCase.java
└── mapper/
    └── UserMapper.java
```

### Infrastructure Layer
```
infrastructure/
├── persistence/
│   ├── entity/
│   │   ├── UserJpaEntity.java
│   │   ├── RoleJpaEntity.java
│   │   └── PermissionJpaEntity.java
│   └── repository/
│       ├── UserJpaRepository.java
│       ├── RoleJpaRepository.java
│       ├── PermissionJpaRepository.java
│       ├── UserRepositoryImpl.java
│       ├── RoleRepositoryImpl.java
│       └── PermissionRepositoryImpl.java
└── mapper/
    └── UserEntityMapper.java
```

### API Layer
```
api/
├── controller/
│   ├── UserController.java
│   ├── RoleController.java
│   └── PermissionController.java
└── config/
    ├── SecurityConfig.java
    └── UserModuleConfig.java
```

## API Endpoints

### User Management

#### Create User
```http
POST /api/v1/users
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-15",
  "phoneNumber": "+1234567890",
  "address": "123 Main St, City",
  "roleName": "READER"
}
```

#### Get User by ID
```http
GET /api/v1/users/{id}
```

#### Update User Profile
```http
PUT /api/v1/users/{id}/profile
Content-Type: application/json

{
  "fullName": "John Updated Doe",
  "phoneNumber": "+1987654321",
  "address": "456 New St, City",
  "profilePictureUrl": "https://example.com/avatar.jpg"
}
```

#### Assign Role to User
```http
POST /api/v1/users/{userId}/roles/{roleId}
```

#### Activate User
```http
POST /api/v1/users/{id}/activate
```

#### Suspend User
```http
POST /api/v1/users/{id}/suspend
```

#### Deactivate User
```http
POST /api/v1/users/{id}/deactivate
```

### Role Management

#### Get All Roles
```http
GET /api/v1/roles
```

#### Get Role by ID
```http
GET /api/v1/roles/{id}
```

#### Add Permission to Role
```http
POST /api/v1/roles/{roleId}/permissions/{permissionId}
```

### Permission Management

#### Get All Permissions
```http
GET /api/v1/permissions
```

#### Get Permission by ID
```http
GET /api/v1/permissions/{id}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    address VARCHAR(255),
    phone_number VARCHAR(20),
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP,
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Roles & Permissions
- **roles**: Role definitions
- **permissions**: Permission definitions
- **user_roles**: User-Role junction (Many-to-Many)
- **role_permissions**: Role-Permission junction (Many-to-Many)

## Default Roles

### ADMIN
Full system access with all permissions

### LIBRARIAN
- VIEW_USERS
- MANAGE_PUBLICATIONS
- VIEW_PUBLICATIONS
- MANAGE_TRANSACTIONS
- MANAGE_FINES

### READER
- VIEW_PUBLICATIONS
- BORROW_BOOK
- RETURN_BOOK
- RENEW_BOOK
- RESERVE_BOOK
- WRITE_REVIEW
- RATE_BOOK

## Business Rules

1. **Username Uniqueness**: Username must be unique across the system
2. **Email Uniqueness**: Email must be unique across the system
3. **Password Security**: Passwords are hashed using BCrypt
4. **Role Assignment**: Users can have multiple roles
5. **Status Management**:
   - ACTIVE: Normal operation
   - SUSPENDED: Temporarily blocked
   - DEACTIVATED: Permanently disabled
6. **AI Personalization**: Users can opt-in/opt-out of AI features

## Configuration

### Application Properties
```yaml
server:
  port: 8081
  servlet:
    context-path: /user-service

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/library_db
    username: postgres
    password: postgres
```

## Dependencies

- Spring Boot 3.3.5
- Spring Data JPA
- Spring Security
- PostgreSQL
- MapStruct
- Lombok
- Hypersistence Utils (TSID)

## Running the Module

### Prerequisites
- Java 21
- PostgreSQL 15+
- Maven 3.8+

### Build
```bash
mvn clean install
```

### Run
```bash
mvn spring-boot:run
```

### Database Migration
Flyway migrations run automatically on startup.

## Testing

### Unit Tests
```bash
mvn test
```

### Integration Tests
```bash
mvn verify
```

## Future Enhancements

- [ ] JWT Authentication
- [ ] OAuth2/SSO Integration
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] User activity logging
- [ ] Password policy enforcement
- [ ] Account lockout after failed attempts
