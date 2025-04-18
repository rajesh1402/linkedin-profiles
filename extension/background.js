// Handles backend requests and extension messaging
const API_URL = 'http://localhost:8000/profiles';

function debug(msg, ...args) {
  console.debug('[ProfileSaver][BG]', msg, ...args);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  debug('Received message', msg);
  if (msg.type === 'save_profile') {
    debug('Saving profile to backend', msg.profile);
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg.profile)
    })
      .then(async r => {
        debug('POST response', r.status);
        if (r.ok) {
          chrome.runtime.sendMessage({ type: 'update_count' });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      })
      .catch(err => {
        debug('POST error', err);
        sendResponse({ success: false });
      });
    return true;
  } else if (msg.type === 'get_count') {
    debug('Fetching profile count');
    fetch(API_URL)
      .then(r => r.json())
      .then(profiles => {
        debug('Fetched profiles for count', profiles.length);
        sendResponse({ count: profiles.length });
      })
      .catch(err => {
        debug('Count fetch error', err);
        sendResponse({ count: 0 });
      });
    return true;
  } else if (msg.type === 'show_popup') {
    debug('Show popup requested');
    chrome.action.openPopup();
  }
});
