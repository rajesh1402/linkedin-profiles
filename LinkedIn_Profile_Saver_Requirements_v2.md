# LinkedIn Profile Saver — Comprehensive Requirements Document (v2, Multi-User Support)

---

**Project Decision Log:**
- [All previous decisions retained from v1.]
- 2025-04-20: Planned and initiated multi-user support for the extension and backend.

---

**Setup Note:**
- [Same as v1.]

---

## I. API Backend (FastAPI + Postgres/Neon)

### A. Core Features
1. **RESTful API** using FastAPI.
2. **Endpoints:**
   - `POST /profiles`: Save a LinkedIn profile (fields: name, headline, url, current_title, location, profile_pic, about, notes, user_id).
   - `GET /profiles`: List all saved profiles for the authenticated user, including `about` and `notes`.
   - `DELETE /profiles/{profile_id}`: Delete a profile by ID (only if owned by the user).
   - `POST /auth/login`, `POST /auth/register`, etc.: User authentication endpoints (JWT or session-based).
3. **Database:**
   - Use Postgres (Neon or local) for storage.
   - ORM: SQLAlchemy.
   - Profile model includes: `id`, `user_id` (foreign key), `name`, `headline`, `url` (unique per user), `current_title`, `location`, `profile_pic`, `about` (optional), `notes` (optional).
   - User model for authentication (e.g., email, password hash, optional OAuth fields).
4. **Data Validation:**
   - Use Pydantic models for request/response validation. All endpoints accept and return the new `about` and `notes` fields as optional strings. All profile endpoints are user-specific.
5. **CORS:**
   - Allow requests from the Chrome extension and localhost for development.
6. **Error Handling:**
   - Return 409 Conflict if duplicate profile URL for the same user.
   - Return 404 for not found.
   - Return 401/403 for unauthorized/forbidden actions.
   - Return 500 for unexpected errors.

### B. Migrations & Seeding
- [Same as v1, with added `user_id` field and user table migrations.]

---

## II. Chrome Extension (Manifest V3)

### A. Features
1. **About Section Extraction:**
   - [Same as v1.]
2. **In-Page Popup & Floating Button:**
   - [Same as v1.]
3. **Multi-User Support:**
   - Add login/logout UI to the popup.
   - Store and use an auth token (JWT/session) for all API requests.
   - Show the logged-in user's info in the popup.
   - Ensure all profile actions (save, fetch, delete) are scoped to the current user.
   - Handle login/logout flows and errors in the UI.
4. **Backend Integration:**
   - Attach the auth token to all fetch requests.
   - Handle 401/403 errors by prompting for login.
5. **Debugging & Logging:**
   - [Same as v1.]
6. **Local Testing:**
   - [Same as v1.]

---

## III. Technical Stack
- [Same as v1, with user authentication added to backend.]

---

## IV. Security & Permissions
- Require authentication for all profile operations.
- Securely store and transmit tokens (never expose in logs).
- Use HTTPS for backend in production.
- [Other points same as v1.]

---

## V. Known Issues & Defensive Measures
- [Same as v1, plus:]
- Handle API 401/403 errors in the extension and prompt user to log in again.
- Ensure complete data isolation between users (no cross-user access).

---

## VI. User Experience
- Popup shows login screen if not authenticated.
- After login, user sees only their own saved profiles.
- All UI actions (save, delete) update only the current user's data.
- [Other points same as v1.]

---

## VII. How to Test
1. Start the backend API with authentication enabled.
2. Register/login as different users and verify data isolation.
3. Use the extension to save, view, and delete profiles for each user.
4. Ensure logout/login flows work and no user can see another's data.
5. [Other points same as v1.]

---

## VIII. Dependencies
- [Same as v1, plus:]
- Authentication library (e.g., FastAPI JWT Auth, OAuthlib, etc.)

---

## IX. Special Notes
- After reloading or updating the extension, always refresh the LinkedIn page before using the floating button or popup.
- If the backend is not running, the extension will show '0' saved profiles and fallback error states, but will not break.
- User must be logged in to use profile save/fetch features.

---

## X. Change Log / Recent Fixes
- Added: Multi-user support plan and requirements.
- [Other points same as v1.]

---

## Contact
For issues or feature requests, please contact the project maintainer.
