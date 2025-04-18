// Handles popup UI and profile listing
const API_URL = 'http://localhost:8000/profiles';

function debug(msg, ...args) {
  console.debug('[ProfileSaver][POPUP]', msg, ...args);
}

function renderProfiles(profiles) {
  debug('Rendering profiles', profiles);
  const list = document.getElementById('profile-saver-list');
  list.innerHTML = '';
  if (!profiles.length) {
    document.getElementById('profile-saver-empty').style.display = 'block';
    return;
  }
  document.getElementById('profile-saver-empty').style.display = 'none';
  profiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'profile-card';
    // Use chrome.runtime.getURL for fallback icon, but always resolve at render time for extension context
    let avatarUrl = profile.profile_pic && !profile.profile_pic.includes('ghost') && !profile.profile_pic.includes('default') ? profile.profile_pic : '';
    if (!avatarUrl) {
      try {
        avatarUrl = chrome.runtime.getURL('icon32.png');
      } catch { avatarUrl = 'icon32.png'; }
    }
    card.innerHTML = `
      <img src="${avatarUrl}" class="profile-avatar">
      <div class="profile-info">
        <div class="profile-name">${profile.name}</div>
        <div class="profile-headline">${profile.headline}</div>
        <div class="profile-title">${profile.current_title}</div>
        <div class="profile-location">${profile.location}</div>
      </div>
      <button class="profile-delete" aria-label="Delete" title="Delete">&times;</button>
    `;
    card.querySelector('.profile-delete').onclick = () => deleteProfile(profile.id);
    list.appendChild(card);
  });
}

function fetchProfiles() {
  debug('Fetching profiles from backend');
  fetch(API_URL)
    .then(r => r.json())
    .then(profiles => {
      debug('Fetched profiles', profiles);
      document.getElementById('profile-saver-popup-count').innerText = profiles.length;
      renderProfiles(profiles);
      // Also update floating button count in content script (if content script is present)
      if (window.chrome && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'update_count' });
      }
    })
    .catch(err => {
      debug('Error loading profiles', err);
      document.getElementById('profile-saver-error').style.display = 'block';
    });
}

function deleteProfile(id) {
  debug('Deleting profile', id);
  fetch(`${API_URL}/${id}`, { method: 'DELETE' })
    .then(r => {
      debug('Delete response', r.status);
      if (r.ok) fetchProfiles();
      // Also update floating button count in content script
      if (window.chrome && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'update_count' });
      }
    });
}

document.addEventListener('DOMContentLoaded', fetchProfiles);
