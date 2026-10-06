# Auth · Login & Protect with Supabase Auth & Express

> **FlyRank Internship · Backend Track · Week 2 · Assignment A4**  
> Build a secure API that handles user authentication — Sign Up, Log In, Log Out — and protects specific routes using Supabase Auth as the Identity Provider, JWT verification middleware, and Swagger UI bearer documentation.

---

## 📌 The Big Idea: The Auth Trust Triangle

In real-world backend engineering, **you never roll your own cryptography or password hashing**. Rolling your own auth is how security incidents happen. Instead, your backend relies on a trusted **Identity Provider (IdP)** — Supabase:

```
    [ Client / Frontend ]
          /        \
 (1) Credentials     (3) Request with
   (Signup/Login)       Authorization: Bearer <JWT>
        /            \
       v              v
[ Supabase Auth ] <-- (4) Token Verification -- [ Your Backend Server ]
  (Stores users,          (supabase.auth.getUser)     (Guards protected
   hashes passwords,                                   routes via middleware)
   signs JWTs)
```

1. **Sign Up / Log In**: Client sends credentials (`email` + `password`) to the auth endpoints.
2. **The Token**: Supabase verifies credentials, hashes passwords with bcrypt, and issues a cryptographically signed JSON Web Token (JWT).
3. **The Request**: The client calls your backend, attaching the JWT in the standard `Authorization: Bearer <token>` HTTP header.
4. **Verification**: Your backend's reusable middleware guard asks Supabase: *"Is this token authentic, unexpired, and untampered?"* If yes, the door opens; if not, an immediate HTTP 401 Unauthorized is returned.

---

## 🚀 Quickstart: One Command to Run

### 1. Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm

### 2. Environment Configuration
Clone the repository and create your local `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-key-here
PORT=3000
```

> [!IMPORTANT]
> - Always use the **anon key** (public client key). **Never use the `service_role` key** in your application code, as it bypasses Row Level Security and all auth safeguards.
> - If you run without external Supabase credentials or with placeholder values, the built-in mock Identity Provider automatically activates, allowing immediate offline testing and peer review with 0 configuration.

### 3. Install & Start

```bash
npm install && npm start
```

The server boots at `http://localhost:3000`, and interactive Swagger UI is served at `http://localhost:3000/docs`.

---

## 📸 Swagger UI with Bearer Authentication

Interactive documentation with the OpenAPI 3.0 **Authorize [🔒]** padlock is available at `http://localhost:3000/docs`:

![Swagger UI with Bearer Padlock](screenshots/swagger-auth.png)

### Testing via Swagger in 30 Seconds:
1. Open `http://localhost:3000/docs` in your browser.
2. Execute `POST /auth/signup` to register a new user.
3. Execute `POST /auth/login` and copy the returned `access_token`.
4. Click the green **Authorize [🔒]** button at the top right, paste your token, and click **Authorize**.
5. Execute `GET /protected/profile` and `GET /protected/dashboard` — notice they execute seamlessly with your authorized session!

---

## 🔌 API Reference Table

| Method | Endpoint | Auth Required | Description | Status Codes |
|---|---|---|---|---|
| `GET` | `/public/info` | **None** (Public) | Public welcome endpoint; accessible without tokens | `200` |
| `POST` | `/auth/signup` | **None** (Open) | Register a new account with email & password | `201`, `400` |
| `POST` | `/auth/login` | **None** (Open) | Authenticate user; returns JWT `access_token` and `refresh_token` | `200`, `400`, `401` |
| `POST` | `/auth/logout` | **Bearer JWT** | Invalidate active session and sign out | `204`, `401` |
| `GET` | `/protected/profile`| **Bearer JWT** | Read authenticated user ID, email, and metadata | `200`, `401` |
| `GET` | `/protected/dashboard`| **Bearer JWT** | Second protected route proving middleware guard reuse | `200`, `401` |
| `GET` | `/docs` | **None** (Public) | Interactive Swagger UI API documentation | `200` |

---

## 🧪 Terminal Verification via `curl -i`

### 1. Public Info (`GET /public/info` -> 200 OK)
```bash
$ curl -i http://localhost:3000/public/info
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"message":"Welcome stranger! This info is public."}
```

### 2. User Sign Up (`POST /auth/signup` -> 201 Created)
```bash
$ curl -i -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@flyrank.com","password":"SuperSecretPassword123!"}'

HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"message":"User registered successfully","user":{"id":"550e8400-e29b-41d4-a716-446655440000","email":"engineer@flyrank.com"}}
```

