// Handles popup UI and profile listing
const API_URL = 'http://127.0.0.1:8000/profiles';

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
  const template = document.getElementById('profile-card-template');
  profiles.forEach(profile => {
    const card = template ? template.content.firstElementChild.cloneNode(true) : document.createElement('div');
    card.className = 'profile-card';
    // Avatar
    let avatarUrl = profile.profile_pic && !profile.profile_pic.includes('ghost') && !profile.profile_pic.includes('default') ? profile.profile_pic : '';
    if (!avatarUrl) {
      try { avatarUrl = chrome.runtime.getURL('icon32.png'); } catch { avatarUrl = 'icon32.png'; }
    }
    card.querySelector('.profile-avatar').src = avatarUrl;
    card.querySelector('.profile-avatar').onerror = function() {
      this.onerror = null;
      this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="100%" height="100%" fill="#ccc"/></svg>';
    };
    // Info
    card.querySelector('.profile-name').textContent = profile.name;
    card.querySelector('.profile-headline').textContent = profile.headline;
    card.querySelector('.profile-title').textContent = profile.current_title;
    card.querySelector('.profile-location').textContent = profile.location;
    card.querySelector('.profile-about').innerHTML = profile.about ? profile.about.replace(/\n/g, '<br>') : '';
    // Notes
    const notesView = card.querySelector('.profile-notes-view');
    const notesEdit = card.querySelector('.profile-notes-edit');
    const notesTextarea = card.querySelector('.profile-notes-textarea');
    function setViewMode() {
      notesView.style.display = '';
      notesEdit.style.display = 'none';
      notesView.innerHTML = `<b>Notes:</b> ${profile.notes ? profile.notes.replace(/\n/g, '<br>') : '<span style=\'color:#888\'>(No notes added)</span>'}`;
    }
    function setEditMode() {
      notesView.style.display = 'none';
      notesEdit.style.display = '';
      notesTextarea.value = profile.notes || '';
      notesTextarea.focus();
    }
    setViewMode();
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'profile-notes-edit-btn';
    editBtn.onclick = () => setEditMode();
    notesView.appendChild(editBtn);
    // Save/Cancel handlers
    notesEdit.querySelector('.profile-notes-save').onclick = () => {
      const newNotes = notesTextarea.value.trim();
      fetch(`${API_URL}/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes })
      })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(() => {
        profile.notes = newNotes;
        setViewMode();
      })
      .catch(() => alert('Failed to update notes.'));
    };
    notesEdit.querySelector('.profile-notes-cancel').onclick = setViewMode;
    // Delete
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

// Add Save button logic for popup
function saveCurrentProfileFromPopup() {
  // Request profile extraction from content script
  if (window.chrome && chrome.tabs && chrome.runtime) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0] || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: 'extract_profile' }, function(profile) {
        if (profile && profile.name) {
          // Attach notes from textarea
          const notes = document.getElementById('profile-saver-notes')?.value?.trim() || '';
          profile.notes = notes;
          chrome.runtime.sendMessage({ type: 'save_profile', profile }, function(response) {
            if (response && response.success) {
              document.getElementById('profile-saver-notes').value = '';
              renderProfilesFromAPI();
            } else {
              alert('Failed to save profile.');
            }
          });
        } else {
          alert('Could not extract profile. Make sure you are on a LinkedIn profile page.');
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  fetchProfiles();
  const saveBtn = document.getElementById('profile-saver-save-btn');
  if (saveBtn) {
    saveBtn.onclick = saveCurrentProfileFromPopup;
  }
});

// Helper to refresh profiles after save
function renderProfilesFromAPI() {
  fetch(API_URL)
    .then(r => r.json())
    .then(renderProfiles)
    .catch(() => {
      document.getElementById('profile-saver-error').style.display = 'block';
    });
}
