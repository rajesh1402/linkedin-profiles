# Refactoring Plan for content.js

## 1. Identify Logical Modules
- **UI Rendering:** All code that creates and updates DOM elements for the popup.
- **Event Handling:** Listeners and handlers for user actions (button clicks, editing, deleting, etc.).
- **Profile Extraction:** Logic for extracting profile data from the LinkedIn DOM (should already be in `content_utils.js`).
- **API Communication:** Functions for fetching, saving, deleting profiles from the backend.
- **Popup State Management:** Centralized state for the popup (profiles, filters, sort order, etc.).
- **Helpers/Utils:** Generic helper functions (e.g., DOM creation, formatting).

## 2. Suggested File Structure
```
extension/
  content.js                // Entry point, only bootstraps and wires modules together
  popup_ui.js               // Rendering and UI component logic
  popup_events.js           // Event listeners and handlers
  popup_state.js            // State management for popup
  api.js                    // Backend API communication
  content_utils.js          // Profile extraction (already exists)
  dom_helpers.js            // DOM helpers (optional)
```

## 3. How to Split
- **A. Move UI Logic**
  - Move all DOM creation and rendering functions (popup, profile cards, search bar, etc.) into `popup_ui.js`.
- **B. Move Event Logic**
  - Move all event listeners (button clicks, input changes, etc.) into `popup_events.js`.
  - Export functions to attach/detach events as needed.
- **C. Move State Logic**
  - Create a simple state object and related functions in `popup_state.js`.
  - This holds current profiles, search query, sort order, etc.
- **D. Move API Calls**
  - Move all fetch/POST/DELETE logic to `api.js`.
  - Export functions like `fetchProfiles()`, `saveProfile()`, `deleteProfile()`.
- **E. Keep Extraction Separate**
  - Keep all DOM extraction for profile data in `content_utils.js`.
- **F. Use a Clean Entry Point**
  - `content.js` should only:
    - Import the above modules.
    - Initialize the popup when needed.
    - Wire up state, UI, and events.

## 4. Example: Entry Point (`content.js`)
```js
import { initPopupUI, renderPopup } from './popup_ui.js';
import { attachPopupEvents } from './popup_events.js';
import { loadProfiles } from './api.js';
import { popupState } from './popup_state.js';

function showProfilePopup() {
  loadProfiles().then(profiles => {
    popupState.setProfiles(profiles);
    renderPopup(profiles);
    attachPopupEvents();
  });
}

document.getElementById('my-floating-btn').onclick = showProfilePopup;
```

## 5. Migration Strategy
1. Start by moving UI rendering functions.
2. Then move event handlers.
3. Then API logic.
4. Refactor state usage last.
5. At each step, update imports/exports and test that the popup still works.

## 6. Benefits
- Each file is focused, short, and easy to test.
- You can add features or fix bugs in one place without breaking others.
- Future contributors will quickly understand where to look for logic.

---

**Use this plan as a checklist and guide for splitting and refactoring your `content.js` file.**
