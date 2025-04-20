# LinkedIn Profile Saver Chrome Extension - Requirements

## Overview
A Chrome extension to extract and save LinkedIn profiles, with a focus on robustly capturing the "About" section and providing an in-page popup UI for profile management.

---

## Features

### 1. About Section Extraction
- Extracts the expanded "About" section from LinkedIn profiles using resilient DOM selectors.
- Falls back to the collapsed About section if the expanded one is not available.
- Extraction logic is robust to LinkedIn DOM changes and tested with local HTML and jsdom.

### 2. In-Page Popup & Floating Button
- A floating button is injected on LinkedIn profile pages (`https://www.linkedin.com/in/*`).
- Clicking the floating button toggles an in-page popup.
- The popup displays the current profile's extracted data, allows adding notes, and shows a list of saved profiles.
- Save and delete operations update both the popup and floating button counts in real-time.
- Defensive coding ensures the popup and button never break if the extension context is lost or the backend is not ready.

### 3. Backend Integration
- Profiles are saved and fetched from a backend API (`http://127.0.0.1:8000/profiles`).
- All API calls are robust to backend downtime, showing fallback UI and logging errors.

### 4. Debugging & Logging
- Debug logs (e.g., `[ProfileSaver] ...`) are present throughout for easy troubleshooting.
- Error cases (e.g., failed fetch, extension context invalidation) are handled gracefully with fallback UI and logs.

### 5. Local Testing
- Extraction logic can be tested locally using Node.js and jsdom (`test_extract_about.js`).
- Extracted About section is written to `about_extracted.txt` for verification.

---

## Technical Stack
- Chrome Extensions API (MV3)
- JavaScript (ES6+)
- Node.js (for testing)
- jsdom (for DOM simulation in tests)
- Backend API (must be running at `http://127.0.0.1:8000/profiles`)

---

## Security & Permissions
- Only requests permissions for LinkedIn profile URLs and backend API.
- No special security configuration required; operates on local HTML and LinkedIn DOM.

---

## Known Issues & Defensive Measures
- Handles 'Extension context invalidated' by using try/catch and fallback images for all extension asset loads.
- Handles backend unavailability by showing fallback UI and never displaying `undefined` in counts.
- Always returns `true` from async message listeners in background scripts to avoid Chrome warnings.

---

## User Experience
- Floating button and popup are visually styled for LinkedIn.
- All user actions (save, delete) update the UI instantly and reliably.
- Error and loading states are shown clearly in the popup.

---

## How to Test
1. Start the backend API at `http://127.0.0.1:8000/profiles`.
2. Load the extension in Chrome (Developer Mode > Load Unpacked).
3. Visit a LinkedIn profile (e.g., `https://www.linkedin.com/in/your-profile`).
4. Use the floating button to open the popup, save profiles, and verify About extraction.
5. For local testing, run `node test_extract_about.js test_about.html` and check `about_extracted.txt`.

---

## Dependencies
- `jsdom` (for local extraction tests)
- Chrome (latest, for extension use)
- Node.js (for local testing)

---

## Special Notes
- After reloading or updating the extension, always refresh the LinkedIn page before using the floating button or popup.
- If the backend is not running, the extension will show '0' saved profiles and fallback error states, but will not break.

---

## Change Log / Recent Fixes
- Fixed: Assignment to constant variable in extraction logic.
- Fixed: Floating button count now updates after save.
- Fixed: Extension context invalidation errors for asset loading.
- Fixed: Fallback UI and logging for backend/API errors.
- Improved: Defensive checks and error handling throughout popup and content scripts.

---

## Contact
For issues or feature requests, please contact the project maintainer.
