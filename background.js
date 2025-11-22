// Background service worker
// This extension primarily uses DevTools API, so background script is minimal

chrome.runtime.onInstalled.addListener(() => {
  // Extension installed
});

// Listen for messages from the panel if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCookies') {
    // Get cookies for a specific domain
    chrome.cookies.getAll({ domain: request.domain }, (cookies) => {
      sendResponse({ cookies });
    });
    return true; // Indicates we will send a response asynchronously
  }
});
