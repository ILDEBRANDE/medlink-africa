# MedLink Africa — Fixed & Enhanced

## Setup

1. Import database schema:
   ```bash
   mysql -u root -p < sql/schema.sql
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment (edit `.env`):
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=medlink_africa
   SESSION_SECRET=your_long_random_secret
   ```

4. Start the server:
   ```bash
   npm start        # production
   npm run dev      # development (nodemon)
   ```

5. Default admin login:
   - Email: `admin@medlink.com`
   - Password: `Admin@2024`

## Bug Fixes Applied

| # | Bug | Fix |
|---|-----|-----|
| 1 | `users` table missing `admin` role in ENUM | Added `admin` to schema |
| 2 | 4 tables missing: `hospital_verification`, `user_settings`, `reports` + columns | Full schema rewrite |
| 3 | SQL injection in `/api/doctor/download/:fileType` | Whitelist-based column selection |
| 4 | `/hospital/my-jobs` route unreachable (shadowed by `/:id`) | Route order fixed |
| 5 | `requireRole` middleware missing try/catch | Added error handling |
| 6 | `doctor[0]` accessed without null check in applications | Added guard |
| 7 | Reports SQL used wrong alias (`reported.role`) | Fixed to `u_reported.role` |
| 8 | `req.file` accessed without null check on upload | Added guard |
| 9 | Chat `currentUserId` race condition | Set before any async calls |
| 10 | Interview scheduling used `prompt()` with no validation | Replaced with modal + ISO date validation |

## New Features Added

- **Rate limiting** on auth endpoints (20 req/15min)
- **Helmet** security headers (XSS, clickjacking, MIME protection)
- **Input validation** with express-validator on all auth forms
- **Password policy** (8+ chars, uppercase, number required)
- **Pagination** on all list endpoints (jobs, applications, hospitals, doctors)
- **Mark all notifications as read** endpoint + UI
- **Unread message count** in conversation list
- **Auto-refresh** chat messages every 5 seconds
- **Doctor notified** when application status changes
- **Hospital notified** when doctor applies
- **Interview datetime validation** (rejects malformed dates)
- **Message length limit** (2000 chars max)
- **Auto-open chat** from applicants page (`/messages.html?userId=X`)
