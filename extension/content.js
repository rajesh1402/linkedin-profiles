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
    if (document.getElementById('profile-saver-btn')) return;
    const actionBar = findMainActionBar();
    if (actionBar) {
      debug('Injecting Save to Database button into main action bar');
      const btn = document.createElement('button');
      btn.id = 'profile-saver-btn';
      btn.className = 'artdeco-button artdeco-button--2 artdeco-button--primary';
      btn.innerText = 'Save to Database';
      btn.setAttribute('aria-label', 'Save to Database');
      btn.style.marginLeft = '8px';
      btn.onclick = handleSaveProfile;
      actionBar.appendChild(btn);
      debug('Save button appended at end of main action bar');
    } else {
      // Fallback: append to body top
      debug('Action bar not found, appending Save button to body');
      const btn = document.createElement('button');
      btn.id = 'profile-saver-btn';
      btn.className = 'artdeco-button artdeco-button--2 artdeco-button--primary';
      btn.innerText = 'Save to Database';
      btn.setAttribute('aria-label', 'Save to Database');
      btn.style.position = 'fixed';
      btn.style.top = '80px';
      btn.style.right = '40px';
      btn.style.zIndex = '2147483647';
      btn.onclick = handleSaveProfile;
      document.body.appendChild(btn);
      debug('Save button appended to body as fallback');
    }
  }

  // --- Patch floating button logo to ensure it loads ---
  function injectFloatingButton() {
    if (document.getElementById('profile-saver-float-btn')) return;
    debug('Injecting floating button');
    const floatBtn = document.createElement('button');
    floatBtn.id = 'profile-saver-float-btn';
    floatBtn.innerHTML = `<img id="profile-saver-float-img" src="${chrome.runtime.getURL('icon32.png')}" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;" onerror="console.error('[DEBUG] Floating button logo failed to load:', this.src)"><span id="profile-saver-count">...</span><span id="profile-saver-float-spinner" style="display:none;margin-left:8px;vertical-align:middle;"><svg width="22" height="22" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0073b1" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></circle></svg></span>`;
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
    floatBtn.querySelector('img').addEventListener('error', () => debug('Floating button logo failed to load'));
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
    // 1. Try main profile image (top card, circular image)
    const mainImg = document.querySelector('.pv-top-card-profile-picture__image, .profile-photo-edit__preview img, .pv-top-card__photo, img[alt*="profile" i], img[alt*="photo" i]');
    if (mainImg && mainImg.src && !mainImg.src.includes('ghost') && !mainImg.src.includes('default')) {
      profilePic = mainImg.src;
    }
    // 2. Fallback: og:image meta, but skip generic backgrounds
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
  }

  // --- Patch popup fetch to show error state ---
  function fetchAndRenderPopupProfiles() {
    debug('Fetching profiles for popup');
    fetch('http://localhost:8000/profiles')
      .then(r => {
        if (!r.ok) throw new Error('API error: ' + r.status);
        return r.json();
      })
      .then(profiles => {
        debug('Fetched profiles for popup', profiles);
        const popupContent = document.getElementById('profile-saver-popup').querySelector('div:nth-child(2)');
        const logoUrl = chrome.runtime.getURL('icon32.png');
        if (profiles && profiles.length > 0) {
          popupContent.innerHTML = `
            <div style="display:flex;align-items:center;margin-bottom:18px;">
                <img src="${logoUrl}" alt="Logo" style="height:32px;width:auto;margin-right:10px;border-radius:6px;box-shadow:0 2px 6px #0001;object-fit:contain;">
                <span style="font-size:18px;font-weight:600;color:#0073b1;">Saved Profiles (${profiles.length})</span>
            </div>
            <div style="margin-bottom:16px;font-size:15px;color:#222;">Below are all profiles saved from LinkedIn:</div>
            <div style="margin-bottom:0;">
              ${profiles.map(p => `
                <div style="background:#f5f5f5;border:1px solid #e0e0e0;padding:10px 14px 10px 14px;border-radius:12px;margin-bottom:14px;display:flex;align-items:center;position:relative;">
                  <img src="${p.profile_pic ? p.profile_pic : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.name||'P')}" style="width:46px;height:46px;border-radius:50%;margin-right:15px;object-fit:cover;">
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:18px;">${p.name||''}</div>
                    <div style="font-size:15px;color:#555;margin-bottom:2px;">${p.headline||''}</div>
                    <div style="font-size:13px;color:#888;margin-bottom:2px;">${p.current_title||''}</div>
                    <div style="font-size:13px;color:#888;">${p.location||''}</div>
                  </div>
                  <button class="profile-delete-btn" data-profile-id="${p.id}" title="Delete" style="position:absolute;top:2px;right:4px;background:transparent;color:#e00;border:none;padding:0;width:32px;height:32px;font-size:28px;font-weight:900;line-height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color 0.2s;user-select:none;">&times;</button>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          popupContent.innerHTML = '<div style="text-align:center;font-size:16px;color:#888;margin:30px 0;">No profiles found.</div>';
        }
        setTimeout(() => {
          document.querySelectorAll('.profile-delete-btn').forEach(btn => {
            btn.onclick = async function(e) {
              e.stopPropagation();
              const id = btn.getAttribute('data-profile-id');
              if (!id) return;
              btn.disabled = true;
              btn.innerText = '...';
              try {
                const resp = await fetch(`http://localhost:8000/profiles/${id}`, { method: 'DELETE' });
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
        }, 50);
      })
      .catch(err => {
        debug('Popup error', err);
        const popupContent = document.getElementById('profile-saver-popup').querySelector('div:nth-child(2)');
        popupContent.innerHTML = `<div style=\"text-align:center;font-size:16px;color:#e00;margin:30px 0;\">Failed to load data.<br>${err}</div>`;
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
    popup.style.borderRadius = '0 0 0 15px';
    popup.style.boxShadow = '0 6px 24px rgba(0,0,0,0.18)';
    popup.style.width = '420px';
    popup.style.maxWidth = '100vw';
    popup.style.maxHeight = '100vh';
    popup.style.overflowY = 'auto';
    popup.style.display = 'block';
    popup.style.padding = '26px 24px 18px 24px';

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

    const popupContent = document.createElement('div');
    popupContent.innerHTML = '<div style="text-align:center;font-size:17px;color:#888;margin:30px 0;">Loading...</div>';
    popup.appendChild(popupContent);

    document.body.appendChild(popup);
    fetchAndRenderPopupProfiles();
  }

  function updateFloatingButtonCount() {
    showFloatingButtonSpinner(true);
    chrome.runtime.sendMessage({ type: 'get_count' }, (response) => {
      debug('Fetched saved profiles count', response);
      document.getElementById('profile-saver-count').innerText = response && response.count !== undefined ? response.count : '0';
      showFloatingButtonSpinner(false);
    });
  }

  // Listen for count update requests from background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'update_count') updateFloatingButtonCount();
  });

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
      injectSaveButton();
    });
  })();
})();
