# 🏮 Akatsuki’s Draft — AI-Enabled Content Sharing Platform Backend

A secure, production-grade RESTful API backend for **Akatsuki's Draft**, an enterprise-ready content creation, editorial workflow, and sharing platform built for the **Nodevember 4.0** specifications.

---

## 🌟 Key Highlights & Architectural Features

- **🔐 Dual-Layer Authentication & Authorization**:
  - Secure stateless JWT authentication with bcrypt password hashing (cost factor 10).
  - Strict role-based access control (`user` vs `admin`).
  - Automatic role-escalation prevention during registration and updates.
  - Dedicated administrative seed CLI script (`npm run seed:admin`) eliminating public admin sign-up attack surfaces.

- **📝 Content & Approval Workflow Lifecycle**:
  - Full CRUD operations with resource ownership enforcement.
  - Status progression: `draft` ➡️ `pending` ➡️ `approved` / `rejected`.
  - Public visibility firewall: only `approved` posts are accessible via public endpoints; private drafts and pending submissions are strictly isolated to their author.
  - Re-approval security: modifying an approved or rejected post automatically revokes its public status, transitioning it back to `draft`/`pending` for fresh administrative review.

- **🤖 OpenRouter AI Content Polishing & Versioning**:
  - AI editorial integration using configurable models (e.g. `google/gemini-2.0-flash-001`, `openai/gpt-4o-mini`).
  - **Preserved Originality**: AI-improved versions are persisted as brand new post drafts with distinct MongoDB IDs, referencing their origin (`improvedFrom`), leaving original content completely intact.
  - **Prompt Injection Defense**: Untrusted user text is enclosed within structured delimiters and strictly constrained with system prompt rules against prompt-hacking and model override instructions.

- **☁️ Cloudinary Media Pipeline**:
  - Direct memory buffer streaming through Multer (`memoryStorage`).
  - Strict MIME validation (JPEG, PNG, WebP) and 5MB size enforcement.
  - Unique asset identifiers and storage of both `secure_url` and `public_id`.
  - Safe replacement & garbage collection: previous assets are purged only after new uploads succeed; failures never corrupt post records.
  - Modular document upload route (`/api/upload/document`) prepared for Gemini/external document processing.

- **🛡️ Hardened Security Standard**:
  - **Helmet** for HTTP security headers.
  - **CORS** origin restriction.
  - Tiered **express-rate-limit** protection (general traffic, auth brute-force prevention, AI rate limiting, and media upload capping).
  - **express-validator** for request payload sanitization.
  - Dynamic startup environment validation stopping insecure deployments.

- **🧪 Self-Contained Automated Testing Suite**:
  - Built with **Jest** and **Supertest** running in native ES Module mode.
  - Embedded **mongodb-memory-server** providing 100% isolated, zero-external-dependency test execution with 36 passing test cases across 5 test suites.

---

## 📁 Project Architecture

