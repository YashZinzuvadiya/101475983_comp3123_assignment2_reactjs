# COMP 3123 – Assignment 2: Full Stack Employee Manager (MERN)

Student: 101475983

A secure MERN app. Users sign up, log in (JWT) and manage **their own** employees, with search and profile pictures.

**Stack:** MongoDB + Mongoose, Express, React (Vite), Node.
Backend: JWT, bcryptjs, Helmet, express-rate-limit, express-validator, Multer, CORS, file logging, `/health`.
Frontend: React 19, react-router-dom, Axios, **Bootstrap 5** (UI), **TanStack Query** (server state) and **TanStack Table** (sorting).
Database: `comp3123_assignment2` (only the backend connects to MongoDB).

## Run with Docker Compose

```bash
docker compose up -d --build
```

| Service | URL |
|---|---|
| Frontend (nginx) | http://localhost:8080 |
| Backend API | http://localhost:3000 (`/health`, `/api/v1/...`) |
| MongoDB | internal only (not published to the host) |

Optional: `JWT_SECRET=<long random string> docker compose up -d --build`. Stop with `docker compose down` (add `-v` to wipe data).

## Run locally (without Docker)

```bash
# backend (needs MongoDB on 127.0.0.1:27017)
cd backend && cp .env.example .env   # set JWT_SECRET
npm install && npm run dev           # http://localhost:3000

# frontend
cd frontend && cp .env.example .env
npm install && npm run dev           # http://localhost:5173
```

## API

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/user/signup` | – | 201 / 400 / 409 |
| POST | `/api/v1/user/login` | – | 200 + JWT, 401 |
| GET | `/api/v1/emp/employees` | JWT | caller's employees |
| GET | `/api/v1/emp/employees/search?q=&department=&position=` | JWT | **new** – partial, case-insensitive, caller's employees only |
| POST | `/api/v1/emp/employees` | JWT | 201 |
| GET / PUT | `/api/v1/emp/employees/{eid}` | JWT | 403 if owned by someone else |
| POST | `/api/v1/emp/employees/{eid}/picture` | JWT | **new** – multipart field `picture` (JPEG/PNG/WEBP/GIF, ≤ 2 MB) |
| DELETE | `/api/v1/emp/employees?eid=` | JWT | 204 (also removes the picture file) |
| GET | `/health`, `/uploads/<file>` | – | health check; static pictures |

Errors always look like `{ "status": "error", "message": "...", "errors": [...]? }`.

## How it works (evaluation notes)

- **Frontend ↔ backend:** the browser calls the API through one Axios instance (`frontend/src/api/client.js`); the base URL comes from `VITE_API_URL`, baked in at build time. The frontend never talks to MongoDB.
- **JWT & token storage:** login returns a signed JWT (`sub` = user id, 1 h). The frontend keeps it in `localStorage` and an Axios request interceptor adds `Authorization: Bearer <token>`. Trade-off: localStorage is readable by injected JS (XSS); an httpOnly cookie would avoid that but needs CSRF protection. Helmet's CSP and React's output escaping reduce XSS risk.
- **Protected routes:** `ProtectedRoute` wraps all `/employees*` routes and redirects to `/login` when there is no token (remembering the target page). This is only UX; the real protection is the backend `auth` middleware that verifies the JWT on every employee route.
- **Ownership:** each Employee stores `user`, set from the verified token (`req.user`), never from the request body. List/search always filter by `user`; get/update/delete/upload load the employee and return **403** if its owner differs.
- **Search:** the list page sends `q`, `department`, `position` (debounced 300 ms) to `/employees/search`. TanStack Query refetches because the filters are part of the query key. The server escapes the input before building a case-insensitive regex, so users can't inject regex/operators, and always adds the owner filter.
- **Picture upload:** the browser validates type/size, then sends `multipart/form-data` via `FormData`. Multer stores the file under a random name with an extension derived from the checked MIME type (not the client filename), enforces 2 MB, then the controller verifies ownership, saves the filename in `profile_picture`, and deletes the old file. Pictures are served from `/uploads` (Helmet's `Cross-Origin-Resource-Policy` is set to `cross-origin` so the other origin can show them). Uploads live in a Docker volume.
- **CORS:** the page (`:8080`) and API (`:3000`) are different origins, so browsers block the calls unless the API allows them. The `cors` package only allows origins listed in `CORS_ORIGIN`, the methods used and the `Content-Type`/`Authorization` headers (preflight `OPTIONS` handled). Other origins get no CORS headers.
- **Docker Compose:** `mongo` (healthcheck, named volume) → `backend` (waits for healthy mongo, reaches it at `mongodb://mongo:27017` via compose DNS) → `frontend` (multi-stage build, static files via nginx with SPA fallback).
- **Errors in the UI:** `errorMessage()` converts Axios errors to readable text (validation lists, network down, 429 with retry time). Forms show inline errors plus a banner. A global response interceptor handles **401** on any non-login call: it clears the token and cache, redirects to `/login` with "session expired". **429** shows "Too many requests…" using the `Retry-After` header. 403/404 on an employee page show a clear message.
- **Rate limits:** login/signup 10 per 15 min per IP, other API calls 300 per 15 min (configurable via env).

## Screenshots

`screenshots/` holds one image per feature of the React app (signup, login/logout, list, add with validation and picture, edit, search by department/position, sort, delete, 401 and 429 handling), `screenshots/postman/` the REST API tests, and two MongoDB Compass captures. `101475983_COMP3123_Assignment2_Screenshots.pdf` combines them with captions for the D2L submission.

The Postman collection is in `postman/COMP3123_Assignment2.postman_collection.json` (import it, then run the requests in order; it stores the username, JWT and employee id as collection variables and has `pm.test` assertions).

## Structure

```
docker-compose.yml
backend/   config/ controllers/ middleware/ models/ routes/ utils/ validators/ uploads/ logs/ Dockerfile
frontend/  src/{api,context,components,pages} Dockerfile nginx.conf
```
