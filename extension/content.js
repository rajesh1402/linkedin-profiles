// Injects the Save to Database button and floating button, handles profile extraction and messaging
(function() {
  // Debug helper
  function debug(msg, ...args) {
    console.debug('[ProfileSaver]', msg, ...args);
  }

  // --- Robustly find the LinkedIn main action bar (not sticky header) ---
  function findMainActionBar() {
    // Try common selectors for the LinkedIn action bar
    let candidates = [
      ...document.querySelectorAll('.pv-top-card-v2-ctas, .pvs-profile-actions, [data-test-id="profile-actions"], [class*="profile-actions"]')
    ];
    // Filter out sticky/fixed bars
    candidates = candidates.filter(bar => {
      let el = bar;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'sticky') return false;
        el = el.parentElement;
      }
      // Must be visible
      return bar.offsetParent !== null;
    });
    if (candidates.length > 0) {
      debug('Main action bar found:', candidates[0]);
      return candidates[0];
    }
    debug('Main action bar not found, falling back');
    return null;
  }

  // --- Inject Save button robustly ---
  function injectSaveButton() {
    // REMOVE: In-page Save button injection, as save should only be in popup
  }

  // --- Patch floating button logo to ensure it loads ---
  function injectFloatingButton() {
    if (document.getElementById('profile-saver-float-btn')) return;
    debug('Injecting floating button');
    const floatBtn = document.createElement('button');
    floatBtn.id = 'profile-saver-float-btn';
    // Create logo image via JS for CSP compliance
    const floatImg = document.createElement('img');
    floatImg.id = 'profile-saver-float-img';
    floatImg.src = chrome.runtime.getURL('assets/TS_logo.jpg');
    floatImg.style.width = '24px';
    floatImg.style.height = '24px';
    floatImg.style.verticalAlign = 'middle';
    floatImg.style.marginRight = '8px';
    floatImg.onerror = function() {
      this.onerror = null;
      this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="100%" height="100%" fill="#ccc"/></svg>';
    };
    const countSpan = document.createElement('span');
    countSpan.id = 'profile-saver-count';
    countSpan.textContent = '...';
    const spinnerSpan = document.createElement('span');
    spinnerSpan.id = 'profile-saver-float-spinner';
    spinnerSpan.style.display = 'none';
    spinnerSpan.style.marginLeft = '8px';
    spinnerSpan.style.verticalAlign = 'middle';
    spinnerSpan.innerHTML = '<svg width="22" height="22" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0073b1" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></circle></svg>';
    floatBtn.appendChild(floatImg);
    floatBtn.appendChild(countSpan);
    floatBtn.appendChild(spinnerSpan);
    floatBtn.style.position = 'fixed';
    floatBtn.style.top = '50%';
    floatBtn.style.right = '0';
    floatBtn.style.transform = 'translateY(-50%)';
    floatBtn.style.zIndex = '2147483647';
    floatBtn.style.background = '#fff';
    floatBtn.style.border = '2px solid #0073b1';
    floatBtn.style.borderRadius = '8px 0 0 8px';
    floatBtn.style.padding = '8px 18px 8px 12px';
    floatBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    floatBtn.style.cursor = 'pointer';
    floatBtn.style.display = 'flex';
    floatBtn.style.alignItems = 'center';
    floatBtn.style.fontWeight = 'bold';
    floatBtn.style.fontSize = '18px';
    floatBtn.style.color = '#0073b1';
    floatBtn.style.outline = 'none';
    floatBtn.style.transition = 'box-shadow 0.2s';
    floatBtn.onmouseenter = () => floatBtn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
    floatBtn.onmouseleave = () => floatBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    floatBtn.onclick = togglePopup;
    document.body.appendChild(floatBtn);
    showFloatingButtonSpinner(true);
    updateFloatingButtonCount();
  }

  function showFloatingButtonSpinner(show) {
    const spinner = document.getElementById('profile-saver-float-spinner');
    const count = document.getElementById('profile-saver-count');
    if (spinner && count) {
      spinner.style.display = show ? 'inline-block' : 'none';
      count.style.display = show ? 'none' : 'inline-block';
    }
  }

  // Extract profile info from DOM (robust for experience/current_title and profile_pic)
  function extractProfile() {
    const name = document.querySelector('h1.inline.t-24.v-align-middle.break-words')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
    const headline = document.querySelector('.text-body-medium.break-words')?.innerText.trim() || '';
    const url = window.location.href;
    const location = document.querySelector('.text-body-small.inline.t-black--light.break-words')?.innerText.trim() || '';
    
    // Robust current_title extraction (first experience title)
    let currentTitle = '';
    const expSection = document.getElementById('experience');
    if (expSection) {
      const titleSpan = expSection.parentElement?.querySelector('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
      if (titleSpan && titleSpan.innerText.trim()) {
        currentTitle = titleSpan.innerText.trim();
      } else {
        const fallbackTitle = expSection.parentElement?.querySelector('.t-bold span[aria-hidden="true"]');
        if (fallbackTitle && fallbackTitle.innerText.trim()) {
          currentTitle = fallbackTitle.innerText.trim();
        }
      }
    }
    // Robust profile_pic extraction (improved selectors and fallback)
    let profilePic = '';
    // 1. Try the most specific: <img> inside the profile picture button/container
    let mainImg = document.querySelector('.pv-top-card-profile-picture__container img');
    if (!mainImg) {
      // 2. Try the --show class (sometimes LinkedIn changes this)
      mainImg = document.querySelector('.pv-top-card-profile-picture__image--show');
    }
    if (!mainImg) {
      // 3. Try all previous selectors as fallback
      mainImg = document.querySelector(
        '.pv-top-card-profile-picture__image, ' +
        '.profile-photo-edit__preview img, ' +
        '.pv-top-card__photo, ' +
        'img[alt*="profile" i], img[alt*="photo" i]'
      );
    }
    if (mainImg && mainImg.src && !mainImg.src.includes('ghost') && !mainImg.src.includes('default')) {
      profilePic = mainImg.src;
    }
    // 4. Fallback: og:image meta, but skip generic backgrounds
    if (!profilePic) {
      const meta = document.querySelector('meta[property="og:image"]');
      if (meta && meta.content && !/linkedin.*background|shrink_/.test(meta.content)) {
        profilePic = meta.content;
      }
    }
    debug('Profile pic candidate:', profilePic);
    debug('Extracted profile fields', { name, headline, url, currentTitle, location, profilePic });
    return { name, headline, url, current_title: currentTitle, location, profile_pic: profilePic };
  }

  // Handle Save button click
  function handleSaveProfile() {
    const btn = document.getElementById('profile-saver-btn');
    btn.innerText = 'Saving...';
    btn.disabled = true;
    const profile = extractProfile();
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'save_profile', profile }, (response) => {
        debug('Save profile response', response);
        if (response && response.success) {
          btn.innerText = 'Saved!';
          updateFloatingButtonCount();
          if (document.getElementById('profile-saver-popup')) {
            fetchAndRenderPopupProfiles();
          }
          setTimeout(() => {
            btn.innerText = 'Save to Database';
            btn.disabled = false;
          }, 2000);
        } else {
          btn.innerText = 'Error!';
          setTimeout(() => {
            btn.innerText = 'Save to Database';
            btn.disabled = false;
          }, 2000);
        }
      });
    } else {
      debug('chrome.runtime.sendMessage is not available in this context');
      btn.innerText = 'Error!';
      setTimeout(() => {
        btn.innerText = 'Save to Database';
        btn.disabled = false;
      }, 2000);
    }
  }

  // --- Patch popup fetch to show error state ---
  function fetchAndRenderPopupProfiles() {
    debug('Fetching profiles for popup');
    fetch('http://127.0.0.1:8000/profiles')
      .then(r => {
        if (!r.ok) throw new Error('API error: ' + r.status);
        return r.json();
      })
      .then(profiles => {
        debug('Fetched profiles for popup', profiles);
        // Only update the profiles list, not the whole popup content
        const listDiv = document.getElementById('profile-saver-list');
        if (!listDiv) return;
        if (profiles && profiles.length > 0) {
          listDiv.innerHTML = `
            <div style="margin-bottom:16px;font-size:15px;color:#222;">Below are all profiles saved from LinkedIn:</div>
            <div style="margin-bottom:0;">
              ${profiles.map(p => `
                <div class="profile-saver-card" style="background:#f3f6f8;border:1px solid #e0e0e0;padding:10px 14px 10px 14px;border-radius:12px;margin-bottom:14px;display:flex;align-items:center;position:relative;">
                  <img src="${p.profile_pic ? p.profile_pic : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.name||'P') }" style="width:46px;height:46px;border-radius:50%;margin-right:15px;object-fit:cover;">
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:18px;">${p.name||''}</div>
                    <div style="font-size:15px;color:#555;margin-bottom:2px;">${p.headline||''}</div>
                    <div style="font-size:13px;color:#888;margin-bottom:2px;">${p.current_title||''}</div>
                    <div style="font-size:13px;color:#888;">${p.location||''}</div>
                  </div>
                  <button class="profile-delete" aria-label="Delete" title="Delete" data-profile-id="${p.id}"
                    style="position:absolute;top:6px;right:10px;background:none;border:none;color:#d32f2f;font-size:26px;cursor:pointer;margin:0;line-height:1;font-weight:bold;transition:color 0.2s;user-select:none;"
                    onmouseover="this.style.color='#b71c1c'" onmouseout="this.style.color='#d32f2f'">
                    &times;
                  </button>
                </div>
              `).join('')}
            </div>
          `;
          // Attach delete handlers
          listDiv.querySelectorAll('.profile-delete').forEach(btn => {
            btn.onclick = async function(e) {
              e.stopPropagation();
              const id = btn.getAttribute('data-profile-id');
              if (!id) return;
              btn.disabled = true;
              btn.innerText = '...';
              try {
                const resp = await fetch(`http://127.0.0.1:8000/profiles/${id}`, { method: 'DELETE' });
                if (resp.ok) {
                  fetchAndRenderPopupProfiles();
                  updateFloatingButtonCount();
                } else {
                  btn.innerText = '!';
                }
              } catch {
                btn.innerText = '!';
              }
              setTimeout(() => { btn.innerText = '×'; btn.disabled = false; }, 1500);
            };
          });
        } else {
          listDiv.innerHTML = '<div style="text-align:center;font-size:16px;color:#888;margin:30px 0;">No profiles saved yet.</div>';
        }
        // Update saved profiles count
        const savedHeading = document.getElementById('profile-saver-popup-saved-heading');
        if (savedHeading) {
          savedHeading.textContent = `Saved Profiles (${profiles.length})`;
        }
      })
      .catch(err => {
        debug('Popup error', err);
        const listDiv = document.getElementById('profile-saver-list');
        if (listDiv) {
          listDiv.innerHTML = `<div style=\"text-align:center;font-size:16px;color:#e00;margin:30px 0;\">Failed to load data.<br>${err}</div>`;
        }
      });
  }

  // --- In-page Popup Implementation ---
  function togglePopup() {
    let popup = document.getElementById('profile-saver-popup');
    if (popup) {
      popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
      if (popup.style.display === 'block') fetchAndRenderPopupProfiles();
      return;
    }
    popup = document.createElement('div');
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

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '18px';
    closeBtn.style.fontSize = '28px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#888';
    closeBtn.title = 'Close';
    closeBtn.onclick = () => { popup.style.display = 'none'; };
    popup.appendChild(closeBtn);

    // --- Logo and Heading at Top ---
    const logoHeaderDiv = document.createElement('div');
    logoHeaderDiv.style.display = 'flex';
    logoHeaderDiv.style.alignItems = 'center';
    logoHeaderDiv.style.marginBottom = '10px';
    const logoImg = document.createElement('img');
    logoImg.src = chrome.runtime.getURL('assets/TS_logo.jpg');
    logoImg.style.width = '32px';
    logoImg.style.height = '32px';
    logoImg.style.borderRadius = '6px';
    logoImg.style.boxShadow = '0 2px 6px #0001';
    logoImg.style.objectFit = 'contain';
    logoImg.style.marginRight = '10px';
    logoHeaderDiv.appendChild(logoImg);
    const logoTitle = document.createElement('span');
    logoTitle.textContent = 'Current Profile';
    logoTitle.style.fontSize = '21px';
    logoTitle.style.fontWeight = 'bold';
    logoTitle.style.color = '#0073b1';
    logoHeaderDiv.appendChild(logoTitle);
    popup.appendChild(logoHeaderDiv);

    // --- Add card hover effects with a <style> tag if not already present ---
    if (!document.getElementById('profile-saver-card-hover-style')) {
      const style = document.createElement('style');
      style.id = 'profile-saver-card-hover-style';
      style.textContent = `
        .profile-saver-card, .profile-saver-current-card {
          transition: box-shadow 0.18s, border-color 0.18s, background 0.18s;
        }
        .profile-saver-card:hover, .profile-saver-card:focus {
          box-shadow: 0 4px 18px #0073b13a, 0 1.5px 0 #0073b1;
          border-color: #0073b1;
          background: #eaf5fb;
        }
        .profile-saver-current-card:hover, .profile-saver-current-card:focus {
          box-shadow: 0 4px 18px #0073b13a, 0 1.5px 0 #0073b1;
          border-color: #0073b1 !important;
          background: #eaf5fb !important;
        }
      `;
      document.head.appendChild(style);
    }

    // --- Current Profile Section ---
    const currentProfile = extractProfile();
    const currentDiv = document.createElement('div');
    currentDiv.className = 'profile-saver-current-card';
    currentDiv.style.background = '#f3f6f8';
    currentDiv.style.border = '1px solid #e0e0e0';
    currentDiv.style.borderRadius = '16px';
    currentDiv.style.boxShadow = '0 2px 8px #0001';
    currentDiv.style.padding = '16px 18px 16px 18px';
    currentDiv.style.marginBottom = '10px';
    currentDiv.style.display = 'block';
    currentDiv.style.position = 'relative';
    currentDiv.tabIndex = 0;
    currentDiv.style.pointerEvents = 'auto';

    // Profile image
    const avatar = document.createElement('img');
    avatar.src = currentProfile.profile_pic ? currentProfile.profile_pic : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentProfile.name||'P');
    avatar.style.width = '56px';
    avatar.style.height = '56px';
    avatar.style.borderRadius = '50%';
    avatar.style.objectFit = 'cover';
    avatar.style.marginRight = '18px';

    // Profile details
    const detailsDiv = document.createElement('div');
    detailsDiv.style.flex = '1';
    detailsDiv.innerHTML = `
      <div style="font-weight:600;font-size:20px;">${currentProfile.name||''}</div>
      <div style="font-size:15px;color:#555;">${currentProfile.headline||''}</div>
      <div style="font-size:14px;color:#888;">${currentProfile.current_title||''}</div>
      <div style="font-size:14px;color:#888;">${currentProfile.location||''}</div>
    `;
    // Wrap avatar and details in a row
    const profileRow = document.createElement('div');
    profileRow.style.display = 'flex';
    profileRow.style.alignItems = 'center';
    profileRow.appendChild(avatar);
    profileRow.appendChild(detailsDiv);
    currentDiv.appendChild(profileRow);

    popup.appendChild(currentDiv);

    // Save button below the card, full width, centered, LinkedIn blue, hover effect
    const saveBtn = document.createElement('button');
    saveBtn.id = 'profile-saver-save-btn';
    saveBtn.innerText = 'Save';
    saveBtn.style.background = '#0a66c2';
    saveBtn.style.color = '#fff';
    saveBtn.style.border = 'none';
    saveBtn.style.borderRadius = '999px';
    saveBtn.style.padding = '10px 0';
    saveBtn.style.fontSize = '16px';
    saveBtn.style.fontWeight = 'bold';
    saveBtn.style.cursor = 'pointer';
    saveBtn.style.boxShadow = '0 2px 8px #0073b133';
    saveBtn.style.margin = '0 0 18px 0';
    saveBtn.style.width = '100%';
    saveBtn.style.transition = 'background 0.18s';
    saveBtn.onmouseover = function() { this.style.background = '#004182'; };
    saveBtn.onmouseout = function() { this.style.background = '#0a66c2'; };
    saveBtn.onclick = function() {
      // Extract profile and save
      const profile = extractProfile();
      if (profile && profile.name) {
        saveBtn.innerText = 'Saving...';
        saveBtn.disabled = true;
        chrome.runtime.sendMessage({ type: 'save_profile', profile }, function(response) {
          if (response && response.success) {
            saveBtn.innerText = 'Saved!';
            fetchAndRenderPopupProfiles();
            setTimeout(() => {
              saveBtn.innerText = 'Save';
              saveBtn.disabled = false;
            }, 1500);
          } else {
            saveBtn.innerText = 'Error!';
            setTimeout(() => {
              saveBtn.innerText = 'Save';
              saveBtn.disabled = false;
            }, 1500);
          }
        });
      } else {
        saveBtn.innerText = 'No Profile!';
        setTimeout(() => {
          saveBtn.innerText = 'Save';
          saveBtn.disabled = false;
        }, 1200);
      }
    };
    const saveBtnWrap = document.createElement('div');
    saveBtnWrap.style.width = '100%';
    saveBtnWrap.style.display = 'flex';
    saveBtnWrap.style.justifyContent = 'center';
    saveBtnWrap.appendChild(saveBtn);
    popup.appendChild(saveBtnWrap);

    // --- Saved Profiles Section ---
    const savedHeading = document.createElement('div');
    savedHeading.id = 'profile-saver-popup-saved-heading';
    savedHeading.style.fontSize = '18px';
    savedHeading.style.fontWeight = 'bold';
    savedHeading.style.color = '#0073b1';
    savedHeading.style.margin = '18px 0 2px 0';
    savedHeading.textContent = 'Saved Profiles (0)'; // Will be updated after fetch
    popup.appendChild(savedHeading);

    const listDiv = document.createElement('div');
    listDiv.id = 'profile-saver-list';
    listDiv.style.marginTop = '8px';
    popup.appendChild(listDiv);

    document.body.appendChild(popup);
    fetchAndRenderPopupProfiles();
  }

  function updateFloatingButtonCount() {
    showFloatingButtonSpinner(true);
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'get_count' }, (response) => {
        debug('Fetched saved profiles count', response);
        document.getElementById('profile-saver-count').innerText = response && response.count !== undefined ? response.count : '0';
        showFloatingButtonSpinner(false);
      });
    } else {
      debug('chrome.runtime.sendMessage is not available in this context');
      showFloatingButtonSpinner(false);
    }
  }

  // Listen for count update requests from background
  if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'update_count') updateFloatingButtonCount();
      else if (msg.type === 'extract_profile') {
        const profile = extractProfile();
        sendResponse(profile);
      }
    });
  } else {
    debug('chrome.runtime.onMessage is not available in this context');
  }

  // --- Wait for DOM ready and inject buttons ---
  (function() {
    if (window.hasRunLinkedInProfileSaver) return;
    window.hasRunLinkedInProfileSaver = true;
    debug('LinkedIn Profile Saver content script loaded');
    function ready(fn) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(fn, 1);
      } else {
        document.addEventListener('DOMContentLoaded', fn);
      }
    }
    ready(() => {
      injectFloatingButton();
    });
  })();
})();
