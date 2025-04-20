// Test script to extract the About section from a local HTML file using Node.js and jsdom
// Usage: node test_extract_about.js test_about.html

const fs = require('fs');
const { JSDOM } = require('jsdom');

function extractExpandedAbout(document) {
  // 1. Find all <section> elements
  const sections = document.querySelectorAll('section');
  console.log(`Found ${sections.length} <section> elements.`);
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    // 2. Find <h2> with a <span aria-hidden="true">About</span>
    const h2s = section.querySelectorAll('h2');
    for (let j = 0; j < h2s.length; j++) {
      const h2 = h2s[j];
      const aboutSpan = h2.querySelector('span[aria-hidden="true"]');
      console.log(`Section ${i}, h2 ${j}: h2.textContent = '${h2.textContent.trim()}', aboutSpan = ${aboutSpan ? aboutSpan.textContent.trim() : 'null'}`);
      if (
        aboutSpan &&
        aboutSpan.textContent.trim().toLowerCase() === 'about'
      ) {
        console.log(`Found candidate About section in section ${i}, h2 ${j}`);
        // 3. Find the expanded about text container
        let expandedDiv = section.querySelector('div.inline-show-more-text--is-expanded');
        if (!expandedDiv) {
          // 4. If not expanded, try collapsed
          expandedDiv = section.querySelector('div.inline-show-more-text--is-collapsed');
        }
        if (expandedDiv) {
          const span = expandedDiv.querySelector('span[aria-hidden="true"]');
          if (span) {
            let aboutHtml = span.innerHTML;
            let aboutText = aboutHtml.replace(/<br\s*\/?>(\n)?/gi, '\n');
            aboutText = aboutText.replace(/<[^>]+>/g, '').trim();
            return aboutText;
          } else {
            console.log('No <span aria-hidden="true"> found in expanded/collapsed div.');
          }
        } else {
          console.log('No expanded/collapsed div found in candidate About section.');
        }
      }
    }
  }
  return null;
}

// Main execution
if (process.argv.length < 3) {
  console.error('Usage: node test_extract_about.js <html_file>');
  process.exit(1);
}

const htmlFile = process.argv[2];
const htmlContent = fs.readFileSync(htmlFile, 'utf8');
const dom = new JSDOM(htmlContent);
const aboutText = extractExpandedAbout(dom.window.document);

if (aboutText) {
  console.log('Extracted About Section:\n');
  console.log(aboutText);
  // Write to file for verification
  fs.writeFileSync('about_extracted.txt', aboutText, 'utf8');
  console.log('\nExtracted About section saved to about_extracted.txt');
} else {
  console.log('About section not found.');
}
