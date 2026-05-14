# NaukriBoost — Change Log

All changes made to this repository are tracked here.

---

## 2026-05-11 — Frontend Scaffold (Branch: `feat/naukriboost-webapp`)

### Git
- **Created branch** `feat/naukriboost-webapp` from `main`

### New Directory: `client/`
Scaffolded using `npx create-vite@latest client --template react`

### Dependencies Installed (in `client/`)
- `react` (bundled with Vite template)
- `react-dom` (bundled with Vite template)
- `react-router-dom` — client-side routing

### Files Created

| File | Purpose |
|---|---|
| `client/index.html` | Updated with SEO meta tags, NaukriBoost title |
| `client/src/index.css` | Complete design system — colors, typography, spacing, glassmorphism, buttons, inputs, badges, animations, scrollbar |
| `client/src/main.jsx` | Entry point with BrowserRouter wrapper |
| `client/src/App.jsx` | Root component with React Router (public + protected routes) |

#### Components
| File | Purpose |
|---|---|
| `client/src/components/ProtectedRoute.jsx` | JWT guard — redirects to `/login` if no token |
| `client/src/components/DashboardLayout.jsx` | Sidebar + content wrapper for authenticated pages |
| `client/src/components/DashboardLayout.css` | Sidebar styling, nav items, responsive collapse |

#### Pages
| File | Purpose |
|---|---|
| `client/src/pages/Landing.jsx` | Public landing page — hero, how it works, features, CTA, footer |
| `client/src/pages/Landing.css` | Landing page styles |
| `client/src/pages/Login.jsx` | Login form with mock auth (stores JWT in localStorage) |
| `client/src/pages/Signup.jsx` | Signup form with client-side validation |
| `client/src/pages/Auth.css` | Shared styles for Login + Signup (split layout) |
| `client/src/pages/Dashboard.jsx` | Stats cards, profile status, headline preview, recent activity table |
| `client/src/pages/Dashboard.css` | Dashboard styles |
| `client/src/pages/ActivityLog.jsx` | Filterable run history table with expandable error rows |
| `client/src/pages/ActivityLog.css` | Activity log styles |
| `client/src/pages/Settings.jsx` | Naukri connection, resume upload (drag-drop), schedule toggle, danger zone |
| `client/src/pages/Settings.css` | Settings styles |

### Files Deleted
| File | Reason |
|---|---|
| `client/src/App.css` | Vite default boilerplate — replaced by our design system in `index.css` |

### Files Modified
| File | Change |
|---|---|
| `client/index.html` | Replaced Vite default with NaukriBoost SEO meta tags |
| `client/src/main.jsx` | Added BrowserRouter wrapper |
| `client/src/App.jsx` | Replaced Vite default with React Router setup |
| `client/src/index.css` | Replaced Vite default with full design system |

### Commands Executed
| # | Command | Location | Purpose |
|---|---|---|---|
| 1 | `git checkout -b feat/naukriboost-webapp` | Root | Created feature branch |
| 2 | `npx create-vite@latest client --template react` | Root | Scaffolded React app |
| 3 | `npm install` | `client/` | Installed base dependencies |
| 4 | `npm install react-router-dom` | `client/` | Added routing library |
| 5 | `Remove-Item client/src/App.css` | `client/` | Deleted Vite boilerplate CSS |
| 6 | `npm run dev` | `client/` | Started dev server (localhost:5173) |

### No Changes to Existing Code
- All existing files in `pages/`, `utils/`, `tests/`, `scripts/`, `.github/` remain **untouched**
- No modifications were made outside the new `client/` directory

---

## 2026-05-11 — Backend API Scaffold (Branch: `feat/naukriboost-webapp`)

### New Directory: `server/`

### Dependencies Installed (in `server/`)
- `express` — Web framework
- `better-sqlite3` — SQLite database driver
- `bcryptjs` — Password hashing
- `jsonwebtoken` — JWT authentication
- `multer` — File upload handling
- `dotenv` — Environment variables
- `cors` — Cross-origin requests
- `node-cron` — Scheduled tasks (future phase)

