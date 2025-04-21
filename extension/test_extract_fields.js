// Test script to extract all LinkedIn profile fields from a local HTML file using Node.js and jsdom
// Usage: node test_extract_fields.js test_title.html

const fs = require('fs');
const { JSDOM } = require('jsdom');

function extractAboutSection(document) {
  const sections = document.querySelectorAll('section');
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const h2s = section.querySelectorAll('h2');
    for (let j = 0; j < h2s.length; j++) {
      const h2 = h2s[j];
      const aboutSpan = h2.querySelector('span[aria-hidden="true"]');
      if (
        aboutSpan &&
        aboutSpan.textContent.trim().toLowerCase() === 'about'
      ) {
        // First, try expanded/collapsed divs (like test_extract_about.js)
        let expandedDiv = section.querySelector('div.inline-show-more-text--is-expanded');
        if (!expandedDiv) {
          expandedDiv = section.querySelector('div.inline-show-more-text--is-collapsed');
        }
        if (expandedDiv) {
          const span = expandedDiv.querySelector('span[aria-hidden="true"]');
          if (span) {
            let aboutHtml = span.innerHTML;
            let aboutText = aboutHtml.replace(/<br\s*\/?>/gi, '\n');
            aboutText = aboutText.replace(/<[^>]+>/g, '').trim();
            return aboutText;
          }
        }
        // Fallback: try other spans or text nodes
        const aboutContent = section.querySelector('.pv-shared-text-with-see-more span[aria-hidden="true"], .break-words span[aria-hidden="true"], .visually-hidden');
        if (aboutContent) {
          return aboutContent.textContent.trim();
        }
        // Fallback: concatenate all non-heading text nodes in the section
        let aboutText = '';
        const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
          if (node.parentNode && node.parentNode.tagName !== 'H2') {
            aboutText += node.textContent.trim() + ' ';
          }
        }
        return aboutText.trim();
      }
    }
  }
  return '';
}

function extractProfileFields(document, htmlFile) {
  // Name
  const name = document.querySelector('h1.inline.t-24.v-align-middle.break-words')?.textContent.trim() ||
               document.querySelector('h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words')?.textContent.trim() || '';

  // Headline
  const headline = document.querySelector('.text-body-medium.break-words')?.textContent.trim() || '';

  // Location
  const location = document.querySelector('.text-body-small.inline.t-black--light.break-words')?.textContent.trim() ||
                   document.querySelector('.text-body-small.break-words')?.textContent.trim() || '';

  // Profile Pic
  let profilePic = '';
  let mainImg = document.querySelector('.pv-top-card-profile-picture__image');
  if (!mainImg) mainImg = document.querySelector('img.pv-top-card-profile-picture__image--show');
  if (!mainImg) {
    const container = document.querySelector('.pv-top-card-profile-picture__container');
    if (container) mainImg = container.querySelector('img');
  }
  if (!mainImg) {
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
    if (meta && meta.content) profilePic = meta.content;
  }

  // About Section (use robust logic)
  const about = extractAboutSection(document);

  // Current Title (robust, from Experience section)
  let currentTitle = '';
  const sections = Array.from(document.querySelectorAll('section, div'));
  let expSection = null;
  for (const section of sections) {
    const h2 = section.querySelector('h2, .pvs-header__title');
    if (h2 && h2.textContent && h2.textContent.toLowerCase().includes('experience')) {
      expSection = section;
      break;
    }
  }
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
    if (firstExp) currentTitle = firstExp.textContent.trim();
  }

  // URL (mimic extension logic: use window.location.href if present, else file path)
  let url = '';
  if (typeof window !== 'undefined' && window.location && window.location.href && !window.location.href.startsWith('about:blank')) {
    url = window.location.href;
  } else if (htmlFile) {
    url = `file://${require('path').resolve(htmlFile)}`;
  }

  return { name, headline, current_title: currentTitle, location, profile_pic: profilePic, about, url };
}

if (process.argv.length < 3) {
  console.error('Usage: node test_extract_fields.js <html_file>');
  process.exit(1);
}

const htmlFile = process.argv[2];
const html = fs.readFileSync(htmlFile, 'utf-8');
const dom = new JSDOM(html);
const document = dom.window.document;

const fields = extractProfileFields(document, htmlFile);
console.log('Extracted Fields:', fields);
