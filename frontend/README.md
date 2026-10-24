# WellNest Authentication Frontend

A production-quality, responsive authentication frontend for **WellNest — Smart Health & Fitness Companion**, built with React, Vite, Tailwind CSS, and Axios.

---

## 🌿 Tech Stack

- **React 19** + **Vite** (JavaScript / JSX)
- **React Router v7** for single-page routing & navigation
- **Tailwind CSS v4** with a custom health-tech color palette (forest green, mint, soft sand)
- **Axios** with Bearer interceptors & automatic silent refresh
- **Lucide React** for icons
- **React Hot Toast** for notifications

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── favicon.svg           # WellNest leaf logo favicon
├── src/
│   ├── api/
│   │   ├── axiosInstance.js  # Central Axios instance with in-memory tokens & 401 queue
│   │   └── authApi.js        # Auth API methods matching Spring Boot contracts
│   ├── components/
│   │   ├── AuthLayout.jsx    # Split-screen responsive layout (form + wellness panel)
│   │   ├── FormInput.jsx     # Reusable accessible text input
│   │   ├── PasswordInput.jsx # Password input with show/hide toggle
│   │   ├── OtpInput.jsx      # 6-digit segmented OTP input with paste & arrow navigation
│   │   ├── LoadingScreen.jsx # Branded session-restoring loading animation
│   │   ├── ProtectedRoute.jsx# Auth guard for protected routes
│   │   └── WellnessPanel.jsx # Desktop wellness branding side panel
│   ├── context/
│   │   └── AuthContext.jsx   # In-memory authentication state provider
│   ├── pages/
│   │   ├── Login.jsx         # /login
│   │   ├── Register.jsx      # /register
│   │   ├── VerifyEmail.jsx   # /verify-email (6-digit OTP verification)
│   │   ├── ForgotPassword.jsx# /forgot-password
│   │   ├── ResetPassword.jsx # /reset-password
│   │   └── Dashboard.jsx     # /dashboard (protected welcome view)
│   ├── routes/
│   │   └── AppRoutes.jsx     # Route definitions
│   ├── App.jsx               # Root component with Toast & Router provider
│   ├── index.css             # Tailwind CSS v4 design tokens & custom components
│   └── main.jsx              # DOM entry point
├── .env                      # Local environment configuration
├── .env.example              # Environment variables template
├── index.html                # SEO-optimized HTML template
├── package.json
└── vite.config.js            # Vite configuration with Tailwind CSS plugin
```

---

## 🔒 Security Architecture

1. **In-Memory Access Token Storage**: JWT access tokens are kept strictly in JavaScript memory (`axiosInstance.js`) and are never written to `localStorage`, `sessionStorage`, or cookies via JavaScript.
2. **HTTP-Only Refresh Cookie**: Refresh tokens are handled entirely via secure, HTTP-only cookies (`withCredentials: true`).
3. **Automatic Silent Refresh**: An Axios response interceptor intercepts HTTP 401 on protected requests, triggers `POST /auth/refresh`, queues concurrent requests to avoid race conditions, and retries the original request seamlessly.
4. **No Password/OTP Storage**: Credentials and OTP inputs are never persisted to web storage.

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18 or later
- **npm**: v9 or later
- **Spring Boot Backend**: `Auth-service` running on port 8081

### 2. Environment Setup

Copy `.env.example` to `.env` (already created for local use):

```bash
VITE_AUTH_API_URL=http://localhost:8081
```

### 3. Installation

```bash
npm install
```

### 4. Running the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`.

### 5. Production Build

```bash
npm run build
npm run preview
```

---

## 📡 API Endpoints Mapped

All endpoints strictly match the Spring Boot `AuthController`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user (returns HTTP 202 Accepted) |
| `POST` | `/auth/login` | Login with username (email) & password |
| `POST` | `/auth/refresh` | Exchange HTTP-only refresh cookie for new access token |
| `POST` | `/auth/logout` | Invalidate refresh token and clear cookie |
| `POST` | `/auth/verify-email` | Verify 6-digit OTP for pending registration |
| `POST` | `/auth/resend-verification` | Resend verification OTP |
| `POST` | `/auth/forgot-password` | Request password reset OTP |
| `POST` | `/auth/reset-password` | Reset password using 6-digit OTP |
| `GET`  | `/auth/me` | Fetch authenticated user details (Bearer token) |
