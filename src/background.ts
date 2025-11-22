chrome.runtime.onInstalled.addListener(() => {
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCookies') {
    chrome.cookies.getAll({ domain: request.domain }, (cookies) => {
      sendResponse({ cookies });
    });
    return true;
  }
  return false;
});

