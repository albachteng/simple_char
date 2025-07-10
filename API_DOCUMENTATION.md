# Simple Character API Documentation

## Overview

The Simple Character API provides a complete authentication and user management system for the character generator application. Built with Express.js, TypeScript, and PostgreSQL.

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://your-domain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens can be provided via:
- Authorization header: `Authorization: Bearer <token>`
- HTTP-only cookie: `token=<token>`

## Rate Limiting

- Global: 1000 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per 15 minutes per IP

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "timestamp": "2025-07-10T10:22:28.000Z",
  "requestId": "req_1234567890_abc123"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... },
  "timestamp": "2025-07-10T10:22:28.000Z",
  "requestId": "req_1234567890_abc123"
}
```

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-50 chars, alphanumeric + underscore/hyphen)",
  "email": "string (valid email format)",
  "password": "string (8+ chars, mixed case, numbers, symbols)",
  "confirmPassword": "string (optional, must match password)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "created_at": "2025-07-10T10:22:28.000Z",
      "updated_at": "2025-07-10T10:22:28.000Z",
      "last_login": null,
      "is_active": true,
      "is_admin": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
- `409 Conflict`: Email or username already exists

### Login User
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "emailOrUsername": "string (email or username)",
  "password": "string",
  "rememberMe": "boolean (optional, sets HTTP-only cookie)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "is_active": true,
      "is_admin": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `400 Bad Request`: Missing credentials
- `401 Unauthorized`: Invalid credentials or account deactivated

### Logout User
**POST** `/auth/logout`

Clear authentication cookie (if using cookie authentication).

**Headers:** Authorization token (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get Current User
**GET** `/auth/me`

Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>` (required)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "created_at": "2025-07-10T10:22:28.000Z",
      "updated_at": "2025-07-10T10:22:28.000Z",
      "last_login": "2025-07-10T10:22:28.000Z",
      "is_active": true,
      "is_admin": false
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: No token or invalid token

### Refresh Token
**POST** `/auth/refresh`

Get a new JWT token using current token.

**Headers:** `Authorization: Bearer <token>` (required)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refreshed successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Unable to refresh token

### Change Password
**POST** `/auth/change-password`

Change user password.

**Headers:** `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (8+ chars, mixed case, numbers, symbols)",
  "confirmNewPassword": "string (optional, must match newPassword)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed or incorrect current password
- `401 Unauthorized`: Authentication required

## Admin Endpoints

All admin endpoints require authentication and admin privileges.

### Get User Statistics
**GET** `/admin/stats`

Get user statistics for admin dashboard.

**Headers:** `Authorization: Bearer <token>` (required, admin only)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "activeUsers": 90,
    "adminUsers": 5,
    "recentRegistrations": 10
  }
}
```

### Search Users
**GET** `/admin/users/search`

Search users by username or email.

**Headers:** `Authorization: Bearer <token>` (required, admin only)

**Query Parameters:**
- `q`: Search query (required, 1-100 chars)
- `limit`: Results per page (optional, 1-100, default: 20)
- `offset`: Results offset (optional, ≥0, default: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com",
        "created_at": "2025-07-10T10:22:28.000Z",
        "last_login": "2025-07-10T10:22:28.000Z",
        "is_active": true,
        "is_admin": false
      }
    ],
    "query": "test",
    "limit": 20,
    "offset": 0
  }
}
```

### Get User by ID
**GET** `/admin/users/:userId`

Get user details by ID.

**Headers:** `Authorization: Bearer <token>` (required, admin only)

**Parameters:**
- `userId`: User ID (required, positive integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "created_at": "2025-07-10T10:22:28.000Z",
      "updated_at": "2025-07-10T10:22:28.000Z",
      "last_login": "2025-07-10T10:22:28.000Z",
      "is_active": true,
      "is_admin": false
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: User not found

### Promote User to Admin
**POST** `/admin/users/:userId/promote`

Promote user to admin privileges.

**Headers:** `Authorization: Bearer <token>` (required, admin only)

**Parameters:**
- `userId`: User ID (required, positive integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User promoted to admin successfully"
}
```

**Error Responses:**
- `400 Bad Request`: User already admin
- `404 Not Found`: User not found

### Deactivate User
**POST** `/admin/users/:userId/deactivate`

Deactivate user account.

**Headers:** `Authorization: Bearer <token>` (required, admin only)

**Parameters:**
- `userId`: User ID (required, positive integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: User already deactivated or trying to deactivate self
- `404 Not Found`: User not found

### Reactivate User
**POST** `/admin/users/:userId/reactivate`

Reactivate user account.

**Headers:** `Authorization: Bearer <token>` (required, admin only)

**Parameters:**
- `userId`: User ID (required, positive integer)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User reactivated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: User already active
- `404 Not Found`: User not found

## Health Check

### Server Health
**GET** `/health`

Check server health and status.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-07-10T10:22:28.000Z",
  "version": "1.0.0",
  "uptime": 3600.5,
  "memory": {
    "rss": 52428800,
    "heapTotal": 29360128,
    "heapUsed": 18874344,
    "external": 1089024,
    "arrayBuffers": 35832
  },
  "env": "development"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `MISSING_FIELDS` | Required fields missing |
| `PASSWORD_MISMATCH` | Passwords don't match |
| `CONFLICT` | Resource already exists |
| `MISSING_CREDENTIALS` | Login credentials missing |
| `INVALID_CREDENTIALS` | Invalid login credentials |
| `NO_TOKEN` | Authentication token missing |
| `INVALID_TOKEN` | Authentication token invalid |
| `TOKEN_EXPIRED` | Authentication token expired |
| `NO_AUTH` | Authentication required |
| `INSUFFICIENT_PRIVILEGES` | Admin privileges required |
| `ACCESS_DENIED` | Access denied |
| `MISSING_USER_ID` | User ID parameter missing |
| `INVALID_USER_ID` | User ID format invalid |
| `USER_NOT_FOUND` | User not found |
| `ALREADY_ADMIN` | User already has admin privileges |
| `ALREADY_ACTIVE` | User account already active |
| `ALREADY_DEACTIVATED` | User account already deactivated |
| `SELF_DEACTIVATION` | Cannot deactivate own account |
| `RATE_LIMITED` | Too many requests |
| `AUTH_RATE_LIMITED` | Too many auth requests |
| `TIMEOUT` | Request timeout |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Internal server error |

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not in common weak passwords list

### JWT Security
- Configurable expiration (default: 7 days)
- Secure token generation
- Token refresh capability
- Proper payload structure (no sensitive data)

### Rate Limiting
- Global rate limiting for all endpoints
- Stricter limits for authentication endpoints
- IP-based tracking
- Retry-After headers for rate limited responses

### Input Validation
- Email format validation
- Username character restrictions
- Request size limits
- SQL injection prevention
- XSS protection

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=simple_char
   DATABASE_USER=simple_char_user
   DATABASE_PASSWORD=your_password
   JWT_SECRET=your-very-secure-jwt-secret
   NODE_ENV=development
   ```

3. **Run Database Migrations**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run server:dev
   ```

## Production Deployment

1. **Set Production Environment Variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-production-secret
   DATABASE_URL=postgresql://user:password@host:port/database
   PORT=3001
   ```

2. **Build and Start**
   ```bash
   npm run build
   npm start
   ```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test files
npm test -- src/test/repositories/UserRepository.test.ts
```

Test coverage includes:
- Unit tests for all repositories and services
- Integration tests for complete authentication flows
- Security tests for password validation and JWT handling
- Middleware tests for authentication and authorization