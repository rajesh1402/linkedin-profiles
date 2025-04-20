// Handles backend requests and extension messaging
const API_URL = 'http://127.0.0.1:8000/profiles';

function debug(msg, ...args) {
  console.debug('[ProfileSaver][BG]', msg, ...args);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  debug('Received message', msg);
  try {
    if (msg.type === 'save_profile') {
      debug('Saving profile to backend', msg.profile);
      // PATCH if profile exists (by URL), otherwise POST
      fetch(API_URL.replace('/profiles','/profiles/by_url') + '?url=' + encodeURIComponent(msg.profile.url))
        .then(async r => {
          if (r.ok) {
            const existing = await r.json();
            fetch(API_URL + '/' + existing.id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes: msg.profile.notes })
            })
              .then(async r => {
                debug('PATCH response', r.status);
                if (r.ok) {
                  try { chrome.runtime.sendMessage({ type: 'update_count' }); } catch (e) { debug('No receiving end for update_count', e); }
                  sendResponse({ success: true });
                } else {
                  sendResponse({ success: false });
                }
              })
              .catch(err => {
                debug('PATCH error', err);
                sendResponse({ success: false });
              });
          } else {
            // Profile does not exist, POST
            fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(msg.profile)
            })
              .then(async r => {
                debug('POST response', r.status);
                if (r.ok) {
                  try { chrome.runtime.sendMessage({ type: 'update_count' }); } catch (e) { debug('No receiving end for update_count', e); }
                  sendResponse({ success: true });
                } else {
                  sendResponse({ success: false });
                }
              })
              .catch(err => {
                debug('POST error', err);
                sendResponse({ success: false });
              });
          }
        })
        .catch(err => {
          debug('Fetch existing profile error', err);
          sendResponse({ success: false });
        });
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
    } else if (msg.type === 'show_popup') {
      debug('Show popup requested');
      try { chrome.action.openPopup(); } catch (e) { debug('No receiving end for openPopup', e); }
    }
  } catch (e) {
    debug('Error handling message in background.js', e);
  }
  // Always return true to keep the message channel open for async sendResponse
  return true;
});
