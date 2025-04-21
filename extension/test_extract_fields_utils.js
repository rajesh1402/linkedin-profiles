// Test script to extract all LinkedIn profile fields using extension's content_utils.js
// Usage: node test_extract_fields_utils.js <html_file>

const fs = require('fs');
const { JSDOM } = require('jsdom');
const { extractProfile, extractAboutSection } = require('./content_utils');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node test_extract_fields_utils.js <html_file>');
  process.exit(1);
}

const htmlFile = process.argv[2];
const html = fs.readFileSync(htmlFile, 'utf-8');
const dom = new JSDOM(html);
const document = dom.window.document;

// Use the extension's extraction utilities
document.defaultView = dom.window; // For selectors that might rely on window

// --- DEBUG: Print what selectors see in test HTML ---
function debugSelectors(document) {
  const selectors = [
    { label: 'name', sel: 'h1.inline.t-24.v-align-middle.break-words' },
    { label: 'headline', sel: '.text-body-medium.break-words' },
    { label: 'location', sel: '.text-body-small.inline.t-black--light.break-words' },
    { label: 'current_title', sel: '.pv-position-entity .t-16.t-black.t-bold' },
    { label: 'profile_pic', sel: '.pv-top-card-profile-picture__image' },
  ];
  for (const { label, sel } of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      console.log(`[DEBUG] Selector '${sel}' for ${label}:`, el.textContent || el.src || '(no text)');
    } else {
      console.log(`[DEBUG] Selector '${sel}' for ${label}: NOT FOUND`);
    }
  }
}

debugSelectors(document);

// --- DEBUG: Print raw HTML for education and skills extraction ---
function debugEducationAndSkills(document) {
  // Education
  const eduSections = Array.from(document.querySelectorAll('section, div'));
  let eduSection = null;
  for (const section of eduSections) {
    const h2 = section.querySelector('h2, .pvs-header__title');
    if (h2 && h2.textContent && h2.textContent.toLowerCase().includes('education')) {
      eduSection = section;
      break;
    }
  }
  if (eduSection) {
    const schools = Array.from(eduSection.querySelectorAll('.pv-education-entity, .pvs-entity, li'));
    schools.forEach((school, i) => {
      console.log(`[DEBUG] Education node #${i} HTML:\n`, school.outerHTML);
    });
  } else {
    console.log('[DEBUG] No education section found');
  }

  // Skills
  let skillsSection = null;
  for (const section of eduSections) {
    const h2 = section.querySelector('h2, .pvs-header__title');
    if (h2 && h2.textContent && h2.textContent.toLowerCase().includes('skills')) {
      skillsSection = section;
      break;
    }
  }
  if (skillsSection) {
    const skillsNodes = Array.from(skillsSection.querySelectorAll('span[aria-hidden="true"], .pvs-entity__skill span'));
    skillsNodes.forEach((node, i) => {
      console.log(`[DEBUG] Skill node #${i} text:`, node.textContent.trim());
      console.log(`[DEBUG] Skill node #${i} HTML:\n`, node.outerHTML);
    });
  } else {
    console.log('[DEBUG] No skills section found');
  }
}

debugEducationAndSkills(document);

// Patch: Simulate window.location.href for extension extraction logic (robust for jsdom)
try {
  // If possible, patch the href property directly
  Object.defineProperty(dom.window.location, 'href', {
    value: `file://${path.resolve(htmlFile)}`,
    writable: true
  });
} catch (e) {
  // fallback: patch the whole location object if needed
  try {
    dom.window.location = { href: `file://${path.resolve(htmlFile)}` };
  } catch (e2) {
    // fallback: ignore if still fails
  }
}

const profile = extractProfile(document);
console.log('Extracted Profile:', JSON.stringify(profile, null, 2));

const about = extractAboutSection(document);
console.log('\nExtracted About Section:\n', about);