```
server/
├── config/
│   ├── cloudinary.js           # Cloudinary SDK config
│   ├── db.js                   # Mongoose connection
│   └── env.js                  # Environment variables config
├── controller/
│   ├── admin.controller.js     # Pending reviews, approvals, and rejections
│   ├── ai.controller.js        # AI content improvement handler
│   ├── auth.controller.js      # Register, login, profile
│   ├── post.controller.js      # Post CRUD and submission
│   └── upload.controller.js    # Upload handlers
├── middleware/
│   ├── admin.middleware.js     # Admin role check
│   ├── auth.middleware.js      # JWT authentication check
│   ├── error.middleware.js     # Error handlers
│   └── multer.middleware.js    # File upload middleware (Multer)
├── model/
│   ├── auth.model.js           # Re-exports User model
│   ├── post.model.js           # Post schema
│   └── user.model.js           # User schema
├── routes/
│   ├── admin.routes.js         # /api/admin
│   ├── ai.routes.js            # /api/ai
│   ├── auth.routes.js          # /api/auth
│   ├── post.routes.js          # /api/posts
│   └── upload.routes.js        # /api/upload
├── services/
│   ├── cloudinary.service.js   # Cloudinary image upload & delete
│   └── openrouter.service.js   # OpenRouter AI completion service
├── utils/
│   ├── generateToken.js        # JWT token generator
│   └── seedAdmin.js            # Admin user seed script
├── .env                        # Environment variables
├── index.js                    # Main application entry point & Express server
├── package.json
└── package-lock.json
├── .env.example                    # Detailed environment template
├── .gitignore                      # Git exclusion rules
├── package.json                    # Project dependencies & scripts
├── thunder-collection.json         # Thunder Client API collection
├── postman_collection.json         # Postman collection (v2.1)
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (Node.js v20+ or v24 recommended)
- **MongoDB**: Local MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Cloudinary Account**: Free account at [cloudinary.com](https://cloudinary.com)
- **OpenRouter Account**: API key from [openrouter.ai](https://openrouter.ai)

### 2. Installation
Navigate into the `server/` directory and install dependencies:
```bash
cd server
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your credentials:
```ini
PORT=5000
NODE_ENV=development

# MongoDB URI (Atlas or Local)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/akatsuki_draft?retryWrites=true&w=majority

# JWT Secret (minimum 32 characters)
JWT_SECRET=akatsuki_super_secret_jwt_production_ready_key_12345
JWT_EXPIRES_IN=1d

# Frontend CORS
CLIENT_URL=http://localhost:5173

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# Initial Administrator Seed
ADMIN_NAME=Akatsuki Leader
ADMIN_EMAIL=admin@akatsukidraft.com
ADMIN_PASSWORD=AdminMasterPassword@123!
```

### 4. Seed the Initial Administrator
Run the secure administrator seed script:
```bash
npm run seed:admin
```
This script checks if the configured admin exists and idempotently creates or promotes them without exposing any public registration endpoints.

### 5. Start Development Server
```bash
npm run dev
```
The API server will listen at `http://localhost:5000`.

---

## 🧪 Automated Testing Suite

The backend includes a comprehensive, automated test suite utilizing **Jest**, **Supertest**, and **mongodb-memory-server**. Tests run against an isolated in-memory database and mock external services, executing without requiring a live cloud connection.

Run all tests:
```bash
npm test
```

Run test suite with code coverage:
```bash
npm run test:coverage
```

### Test Coverage Highlights
- ✅ **Authentication**: Registration, email uniqueness, duplicate detection, password hashing, JWT signing/expiry, role escalation blocking.
- ✅ **Post Management**: Post creation, draft saving, ownership enforcement, public restriction (404 on unapproved), edit re-approval triggers, deletion.
- ✅ **Admin Moderation**: Role authorization barriers (403 for users), pending queue, approval workflow, rejection feedback.
- ✅ **AI Content Improvement**: OpenRouter API communication, JSON structured response validation, separate draft persistence (`versionType: 'ai_improved'`), source document immutability, upstream timeout/error handling (502).
- ✅ **Upload Services**: Multer file size capping (5MB), MIME type whitelist (JPEG/PNG/WebP), document validation.

---

## 📡 API Reference

### Response Standard

#### Success Response (200 / 201)
```json
{
  "success": true,
  "message": "Resource processed successfully",
  "data": { ... }
}
```

#### Error Response (400 / 401 / 403 / 404 / 409 / 413 / 429 / 500 / 502)
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

### Endpoint Catalog

