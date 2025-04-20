# LinkedIn Profile Saver — Comprehensive Requirements Document

---

**Project Decision Log:**
- 2025-04-18: Decided to start implementation with the backend (API, database, migrations, etc.) before the Chrome extension. The backend will use the Neon Postgres database as specified in the provided `.env` file in the `api` folder. The assets folder contains the logo for branding.
- 2025-04-18: Updated backend Python imports to use absolute imports for Alembic compatibility. This ensures migrations run correctly regardless of how scripts are executed.
- 2025-04-18: Identified Alembic migration issue due to environment variable loading. Will update Alembic config to ensure DATABASE_URL from .env is loaded correctly during migrations.
- 2025-04-18: Alembic migration succeeded and the `profiles` table is now created in the Neon database. Proceeding to add seeding and truncation scripts as per requirements.
- 2025-04-18: Added API endpoint test scripts (`test_post.py`, `test_get.py`, `test_delete.py`) for backend verification.
- 2025-04-18: Added automated pytest-based tests (`test_api.py`) for backend endpoint coverage (success, duplicate, error cases).
- 2025-04-18: Switched backend imports in main.py to absolute imports for compatibility with pytest and script execution.
- 2025-04-18: All backend automated and manual tests passed with Neon. Backend is complete and verified. Proceeding to Chrome extension implementation (Manifest V3, content/background scripts, UI).
- 2025-04-18: Created an `extension` folder for the Chrome extension codebase. Scaffolded Manifest V3 config, background/content scripts, popup UI, and CSS. All extension code is organized and store-ready, matching requirements for modularity and maintainability.
- 2025-04-18: Added detailed debug statements to all Chrome extension scripts (content, background, popup) for easy troubleshooting and to log all field extraction and backend interactions. All logs are clearly prefixed (`[ProfileSaver]`, `[BG]`, `[POPUP]`) for easy filtering in the Chrome DevTools console.
- 2025-04-19: Updated backend to support optional 'about' and 'notes' fields in the profile model, API endpoints, and DB. Added migration note about short hex revision IDs and manual sync if needed.

---

