// Utility functions for LinkedIn Profile Saver extension
// Extract the expanded or collapsed About section from LinkedIn profiles
function extractAboutSection() {
  const sections = document.querySelectorAll('section');
  for (let section of sections) {
    const h2s = section.querySelectorAll('h2');
    for (let h2 of h2s) {
      const aboutSpan = h2.querySelector('span[aria-hidden="true"]');
      if (
        aboutSpan &&
        aboutSpan.textContent.trim().toLowerCase() === 'about'
      ) {
        let expandedDiv = section.querySelector('div.inline-show-more-text--is-expanded');
        if (!expandedDiv) {
          expandedDiv = section.querySelector('div.inline-show-more-text--is-collapsed');
        }
        if (expandedDiv) {
          const span = expandedDiv.querySelector('span[aria-hidden="true"]');
          if (span) {
            let aboutHtml = span.innerHTML;
            let aboutText = aboutHtml.replace(/<br\s*\/?>(\n)?/gi, '\n');
            aboutText = aboutText.replace(/<[^>]+>/g, '').trim();
            return aboutText;
          }
        }
      }
    }
  }
  return null;
}

// Export for use in content.js
window.extractAboutSection = extractAboutSection;