| Method | Endpoint | Access | Rate Limit | Description |
|---|---|---|---|---|
| **GET** | `/api/health` | Public | General | System health check and uptime monitor |
| **POST** | `/api/auth/register` | Public | 15 req / 15m | Register a new user account |
| **POST** | `/api/auth/login` | Public | 15 req / 15m | Log in and receive a JWT Bearer token |
| **GET** | `/api/auth/me` | Authenticated | General | Retrieve current authenticated user profile |
| **POST** | `/api/posts` | Authenticated | 30 req / 15m | Create a post or draft (supports multipart upload) |
| **GET** | `/api/posts` | Public | General | List approved posts (paginated, search, category, sort) |
| **GET** | `/api/posts/:id` | Public | General | Retrieve a single approved post (404 if draft/pending) |
| **GET** | `/api/posts/my-posts` | Authenticated | General | List current user's posts (drafts, pending, approved) |
| **PATCH** | `/api/posts/:id` | Owner only | 30 req / 15m | Update post content (editing approved resets to draft) |
| **POST** | `/api/posts/:id/submit`| Owner only | General | Submit a draft post for administrator review |
| **DELETE**| `/api/posts/:id` | Owner/Admin | General | Delete post and destroy associated Cloudinary asset |
| **GET** | `/api/admin/posts/pending` | Admin only | General | List all posts awaiting administrator approval |
| **PATCH** | `/api/admin/posts/approve/:id` | Admin only | General | Approve pending post and make it publicly visible |
| **PATCH** | `/api/admin/posts/reject/:id`  | Admin only | General | Reject pending post with feedback reason |
| **POST** | `/api/ai/improve/:id` | Owner only | 20 req / 1h | Generate AI-improved draft version via OpenRouter |
| **POST** | `/api/upload/image` | Authenticated | 30 req / 15m | Upload image to Cloudinary (returns URL & publicId) |
| **POST** | `/api/upload/document` | Authenticated | 30 req / 15m | Upload & validate document (PDF, DOCX, TXT) |

---

## 🔄 Editorial & Workflow Examples

### 1. Creating and Submitting a Post
```bash
# Step 1: Create a draft post
POST /api/posts
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "title": "Chakra Flow Theory",
  "content": "Chakra flows through eight inner gates...",
  "category": "Technique",
  "status": "draft"
}

# Step 2: Submit draft for review
POST /api/posts/<post_id>/submit
Authorization: Bearer <user_token>
```

### 2. Admin Approving a Post
```bash
# Admin checks pending posts
GET /api/admin/posts/pending
Authorization: Bearer <admin_token>

# Admin approves the post
PATCH /api/admin/posts/approve/<post_id>
Authorization: Bearer <admin_token>
```
Once approved, the post immediately becomes visible at `GET /api/posts/<post_id>` and in the public feed at `GET /api/posts`.

### 3. AI Content Improvement Workflow
```bash
# Author requests AI improvement
POST /api/ai/improve/<post_id>
Authorization: Bearer <user_token>
```
**Outcome**:
- The original post remains 100% unchanged.
- A **new post** document is created with:
  - `versionType: "ai_improved"`
  - `improvedFrom: "<original_post_id>"`
  - `status: "draft"`
  - Polished title, description, content, and category structured by AI.
- The author can review the new draft in `GET /api/posts/my-posts` and submit it for approval when satisfied.

---

## 🛠️ Third-Party Service Setup

### MongoDB Atlas Setup
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a database user with Read/Write privileges.
3. Under **Network Access**, add IP `0.0.0.0/0` (or your server's IP address).
4. Click **Connect** ➡️ **Drivers** and copy the connection string into `MONGODB_URI`.

### Cloudinary Setup
1. Log in to [Cloudinary Console](https://cloudinary.com/console).
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the dashboard.
3. Add them to your `.env` file under `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

### OpenRouter Setup
1. Create an account at [openrouter.ai](https://openrouter.ai).
2. Go to **Keys** (https://openrouter.ai/keys) and generate a new key.
3. Add the key to `OPENROUTER_API_KEY` in `.env`.
4. Set `OPENROUTER_MODEL` to your preferred model (e.g. `google/gemini-2.0-flash-001` or `openai/gpt-4o-mini`).

---

## 📮 API Client Testing (Postman & Thunder Client)

Pre-built collections are included in the repository:
- **Thunder Client (VS Code)**: Import `server/thunder-collection.json` via the Thunder Client extension tab.
- **Postman**: Import `server/postman_collection.json` directly into Postman.

Set the collection variable `baseUrl` to `http://localhost:5000`, register/login to obtain a token, and paste the JWT into the `token` variable.

---

## 📜 License
Developed for the **Nodevember 4.0** Hackathon.
All rights reserved © Akatsuki's Draft.
