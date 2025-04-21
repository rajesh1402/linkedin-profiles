// Test script to extract the current title from a local HTML file using Node.js and jsdom
// Usage: node test_extract_title.js test_title.html

const fs = require('fs');
const { JSDOM } = require('jsdom');

function extractCurrentTitle(document) {
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
    if (firstExp) currentTitle = firstExp.textContent.trim();
  }

  // 3. Fallback: headline (least preferred)
  if (!currentTitle) {
    const pos = document.querySelector('.text-body-medium.break-words');
    if (pos) currentTitle = pos.textContent.trim();
  }
  return currentTitle;
}

if (process.argv.length < 3) {
  console.error('Usage: node test_extract_title.js <html_file>');
  process.exit(1);
}

const htmlFile = process.argv[2];
const html = fs.readFileSync(htmlFile, 'utf-8');
const dom = new JSDOM(html);
const document = dom.window.document;

const title = extractCurrentTitle(document);
console.log('Extracted Current Title:', title);