### Files Created

| File | Purpose |
|---|---|
| `server/package.json` | Server config with `start` and `dev` scripts |
| `server/.env` | Server-specific environment variables (`PORT`, `JWT_SECRET`, `DB_PATH`) |
| `server/index.js` | Express app entry point, configures middleware and routes |
| `server/db/database.js` | SQLite singleton, enables WAL, runs schema migrations |
| `server/db/schema.sql` | 5 tables: `users`, `naukri_sessions`, `resumes`, `run_history`, `schedules` |
| `server/middleware/auth.js` | JWT verification middleware (`authenticate`) and token generator |
| `server/routes/auth.js` | POST `/signup`, POST `/login`, GET `/me` endpoints |
| `server/routes/resume.js` | POST `/upload` (Multer), GET `/`, DELETE `/` endpoints |
| `server/routes/boost.js` | POST `/trigger`, GET `/history`, GET `/stats` endpoints |
| `server/routes/schedule.js` | GET `/`, PUT `/` endpoints for scheduling |
| `server/routes/naukri.js` | POST `/connect` (mock session capture), GET `/status` endpoints |

### Commands Executed
| # | Command | Location | Purpose |
|---|---|---|---|
| 1 | `mkdir server` | Root | Created server directory |
| 2 | `npm init` (manual file creation) | `server/` | Created `package.json` |
| 3 | `npm install express better-sqlite3 ...` | `server/` | Installed dependencies |
| 4 | `npm start` | `server/` | Started API server on port 3001 |
| 5 | `Invoke-RestMethod` | `server/` | Tested `/api/health` and `/api/auth/signup` |

### No Changes to Existing Code
- Automation engine (`pages/`, `utils/`, `tests/`, `scripts/`) remains **untouched**.

---

## 2026-05-12 — Frontend ↔ Backend Integration (Branch: `feat/naukriboost-webapp`)

### Files Created

| File | Purpose |
|---|---|
| `client/src/services/api.js` | **[NEW]** Centralized fetch wrapper — auto-attaches JWT, handles 401 redirects, exports `auth`, `boost`, `resume`, `schedule`, `naukri` modules |

### Files Modified

| File | Change |
|---|---|
| `client/vite.config.js` | Added `/api` proxy to forward requests to `localhost:3001` |
| `client/src/pages/Login.jsx` | Replaced mock `setTimeout` + fake token → `POST /api/auth/login` via `api.js` |
| `client/src/pages/Signup.jsx` | Replaced mock auth → `POST /api/auth/signup` via `api.js` |
| `client/src/pages/Dashboard.jsx` | Replaced all mock data → fetches from `/api/boost/stats`, `/api/boost/history`, `/api/naukri/status`. "Boost Now" calls `POST /api/boost/trigger` |
| `client/src/pages/ActivityLog.jsx` | Replaced mock table → fetches from `/api/boost/history` with server-side pagination + filters |
| `client/src/pages/ActivityLog.css` | Added `.pagination-controls` and `.pagination-info` styles |
| `client/src/pages/Settings.jsx` | Replaced all mock data → fetches from `/api/naukri/status`, `/api/resume`, `/api/schedule`. Resume upload calls `POST /api/resume/upload`. Save calls `PUT /api/schedule`. Connect calls `POST /api/naukri/connect` |
| `client/src/pages/Settings.css` | Added `.upload-status`, `.upload-success`, `.upload-error` styles |

### Verified
- ✅ Signup creates real user in SQLite and returns valid JWT
- ✅ Dashboard shows real stats (zero for new users) from `/api/boost/stats`
- ✅ Settings shows live Naukri connection status from `/api/naukri/status`
- ✅ "Connect Now" updates DB and UI reflects "Connected" immediately
- ✅ Navigation between pages preserves state correctly