### 3. Missing Password Validation (`POST /auth/signup` -> 400 Bad Request)
```bash
$ curl -i -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@flyrank.com"}'

HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"error":"Email and password are required"}
```

### 4. User Login (`POST /auth/login` -> 200 OK)
```bash
$ curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@flyrank.com","password":"SuperSecretPassword123!"}'

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "message":"Login successful",
  "access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token":"d290f1ee6c...",
  "token_type":"bearer",
  "expires_in":3600
}
```

### 5. Access Protected Profile Without Token (`GET /protected/profile` -> 401 Unauthorized)
```bash
$ curl -i http://localhost:3000/protected/profile
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8

{"error":"Access token required"}
```

### 6. Access Protected Profile with Valid Bearer Token (`GET /protected/profile` -> 200 OK)
```bash
$ curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":"550e8400-e29b-41d4-a716-446655440000","email":"engineer@flyrank.com","created_at":"2026-10-06T08:45:00.000Z"}
```

### 7. Tampered Token Rejection (Stage 3 Checkpoint: Change 1 Character -> 401)
```bash
$ curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_TAMPERED"

HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8

{"error":"Invalid or expired token"}
```

### 8. Protected Logout (`POST /auth/logout` -> 204 No Content)
```bash
$ curl -i -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

HTTP/1.1 204 No Content
```

---

## 🛡️ Architecture: The Reusable Middleware Guard (`authMiddleware.js`)

Copy-pasting token validation across routes is error-prone. Our application isolates verification logic into a single reusable Express middleware function:

```javascript
// authMiddleware.js
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

Any new route in the application can be guarded simply by passing `requireAuth`:
```javascript
app.get('/protected/dashboard', requireAuth, (req, res) => { ... });
app.get('/protected/billing', requireAuth, (req, res) => { ... });
```

---

## 🤖 Stage 7: The AI Rematch ("AI vs Me")

In Stage 7, we asked an AI to generate the complete authentication server in quarantine (`ai-version/`) and performed a rigorous line-by-line code review (`git diff --no-index index.js ai-version/server.js`).

### 1. The Prompt Given to the AI
See [`ai-version/prompt.txt`](./ai-version/prompt.txt) for the full text.

### 2. Three Critical Questions Answered

#### Q1: How did it handle token extraction — did it correctly parse the "Bearer " prefix, or would `Authorization: <token>` slip through or crash?
- **AI Implementation**: `const token = auth.replace('Bearer ', '');`
- **Flaw Found**: If a client sends an malformed header like `Authorization: my_raw_token` without the standard `Bearer ` prefix, `.replace()` fails to strip anything and silently passes the raw string to Supabase rather than returning HTTP 401. Furthermore, if `auth` is just the string `'Bearer '` without a token, it sends an empty string.
- **Our Hand-Built Guard**: Strictly validates `!authHeader.startsWith('Bearer ')`, splits on whitespace, checks `!token.trim()`, and immediately returns HTTP 401 `{ "error": "Access token required" }`.

#### Q2: What security flaws might it have introduced — does it safely reject an invalid token, or trust getUser without checking the error? Did it leak the service_role key or log the token?
- **AI Implementation**: Did not wrap `supabase.auth.getUser(token)` in a `try...catch` block. If the network drops or Supabase returns a 503, unhandled promise rejections cause Express to leak raw stack traces or terminate the process.
- **Our Hand-Built Guard**: Enforces comprehensive `try...catch` isolation and returns sanitized, predictable error JSON (`{ "error": "Invalid or expired token" }`) without exposing internal runtime errors or leaking tokens into logs.

#### Q3: What did your prompt forget to specify — and what did the AI silently decide for you?
- **Omission in Prompt**: We didn't explicitly specify OpenAPI 3.0 schema generation rules or Swagger UI configuration.
- **AI's Silent Decision**: The AI completely ignored Swagger UI and `openapi.json` setup, leaving the API without interactive documentation or Bearer token testing capabilities.

### 3. One Rematch: Improved Prompt & Outcome
- **Improved Prompt**:
  *"Build an Express auth API with Supabase Auth. In the auth middleware, strictly reject headers not beginning with 'Bearer ' with 401. Wrap token verification in try/catch. Serve Swagger UI at /docs with an openapi.json defining BearerAuth securitySchemes."*
- **Outcome Delta**:
  The regenerated AI code adopted defensive `try/catch` wrapping and configured Swagger UI with Bearer authentication, aligning with our production standard.