**Setup Note:**
- Use a Python virtual environment when installing dependencies for the backend (FastAPI, database, etc.).
  - Example:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r api/requirements.txt
    ```

## I. API Backend (FastAPI + Postgres/Neon)

### A. Core Features
1. **RESTful API** using FastAPI.
2. **Endpoints:**
   - `POST /profiles`: Save a LinkedIn profile (fields: name, headline, url, current_title, location, profile_pic, about, notes).
   - `GET /profiles`: List all saved profiles, including `about` and `notes`.
   - `DELETE /profiles/{profile_id}`: Delete a profile by ID.

3. **Database:**
   - Use Postgres (Neon or local) for storage.
   - ORM: SQLAlchemy.
   - Profile model includes: `id`, `name`, `headline`, `url` (unique), `current_title`, `location`, `profile_pic`, `about` (optional), `notes` (optional, user-supplied).

4. **Data Validation:**
   - Use Pydantic models for request/response validation. All endpoints accept and return the new `about` and `notes` fields as optional strings.

5. **CORS:**
   - Allow requests from the Chrome extension and localhost for development.

6. **Error Handling:**
   - Return 409 Conflict if duplicate profile URL.
   - Return 404 for not found.
   - Return 500 for unexpected errors.

### B. Migrations & Seeding
1. **Migrations:**
   - Use Alembic for DB migrations.
   - Provide migration scripts for initial schema and any changes (e.g., `profile_pic` field).
   - All migration scripts now use short hex revision IDs (max 32 chars) for compatibility with Postgres.
   - The migration chain is: initial table creation → add `about` and `notes` columns.
   - If columns are added manually, always update the `alembic_version` table accordingly.

2. **Seeding:**
   - Provide a script to seed the database with example LinkedIn profiles.

3. **Truncation:**
   - Provide a script to truncate/delete all profiles (for testing).

### C. Testing
1. **Test Scripts:**
   - `test_post.py`: POST a sample profile and print response.
   - `test_get.py`: GET all profiles and print response.
   - `test_delete.py`: DELETE a profile and check result.

2. **Automated Tests:**
   - Use pytest to test all endpoints (success, duplicate, error cases).

### D. Environment & Security
1. **.env File:**
   - Store DB credentials and settings in `.env`.
2. **Production Readiness:**
   - Use HTTPS in production.
   - Secure CORS origins.
   - No secrets in code.

### E. Documentation
1. **README:**  
   - Setup instructions, API docs, and environment setup.
2. **OpenAPI:**  
   - Ensure FastAPI auto-generates OpenAPI docs.

---

## II. Chrome Extension (Manifest V3, Content + Background Scripts)

### A. Core Features
1. **Injected “Save to Database” Button:**
   - Appears in the main LinkedIn profile action bar (not sticky header).
   - Styled like native LinkedIn buttons.
   - Robust polling/injection logic for dynamic DOM.

2. **Profile Extraction:**
   - Extract: name, headline, url, current_title, location, profile_pic.
   - **Use robust selectors:**  
     - **Name:** `h1.inline.t-24.v-align-middle.break-words` or fallback `h1`
     - **Headline:** `div.text-body-medium.break-words` or fallback `.text-body-medium.break-words, .top-card-layout__headline`
     - **Current Title:** From Experience section, use helper to find first job title.
     - **Location:** `span.text-body-small.inline.t-black--light.break-words` or fallback `.text-body-small.inline.t-black--light.break-words`
     - **Profile Pic:** `.pv-top-card-profile-picture__image, .profile-photo-edit__preview, img.pv-top-card-profile-picture__image, .pv-top-card__photo, .profile-photo-edit__preview img` or fallback meta tag.
   - **Button Injection:**  
     - Find all “Follow” buttons, filter out sticky/fixed ancestors, use first visible one’s parent as action bar.
     - Insert button before “More”, after “Message”, or at end.
     - Remove duplicates before injecting.
   - **Polling:**  
     - Poll for action bar and elements before injecting. Re-inject if DOM changes.
   - **Error Handling:**  
     - Log errors, provide debug logs, fallback gracefully.

3. **Save Operation:**
   - On button click, extract profile and send to backend via background script.
   - Show feedback: Saving…, Saved!, or Error!

4. **Popup/Floating Button:**
   - Show a count of saved profiles (fetched from backend).
   - List saved profiles in a popup window.

### B. Messaging & Permissions
1. **Background Script:**
   - Handles all backend requests (POST, GET).
   - Receives data from content script via `chrome.runtime.sendMessage`.

2. **Manifest:**
   - Manifest V3 format.
   - Minimal permissions: `activeTab`, `scripting`, `host_permissions` (LinkedIn + backend).
   - Register background service worker.

3. **CSP & Security:**
   - No use of `eval`, dynamic code, or remote scripts.
   - All code bundled locally.

### C. Extension Store Readiness
1. **No unnecessary permissions.**
2. **No remote code execution.**
3. **Clear description and privacy policy.**
4. **Production backend URL (not localhost) for release.**
5. **Branding assets (icons, logo) with proper rights.**

### D. Testing
1. **Manual Test Plan:**
   - Button appears in correct location.
   - Profile is saved and appears in backend.
   - Error handling: backend down, duplicate profile, etc.
   - Popup shows correct count and list.

2. **Automated Tests (optional):**
   - Selenium or Puppeteer scripts to simulate user actions.

---

## III. Chrome Extension UI Requirements

### A. Injected “Save to Database” Button
- **Placement:** Main profile action bar, before “More”.
- **Look & Feel:** Blue, LinkedIn-style button, margin-left: 8px, bold, pointer cursor, hover/focus states.
- **Feedback:** “Saving…”, “Saved!”, or “Error!” with timed revert.
- **Accessibility:** `aria-label="Save to Database"`

### B. Floating Button
- **Placement:** Fixed at the vertical center of the right edge of the browser window (`top: 50%; right: 32px; transform: translateY(-50%)`).
- **Look & Feel:** Rounded rectangle, logo (28x28px), badge with count or spinner, white background, shadow, pointer, hover shadow.
- **Spinner:** Inline SVG, LinkedIn blue, animated.
- **Accessibility:** `aria-label="Show saved profiles"`

### C. Popup Window
- **Trigger:** Floating button click.
- **Placement:** Above floating button, right-aligned, offset.
- **Look & Feel:** White, rounded, shadow, 350px wide, max-height 480px, scrollable, 18px padding.
- **Header:** Logo, “Saved Profiles (N)”, close “×”.
- **Profile List:** Light gray, rounded, border, profile pic (46x46px), name, headline, title, location, delete “×”.
- **Empty State:** “No profiles saved yet.”
- **Loading State:** Spinner and “Loading…”
- **Error State:** Red error message.

### D. General UX
- Smooth transitions for popup.
- Responsive at all zoom levels.
- High z-index, no interference with LinkedIn UI.
- Keyboard accessible, proper aria-labels.

### E. Sample CSS
```css
#profile-saver-float-btn {
  position: fixed;
  top: 50%;
  right: 32px;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  z-index: 2147483647;
  cursor: pointer;
  border: none;
  transition: box-shadow 0.2s;
}
#profile-saver-float-btn:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}
#profile-saver-popup {
  position: fixed;
  bottom: 72px;
  right: 32px;
  width: 350px;
  max-height: 480px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  padding: 18px;
  z-index: 2147483647;
  overflow-y: auto;
  display: none;
  transition: opacity 0.2s;
}
```

---

## IV. Visual Mockups & Designer Notes

### Injected Button
- `[Follow] [Message] [Save to Database] [More]` in main action bar.

### Floating Button
- Vertical center of the right edge, logo + count/spinner.

### Popup
- White, rounded, shadowed, above floating button.
- List of profiles with avatars and details.

### Accessibility & Branding
- All elements have `aria-label`s.
- Keyboard navigation.
- Use your own logo/colors.
- No remote scripts or eval.

---

## V. Deliverables

- **API Backend:**  
  - Python source, Alembic migrations, seeding/truncation scripts, test scripts, `.env.example`, README.

- **Chrome Extension:**  
  - All JS/HTML/CSS, manifest, icons, README, store-ready config.

- **Test Scripts:**  
  - For both API and extension.

---

## VI. UI/UX Enhancements (April 2025)

### Floating Button
- A modern, LinkedIn-inspired floating button is present at the vertical center of the right edge of every LinkedIn profile page.
- The button uses LinkedIn's signature blue (#0A66C2), white bold text, rounded corners, and a subtle shadow for a clean, professional look.
- The button is always visible and triggers the popup when clicked.

### Floating Button (Enhanced, April 2025)
- The floating button now displays the extension logo (PNG, 32x32) and a live count of saved profiles.
- While loading (e.g., fetching or saving profiles), the count is replaced by an animated spinner for clear user feedback.
- The spinner uses an SVG animation for smooth, modern appearance.
- The button remains fixed at the vertical center of the right edge of the browser window (`top: 50%; right: 32px; transform: translateY(-50%)`).
- This ensures the button is always visible and accessible, regardless of page scroll position.
- The loading state can be programmatically triggered by calling `window.setFloatingButtonLoading(true)` and reset with `window.setFloatingButtonLoading(false)` from any script.

*These enhancements improve user experience by making the extension's state clear and visually engaging.*

### Profiles Popup
- The popup appears as a floating card near the floating button, styled with rounded corners, a soft shadow, and a white background.
- The popup header includes the extension logo and a count of saved profiles.
- Each saved profile is displayed as a card with:
  - Avatar (uses LinkedIn profile picture or fallback initials avatar)
  - Name (bold), headline, current title, and location
  - Prominent delete button for removing a profile
- The popup is responsive, scrollable, and visually separated from the underlying page.
- Error and empty states are clearly indicated with friendly messaging.

### Design Principles
- All UI elements are styled to match LinkedIn's visual language for seamless integration.
- The user experience is optimized for clarity, accessibility, and ease of use.
- All styles are managed in `content.css` for maintainability.

### Implementation Notes
- The floating button and popup are injected via content scripts and styled with dedicated CSS.
- No icons or images are required for extension loading; PNG logos are recommended for best results.
- The popup and button work regardless of LinkedIn DOM changes due to robust selector logic.

---

## VII. UI Implementation Details (2025-04-18)
- **Floating Button:**
  - Flush with the right edge (`right: 0`), styled with the extension logo, visually distinct, and always accessible.
- **Popup:**
  - Full height (`top: 0; right: 0; height: 100vh;`), flush with the right browser edge, styled header, scrollable content, and a close button.
- **Robust Save Button Injection:**
  - Uses a smart polling mechanism for the LinkedIn action bar, finds the correct “Follow”/“More” button, and inserts the save button in the right place, even as the DOM changes.
- **API Integration:**
  - Fetches and displays saved profiles, updates the floating count, and supports deleting profiles directly from the popup.
- **Debug Logging:**
  - Helpful `[DEBUG]` logs for every major action (DOM, API, UI), making troubleshooting easy in DevTools.
- **Graceful Fallbacks:**
  - If the action bar isn’t found after polling, falls back to appending the save button to the body so the feature is always accessible.

### Field Extraction Selectors (2025-04-18)

- **Profile Name:**
  - `h1.inline.t-24.v-align-middle.break-words` or fallback to `h1`
- **Headline:**
  - `.text-body-medium.break-words`
- **Location:**
  - `.text-body-small.inline.t-black--light.break-words`
- **Current Title (Experience):**
  - First `.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]` inside the Experience section
  - Fallback: first `.t-bold span[aria-hidden="true"]` in Experience section
- **Profile Picture (`profile_pic`):**
  1. `.pv-top-card-profile-picture__image`, `.profile-photo-edit__preview`, `img.pv-top-card-profile-picture__image`, `.pv-top-card__photo`, `.profile-photo-edit__preview img` (main profile image)
  2. If not found, use `meta[property="og:image"]`
  3. If not found, use the first experience logo: `.ivm-view-attr__img-wrapper img` inside the Experience section

- **URL:**
  - `window.location.href`

> The extraction logic attempts selectors in the above order for each field to maximize robustness against LinkedIn DOM changes.

*Last updated: April 18, 2025 — UI/UX overhaul for floating button and popup implemented.*

---

**Chrome Extension Logo Handling (IMPORTANT):**
- If you want to use custom images (e.g., a logo) in your popup or floating button, and reference them from content scripts or dynamically in JS, you MUST declare them in `web_accessible_resources` in `manifest.json`:

```json
"web_accessible_resources": [
  {
    "resources": ["assets/TS_logo.jpg"],
    "matches": ["<all_urls>"]
  }
]
