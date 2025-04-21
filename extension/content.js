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
    // Defensive: wrap chrome.runtime.getURL in try/catch in case context is lost
    try {
      if (window.chrome && chrome.runtime && chrome.runtime.getURL) {
        floatImg.src = chrome.runtime.getURL('assets/TS_logo.jpg');
      } else {
        throw new Error('No chrome.runtime.getURL');
      }
    } catch (e) {
      // fallback: blank image or placeholder SVG
      floatImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="100%" height="100%" fill="#ccc"/></svg>';
    }
    floatImg.style.width = '24px';
    floatImg.style.height = '24px';
    floatImg.style.verticalAlign = 'middle';
    floatImg.style.marginRight = '8px';
    floatImg.style.objectFit = 'contain';
    floatImg.style.objectFit = 'contain';
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
    floatBtn.onclick = robustTogglePopup;
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

    // 1. Find all Experience-like sections (robust: look for h2 with 'Experience')
    const sections = Array.from(document.querySelectorAll('section, div'));
    let expSection = null;
    for (const section of sections) {
      const h2 = section.querySelector('h2, .pvs-header__title');
      if (h2 && h2.textContent && h2.textContent.toLowerCase().includes('experience')) {
        expSection = section;
        break;
      }
    }

    // 2. Search for the first plausible job title ONLY inside Experience section
    if (expSection) {
      let firstExp = expSection.querySelector('.pv-position-entity .t-16.t-black.t-bold') ||
                     expSection.querySelector('.t-14.t-black.t-bold') ||
                     expSection.querySelector('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
      if (!firstExp) {
        // Try direct child <li> with plausible job title
        const li = expSection.querySelector('li');
        if (li) {
          const span = li.querySelector('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
          if (span) firstExp = span;
        }
      }
      if (firstExp) currentTitle = firstExp.innerText.trim();
    }

    // 3. Fallback: headline (least preferred)
    if (!currentTitle) {
      const pos = document.querySelector('.text-body-medium.break-words');
      if (pos) currentTitle = pos.innerText.trim();
    }

    // --- Finalized About extraction for new LinkedIn DOM ---
    const aboutText = window.extractAboutSection();
    let profilePic = '';
    // Try legacy selectors first
    let mainImg = document.querySelector('.pv-top-card-profile-picture__image');
    if (!mainImg) {
      // Try new LinkedIn class (from user sample)
      mainImg = document.querySelector('img.pv-top-card-profile-picture__image--show');
    }
    if (!mainImg) {
      // Try any <img> inside the profile picture container (robust fallback)
      const container = document.querySelector('.pv-top-card-profile-picture__container');
      if (container) {
        mainImg = container.querySelector('img');
      }
    }
    if (!mainImg) {
      // Try other legacy selectors
      mainImg = document.querySelector('.profile-photo-edit__preview') ||
                document.querySelector('img.pv-top-card-profile-picture__image') ||
                document.querySelector('.pv-top-card__photo') ||
                document.querySelector('.profile-photo-edit__preview img');
    }
    if (mainImg && mainImg.src) {
      profilePic = mainImg.src;
    }
    // Fallback: og:image meta
    if (!profilePic) {
      const meta = document.querySelector('meta[property="og:image"]');
      if (meta && meta.content) {
        profilePic = meta.content;
      }
    }
    debug('Profile pic candidate:', profilePic);
    debug('Extracted profile fields', { name, headline, url, currentTitle, location, profilePic, about: aboutText });
    return { name, headline, url, current_title: currentTitle, location, profile_pic: profilePic, about: aboutText };
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
        const listDiv = document.getElementById('profile-saver-list');
        if (!listDiv) return;

        // --- Inline Search + Sort Icon Button ---
        const searchSortRow = document.createElement('div');
        searchSortRow.style.display = 'flex';
        searchSortRow.style.alignItems = 'center';
        searchSortRow.style.gap = '8px';
        searchSortRow.style.margin = '6px 0 12px 0';

        // Search bar (reduced width)
        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.id = 'profile-saver-search';
        searchBar.placeholder = 'Search by name, title, or location...';
        searchBar.style.flex = '1';
        searchBar.style.minWidth = '0';
        searchBar.style.width = '0';
        searchBar.style.maxWidth = '250px';
        searchBar.style.padding = '7px 12px';
        searchBar.style.fontSize = '15px';
        searchBar.style.border = '1px solid #bbb';
        searchBar.style.borderRadius = '7px';
        searchBar.style.display = 'block';

        // Sort icon button
        const sortBtn = document.createElement('button');
        sortBtn.id = 'profile-saver-sort-btn';
        sortBtn.style.background = 'none';
        sortBtn.style.border = 'none';
        sortBtn.style.padding = '0 6px';
        sortBtn.style.margin = '0';
        sortBtn.style.display = 'flex';
        sortBtn.style.alignItems = 'center';
        sortBtn.style.cursor = 'pointer';
        sortBtn.style.height = '38px';
        sortBtn.style.width = '36px';
        sortBtn.style.justifyContent = 'center';
        sortBtn.style.transition = 'background 0.15s';
        sortBtn.tabIndex = 0;
        sortBtn.setAttribute('aria-label', 'Sort by name (A-Z)');
        sortBtn.title = 'Sort by name (A-Z)';
        sortBtn.onfocus = () => sortBtn.style.background = '#e7f3fa';
        sortBtn.onblur = () => sortBtn.style.background = 'none';
        sortBtn.onmouseover = () => sortBtn.style.background = '#e7f3fa';
        sortBtn.onmouseout = () => sortBtn.style.background = 'none';

        // SVG for A-Z sort (default)
        function getSortSVG(order) {
          if (order === 'az') {
            return `<svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="4" y="16" font-size="13" font-family="Arial" fill="#222">A</text><text x="15" y="16" font-size="13" font-family="Arial" fill="#222">Z</text><path d="M7 7h8" stroke="#0073b1" stroke-width="2" stroke-linecap="round"/><path d="M11 5v2" stroke="#0073b1" stroke-width="2" stroke-linecap="round"/></svg>`;
          } else {
            return `<svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="4" y="16" font-size="13" font-family="Arial" fill="#222">A</text><text x="15" y="16" font-size="13" font-family="Arial" fill="#222">Z</text><path d="M7 15h8" stroke="#0073b1" stroke-width="2" stroke-linecap="round"/><path d="M11 15v2" stroke="#0073b1" stroke-width="2" stroke-linecap="round"/></svg>`;
          }
        }
        let sortOrder = 'az';
        sortBtn.innerHTML = getSortSVG(sortOrder);

        sortBtn.onclick = function() {
          sortOrder = sortOrder === 'az' ? 'za' : 'az';
          sortBtn.innerHTML = getSortSVG(sortOrder);
          sortBtn.setAttribute('aria-label', sortOrder === 'az' ? 'Sort by name (A-Z)' : 'Sort by name (Z-A)');
          sortBtn.title = sortOrder === 'az' ? 'Sort by name (A-Z)' : 'Sort by name (Z-A)';
          renderFilteredProfiles();
        };

        searchSortRow.appendChild(searchBar);
        searchSortRow.appendChild(sortBtn);
        listDiv.parentNode.insertBefore(searchSortRow, listDiv);

        let filteredProfiles = profiles;
        function renderFilteredProfiles() {
          const q = searchBar.value.trim().toLowerCase();
          if (q.length >= 2) {
            filteredProfiles = profiles.filter(p =>
              (p.name && p.name.toLowerCase().includes(q)) ||
              (p.current_title && p.current_title.toLowerCase().includes(q)) ||
              (p.location && p.location.toLowerCase().includes(q))
            );
          } else {
            filteredProfiles = profiles;
          }
          // Sort by name
          filteredProfiles = filteredProfiles.slice().sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            if (sortOrder === 'az') return nameA.localeCompare(nameB);
            else return nameB.localeCompare(nameA);
          });
          if (filteredProfiles.length > 0) {
            listDiv.innerHTML = `
              <div style="margin-bottom:16px;font-size:15px;color:#222;">Below are all profiles saved from LinkedIn:</div>
              <div style="margin-bottom:0;">
                ${filteredProfiles.map((p, idx) => `
                  <div class="profile-saver-card" style="background:#f3f6f8;border:1px solid #e0e0e0;padding:10px 14px 10px 14px;border-radius:12px;margin-bottom:14px;display:flex;align-items:center;position:relative;">
                    <img src="${p.profile_pic ? p.profile_pic : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.name||'P') }" style="width:46px;height:46px;border-radius:50%;margin-right:15px;object-fit:cover;">
                    <div style="flex:1;">
                      <div style="font-weight:600;font-size:18px;">${p.name||''}</div>
                      <div style="font-size:15px;color:#555;margin-bottom:2px;">${p.headline||''}</div>
                      <div style="font-size:13px;color:#888;margin-bottom:2px;">${p.current_title||''}</div>
                      <div style="font-size:13px;color:#888;">${p.location||''}</div>
                      <div class="profile-notes-view" data-idx="${idx}" style="margin-top:4px;${p.notes ? '' : 'color:#888;'}">
                        <b>Notes:</b> ${p.notes ? p.notes.replace(/\n/g, '<br>') : '<span style=\'color:#888\'>(No notes added)</span>'}
                        <button class="profile-notes-edit-btn" data-idx="${idx}" style="margin-left:8px;font-size:12px;padding:1px 7px 1px 7px;border-radius:5px;border:none;background:#eee;color:#0073b1;cursor:pointer;">Edit</button>
                      </div>
                      <div class="profile-notes-edit" data-idx="${idx}" style="display:none;margin-top:4px;">
                        <textarea class="profile-notes-textarea" style="width:98%;min-height:32px;resize:vertical;border-radius:5px;border:1px solid #bbb;font-size:14px;">${p.notes||''}</textarea>
                        <button class="profile-notes-save" data-idx="${idx}" style="margin:4px 4px 0 0;">Save</button>
                        <button class="profile-notes-cancel" data-idx="${idx}" style="margin:4px 0 0 0;">Cancel</button>
                      </div>
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
          } else {
            listDiv.innerHTML = '<div style="text-align:center;font-size:16px;color:#888;margin:30px 0;">No results found.</div>';
          }
          // Re-attach handlers for filtered list
          listDiv.querySelectorAll('.profile-delete').forEach((btn, i) => {
            btn.onclick = async function(e) {
              e.stopPropagation();
              const id = filteredProfiles[i].id;
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
          listDiv.querySelectorAll('.profile-notes-edit-btn').forEach((btn, i) => {
            btn.onclick = function() {
              const idx = btn.getAttribute('data-idx');
              const viewDiv = listDiv.querySelector('.profile-notes-view[data-idx="'+idx+'"]');
              const editDiv = listDiv.querySelector('.profile-notes-edit[data-idx="'+idx+'"]');
              if (viewDiv && editDiv) {
                viewDiv.style.display = 'none';
                editDiv.style.display = '';
                const textarea = editDiv.querySelector('.profile-notes-textarea');
                if (textarea) textarea.focus();
              }
            };
          });
          listDiv.querySelectorAll('.profile-notes-cancel').forEach((btn, i) => {
            btn.onclick = function() {
              const idx = btn.getAttribute('data-idx');
              const viewDiv = listDiv.querySelector('.profile-notes-view[data-idx="'+idx+'"]');
              const editDiv = listDiv.querySelector('.profile-notes-edit[data-idx="'+idx+'"]');
              if (viewDiv && editDiv) {
                editDiv.style.display = 'none';
                viewDiv.style.display = '';
              }
            };
          });
          listDiv.querySelectorAll('.profile-notes-save').forEach((btn, i) => {
            btn.onclick = async function() {
              const idx = btn.getAttribute('data-idx');
              const editDiv = listDiv.querySelector('.profile-notes-edit[data-idx="'+idx+'"]');
              const textarea = editDiv ? editDiv.querySelector('.profile-notes-textarea') : null;
              if (!textarea) return;
              const newNotes = textarea.value.trim();
              const profile = filteredProfiles[idx];
              btn.disabled = true;
              btn.innerText = 'Saving...';
              try {
                const resp = await fetch(`http://127.0.0.1:8000/profiles/${profile.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ notes: newNotes })
                });
                if (resp.ok) {
                  profile.notes = newNotes;
                  const viewDiv = listDiv.querySelector('.profile-notes-view[data-idx="'+idx+'"]');
                  const editDiv = listDiv.querySelector('.profile-notes-edit[data-idx="'+idx+'"]');
                  if (viewDiv && editDiv) {
                    let notesHtml;
                    if (newNotes) {
                      notesHtml = `<b>Notes:</b> ${newNotes.replace(/\n/g, '<br>')}`;
                    } else {
                      notesHtml = `<b>Notes:</b> <span style='color:#888'>(No notes added)</span>`;
                    }
                    viewDiv.innerHTML = `${notesHtml} <button class=\"profile-notes-edit-btn\" data-idx=\"${idx}\" style=\"margin-left:8px;font-size:12px;padding:1px 7px 1px 7px;border-radius:5px;border:none;background:#eee;color:#0073b1;cursor:pointer;\">Edit</button>`;
                    editDiv.style.display = 'none';
                    viewDiv.style.display = '';
                    const editBtn = viewDiv.querySelector('.profile-notes-edit-btn');
                    if (editBtn) {
                      editBtn.onclick = function() {
                        viewDiv.style.display = 'none';
                        editDiv.style.display = '';
                        const textarea = editDiv.querySelector('.profile-notes-textarea');
                        if (textarea) textarea.focus();
                      };
                    }
                  }
                  btn.disabled = false;
                  btn.innerText = 'Save';
                } else {
                  btn.innerText = 'Failed!';
                  setTimeout(() => { btn.innerText = 'Save'; btn.disabled = false; }, 1200);
                }
              } catch {
                btn.innerText = 'Failed!';
                setTimeout(() => { btn.innerText = 'Save'; btn.disabled = false; }, 1200);
              }
            };
          });
        }
        // Initial render and on input
        renderFilteredProfiles();
        searchBar.oninput = renderFilteredProfiles;
        // Update saved profiles count
        const savedHeading = document.getElementById('profile-saver-popup-saved-heading');
        if (savedHeading) {
          savedHeading.textContent = `Saved Profiles (${filteredProfiles.length})`;
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
  function renderProfileSaverPopup(profiles) {
    // Remove existing popup if present
    let popup = document.getElementById('profile-saver-popup');
    if (popup) popup.remove();

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

    // Close button
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

    // Logo and Heading
    const logoHeaderDiv = document.createElement('div');
    logoHeaderDiv.style.display = 'flex';
    logoHeaderDiv.style.alignItems = 'center';
    logoHeaderDiv.style.marginBottom = '10px';
    const logoImg = document.createElement('img');
    try {
      if (window.chrome && chrome.runtime && chrome.runtime.getURL) {
        logoImg.src = chrome.runtime.getURL('assets/TS_logo.jpg');
      } else {
        throw new Error('No chrome.runtime.getURL');
      }
    } catch (e) {
      logoImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="100%" height="100%" fill="#ccc"/></svg>';
    }
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

    // --- Current Profile Section ---
    const currentProfile = extractProfile();
    let isAlreadySaved = false;
    let savedNotes = '';
    if (Array.isArray(profiles) && currentProfile && currentProfile.url) {
      const match = profiles.find(p => p.url === currentProfile.url);
      if (match) {
        isAlreadySaved = true;
        savedNotes = match.notes || '';
      }
    }
    const currentDiv = document.createElement('div');
    currentDiv.className = 'profile-saver-current-card';
    currentDiv.style.background = '#f3f6f8';
    currentDiv.style.border = '1px solid #e0e0e0';
    currentDiv.style.borderRadius = '16px';
    currentDiv.style.boxShadow = '0 2px 8px #0001';
    currentDiv.style.padding = '16px 18px 16px 18px';
    currentDiv.style.marginBottom = '8px'; // Reduce space below card
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

    // --- Add space between card and notes ---
    const spaceDiv1 = document.createElement('div');
    spaceDiv1.style.height = '4px'; // Reduce space between card and notes
    popup.appendChild(spaceDiv1);

    // Notes textarea
    const notesInput = document.createElement('textarea');
    notesInput.id = 'profile-saver-notes';
    notesInput.placeholder = 'Add notes (optional)';
    notesInput.style.width = '98%';
    notesInput.style.minHeight = '48px';
    notesInput.style.resize = 'vertical';
    notesInput.style.margin = '0 0 6px 0'; // Reduce space below textarea
    notesInput.style.padding = '6px 10px';
    notesInput.style.borderRadius = '8px';
    notesInput.style.border = '1px solid #d1d1d1';
    notesInput.style.fontSize = '15px';
    notesInput.value = savedNotes;
    popup.appendChild(notesInput);

    // --- Add space between notes and button ---
    const spaceDiv2 = document.createElement('div');
    spaceDiv2.style.height = '2px'; // Reduce space between notes and button
    popup.appendChild(spaceDiv2);

    // Save/Update button below the notes
    const saveBtn = document.createElement('button');
    saveBtn.id = 'profile-saver-save-btn';
    saveBtn.innerText = isAlreadySaved ? 'Update' : 'Save';
    saveBtn.style.display = 'block';
    saveBtn.style.width = '100%';
    saveBtn.style.margin = '0 0 10px 0'; // Reduce space below button
    saveBtn.style.background = '#0a66c2';
    saveBtn.style.color = '#fff';
    saveBtn.style.border = 'none';
    saveBtn.style.borderRadius = '12px';
    saveBtn.style.padding = '10px 0';
    saveBtn.style.fontWeight = '600';
    saveBtn.style.fontSize = '17px';
    saveBtn.style.cursor = 'pointer';
    saveBtn.style.boxShadow = '0 2px 8px #0073b133';
    saveBtn.onmouseover = function() { this.style.background = '#004182'; };
    saveBtn.onmouseout = function() { this.style.background = '#0a66c2'; };

    saveBtn.onclick = function() {
      const profile = extractProfile();
      if (profile && profile.name) {
        const notes = notesInput.value.trim();
        profile.notes = notes;
        saveBtn.innerText = isAlreadySaved ? 'Updating...' : 'Saving...';
        saveBtn.disabled = true;
        chrome.runtime.sendMessage({ type: 'save_profile', profile }, function(response) {
          if (response && response.success) {
            saveBtn.innerText = isAlreadySaved ? 'Updated!' : 'Saved!';
            notesInput.value = '';
            fetch('http://127.0.0.1:8000/profiles')
              .then(r => r.json())
              .then(profiles => {
                renderProfileSaverPopup(profiles);
                updateFloatingButtonCount();
              });
          } else {
            saveBtn.innerText = 'Error!';
            setTimeout(() => {
              saveBtn.innerText = isAlreadySaved ? 'Update' : 'Save';
              saveBtn.disabled = false;
            }, 1500);
          }
        });
      } else {
        saveBtn.innerText = 'No Profile!';
        setTimeout(() => {
          saveBtn.innerText = isAlreadySaved ? 'Update' : 'Save';
          saveBtn.disabled = false;
        }, 1200);
      }
    };
    popup.appendChild(saveBtn);

    // Saved Profiles Section
    const savedHeading = document.createElement('div');
    savedHeading.id = 'profile-saver-popup-saved-heading';
    savedHeading.style.fontSize = '19px';
    savedHeading.style.fontWeight = 'bold';
    savedHeading.style.color = '#0073b1';
    savedHeading.style.margin = '12px 0 2px 0';
    popup.appendChild(savedHeading);

    // --- Inline Search + Sort Icon Button ---
    const searchSortRow = document.createElement('div');
    searchSortRow.style.display = 'flex';
    searchSortRow.style.alignItems = 'center';
    searchSortRow.style.gap = '8px';
    searchSortRow.style.margin = '6px 0 12px 0';

    // Search bar (reduced width)
    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.id = 'profile-saver-search';
    searchBar.placeholder = 'Search by name, title, or location...';
    searchBar.style.flex = '1';
    searchBar.style.minWidth = '0';
    searchBar.style.width = '0';
    searchBar.style.maxWidth = '250px';
    searchBar.style.padding = '7px 12px';
    searchBar.style.fontSize = '15px';
    searchBar.style.border = '1px solid #bbb';
    searchBar.style.borderRadius = '7px';
    searchBar.style.display = 'block';

    // Sort icon button
    const sortBtn = document.createElement('button');
    sortBtn.id = 'profile-saver-sort-btn';
    sortBtn.style.background = 'none';
    sortBtn.style.border = 'none';
    sortBtn.style.padding = '0 6px';
    sortBtn.style.margin = '0';
    sortBtn.style.display = 'flex';
    sortBtn.style.alignItems = 'center';
    sortBtn.style.cursor = 'pointer';
    sortBtn.style.height = '38px';
    sortBtn.style.width = '36px';
    sortBtn.style.justifyContent = 'center';
    sortBtn.style.transition = 'background 0.15s';
    sortBtn.tabIndex = 0;
    sortBtn.setAttribute('aria-label', 'Sort by name (A-Z)');
    sortBtn.title = 'Sort by name (A-Z)';
    sortBtn.onfocus = () => sortBtn.style.background = '#e7f3fa';
    sortBtn.onblur = () => sortBtn.style.background = 'none';
    sortBtn.onmouseover = () => sortBtn.style.background = '#e7f3fa';
    sortBtn.onmouseout = () => sortBtn.style.background = 'none';

    // SVG for A-Z sort (default)
    function getSortSVG(order) {
      if (order === 'az') {
        return `<svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="4" y="16" font-size="13" font-family="Arial" fill="#222">A</text><text x="15" y="16" font-size="13" font-family="Arial" fill="#222">Z</text><path d="M7 7h8" stroke="#0073b1" stroke-width="2" stroke-linecap="round"/><path d="M11 5v2" stroke="#0073b1" stroke-width="2" stroke-linecap="round"/></svg>`;
      } else {
        return `<svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="4" y="16" font-size="13" font-family="Arial" fill="#222">A</text><text x="15" y="16" font-size="13" font-family="Arial" fill="#222">Z</text><path d="M7 15h8" stroke="#0073b1" stroke-width="2" stroke-linecap="round"/><path d="M11 15v2" stroke="#0073b1" stroke-width="2" stroke-linecap="round"/></svg>`;
      }
    }
    let sortOrder = 'az';
    sortBtn.innerHTML = getSortSVG(sortOrder);

    sortBtn.onclick = function() {
      sortOrder = sortOrder === 'az' ? 'za' : 'az';
      sortBtn.innerHTML = getSortSVG(sortOrder);
      sortBtn.setAttribute('aria-label', sortOrder === 'az' ? 'Sort by name (A-Z)' : 'Sort by name (Z-A)');
      sortBtn.title = sortOrder === 'az' ? 'Sort by name (A-Z)' : 'Sort by name (Z-A)';
      renderFilteredProfiles();
    };

    searchSortRow.appendChild(searchBar);
    searchSortRow.appendChild(sortBtn);
    popup.appendChild(searchSortRow);

    const listDiv = document.createElement('div');
    listDiv.id = 'profile-saver-list';
    listDiv.style.marginTop = '0';
    popup.appendChild(listDiv);

    let filteredProfiles = profiles;
    function renderFilteredProfiles() {
      const q = searchBar.value.trim().toLowerCase();
      if (q.length >= 2) {
        filteredProfiles = profiles.filter(p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.current_title && p.current_title.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q))
        );
      } else {
        filteredProfiles = profiles;
      }
      // Sort by name
      filteredProfiles = filteredProfiles.slice().sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (sortOrder === 'az') return nameA.localeCompare(nameB);
        else return nameB.localeCompare(nameA);
      });
      savedHeading.textContent = `Saved Profiles (${filteredProfiles.length})`;
      if (filteredProfiles.length > 0) {
        listDiv.innerHTML = `
          <div style="margin-bottom:16px;font-size:15px;color:#222;">Below are all profiles saved from LinkedIn:</div>
          <div style="margin-bottom:0;">
            ${filteredProfiles.map((p, idx) => `
              <div class="profile-saver-card" style="background:#f3f6f8;border:1px solid #e0e0e0;padding:10px 14px 10px 14px;border-radius:12px;margin-bottom:14px;display:flex;align-items:center;position:relative;">
                <img src="${p.profile_pic ? p.profile_pic : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.name||'P') }" style="width:46px;height:46px;border-radius:50%;margin-right:15px;object-fit:cover;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:18px;">${p.name||''}</div>
                  <div style="font-size:15px;color:#555;margin-bottom:2px;">${p.headline||''}</div>
                  <div style="font-size:13px;color:#888;margin-bottom:2px;">${p.current_title||''}</div>
                  <div style="font-size:13px;color:#888;">${p.location||''}</div>
                  <div class="profile-notes-view" data-idx="${idx}" style="margin-top:4px;${p.notes ? '' : 'color:#888;'}">
                    <b>Notes:</b> ${p.notes ? p.notes.replace(/\n/g, '<br>') : '<span style=\'color:#888\'>(No notes added)</span>'}
                    <button class="profile-notes-edit-btn" data-idx="${idx}" style="margin-left:8px;font-size:12px;padding:1px 7px 1px 7px;border-radius:5px;border:none;background:#eee;color:#0073b1;cursor:pointer;">Edit</button>
                  </div>
                  <div class="profile-notes-edit" data-idx="${idx}" style="display:none;margin-top:4px;">
                    <textarea class="profile-notes-textarea" style="width:98%;min-height:32px;resize:vertical;border-radius:5px;border:1px solid #bbb;font-size:14px;">${p.notes||''}</textarea>
                    <button class="profile-notes-save" data-idx="${idx}" style="margin:4px 4px 0 0;">Save</button>
                    <button class="profile-notes-cancel" data-idx="${idx}" style="margin:4px 0 0 0;">Cancel</button>
                  </div>
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
      } else {
        listDiv.innerHTML = '<div style="text-align:center;font-size:16px;color:#888;margin:30px 0;">No results found.</div>';
      }
      // Re-attach handlers for filtered list
      listDiv.querySelectorAll('.profile-delete').forEach((btn, i) => {
        btn.onclick = async function(e) {
          e.stopPropagation();
          const id = filteredProfiles[i].id;
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
      listDiv.querySelectorAll('.profile-notes-edit-btn').forEach((btn, i) => {
        btn.onclick = function() {
          const idx = btn.getAttribute('data-idx');
          const viewDiv = listDiv.querySelector('.profile-notes-view[data-idx="'+idx+'"]');
          const editDiv = listDiv.querySelector('.profile-notes-edit[data-idx="'+idx+'"]');
          if (viewDiv && editDiv) {
            viewDiv.style.display = 'none';
            editDiv.style.display = '';
            const textarea = editDiv.querySelector('.profile-notes-textarea');
            if (textarea) textarea.focus();
          }
        };
      });
      listDiv.querySelectorAll('.profile-notes-cancel').forEach((btn, i) => {
        btn.onclick = function() {
          const idx = btn.getAttribute('data-idx');
          const viewDiv = listDiv.querySelector('.profile-notes-view[data-idx="'+idx+'"]');
          const editDiv = listDiv.querySelector('.profile-notes-edit[data-idx="'+idx+'"]');
          if (viewDiv && editDiv) {
            editDiv.style.display = 'none';
            viewDiv.style.display = '';
          }
        };
      });
      listDiv.querySelectorAll('.profile-notes-save').forEach((btn, i) => {
        btn.onclick = async function() {
          const idx = btn.getAttribute('data-idx');
          const editDiv = listDiv.querySelector('.profile-notes-edit[data-idx="'+idx+'"]');
          const textarea = editDiv ? editDiv.querySelector('.profile-notes-textarea') : null;
          if (!textarea) return;
          const newNotes = textarea.value.trim();
          const profile = filteredProfiles[idx];
          btn.disabled = true;
          btn.innerText = 'Saving...';
          try {
            const resp = await fetch(`http://127.0.0.1:8000/profiles/${profile.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes: newNotes })
            });
            if (resp.ok) {
              profile.notes = newNotes;
              const viewDiv = listDiv.querySelector('.profile-notes-view[data-idx="'+idx+'"]');
              const editDiv = listDiv.querySelector('.profile-notes-edit[data-idx="'+idx+'"]');
              if (viewDiv && editDiv) {
                let notesHtml;
                if (newNotes) {
                  notesHtml = `<b>Notes:</b> ${newNotes.replace(/\n/g, '<br>')}`;
                } else {
                  notesHtml = `<b>Notes:</b> <span style='color:#888'>(No notes added)</span>`;
                }
                viewDiv.innerHTML = `${notesHtml} <button class=\"profile-notes-edit-btn\" data-idx=\"${idx}\" style=\"margin-left:8px;font-size:12px;padding:1px 7px 1px 7px;border-radius:5px;border:none;background:#eee;color:#0073b1;cursor:pointer;\">Edit</button>`;
                editDiv.style.display = 'none';
                viewDiv.style.display = '';
                const editBtn = viewDiv.querySelector('.profile-notes-edit-btn');
                if (editBtn) {
                  editBtn.onclick = function() {
                    viewDiv.style.display = 'none';
                    editDiv.style.display = '';
                    const textarea = editDiv.querySelector('.profile-notes-textarea');
                    if (textarea) textarea.focus();
                  };
                }
              }
              btn.disabled = false;
              btn.innerText = 'Save';
            } else {
              btn.innerText = 'Failed!';
              setTimeout(() => { btn.innerText = 'Save'; btn.disabled = false; }, 1200);
            }
          } catch {
            btn.innerText = 'Failed!';
            setTimeout(() => { btn.innerText = 'Save'; btn.disabled = false; }, 1200);
          }
        };
      });
    }
    renderFilteredProfiles();
    searchBar.oninput = renderFilteredProfiles;
    document.body.appendChild(popup);
  }

  // Robust floating button handler: always fetch profiles, then render popup
  function robustTogglePopup() {
    fetch('http://127.0.0.1:8000/profiles')
      .then(r => r.json())
      .then(profiles => {
        renderProfileSaverPopup(profiles);
      })
      .catch(() => {
        // Fallback: show error popup
        let popup = document.getElementById('profile-saver-popup');
        if (popup) popup.remove();
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
        popup.innerHTML = '<div style="color:red;font-size:18px;margin:30px 0;">Error loading profiles. Please check your backend.</div>';
        document.body.appendChild(popup);
      });
  }

  function updateFloatingButtonCount() {
    showFloatingButtonSpinner(true);
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'get_count' }, (response) => {
        if (response && typeof response.count === 'number') {
          debug('Fetched saved profiles count', response);
          document.getElementById('profile-saver-count').innerText = response.count;
        } else {
          debug('Fetched saved profiles count (fallback)', response);
          document.getElementById('profile-saver-count').innerText = '0';
        }
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

  // Listen for browser navigation and profile changes to refresh popup
  window.addEventListener('popstate', function() {
    const popup = document.getElementById('profile-saver-popup');
    if (popup) popup.remove();
    setTimeout(() => {
      // Re-inject popup only if floating button is present (user expects it open)
      if (document.getElementById('profile-saver-float-btn')) {
        robustTogglePopup();
      }
    }, 400);
  });

  // --- Robust navigation detection for LinkedIn SPA ---
  (function(history) {
    // Patch pushState
    const origPushState = history.pushState;
    history.pushState = function(state) {
      const ret = origPushState.apply(history, arguments);
      setTimeout(() => {
        const popup = document.getElementById('profile-saver-popup');
        if (popup) popup.remove();
        setTimeout(() => {
          if (document.getElementById('profile-saver-float-btn')) {
            robustTogglePopup();
          }
        }, 400);
      }, 0);
      return ret;
    };
    // Patch replaceState
    const origReplaceState = history.replaceState;
    history.replaceState = function(state) {
      const ret = origReplaceState.apply(history, arguments);
      setTimeout(() => {
        const popup = document.getElementById('profile-saver-popup');
        if (popup) popup.remove();
        setTimeout(() => {
          if (document.getElementById('profile-saver-float-btn')) {
            robustTogglePopup();
          }
        }, 400);
      }, 0);
      return ret;
    };
  })(window.history);

  // --- Fallback: Observe location changes (for any missed SPA navigation) ---
  let lastProfileUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastProfileUrl) {
      lastProfileUrl = window.location.href;
      const popup = document.getElementById('profile-saver-popup');
      if (popup) {
        popup.remove();
        setTimeout(() => {
          if (document.getElementById('profile-saver-float-btn')) {
            robustTogglePopup();
          }
        }, 400);
      }
    }
  }, 500);

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
