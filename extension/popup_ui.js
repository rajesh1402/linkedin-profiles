// popup_ui.js
// UI rendering for LinkedIn Profile Saver in-page popup

/**
 * Creates and returns the base popup container (without profile content).
 * Does not attach to the DOM.
 */
export function createPopupContainer() {
  const popup = document.createElement('div');
  popup.id = 'profile-saver-popup';
  popup.style.position = 'fixed';
  popup.style.top = '0';
  popup.style.right = '0';
  popup.style.height = '100vh';
  popup.style.zIndex = '2147483647';
  popup.style.background = '#fff';
  popup.style.border = '1.5px solid #d1d1d1';
  popup.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
  popup.style.borderRadius = '18px';
  popup.style.width = '410px';
  popup.style.maxHeight = '96vh';
  popup.style.overflowY = 'auto';
  popup.style.padding = '18px 18px 18px 18px';
  popup.style.display = 'block';
  popup.style.transition = 'opacity 0.2s';
  return popup;
}
