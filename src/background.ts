chrome.runtime.onInstalled.addListener(() => {
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCookies') {
    chrome.cookies.getAll({ domain: request.domain }, (cookies) => {
      sendResponse({ cookies });
    });
    return true;
  }

  if (request.action === 'enableCaptureMode' || request.action === 'disableCaptureMode') {
    // Forward capture mode toggle to the active tab so the content script can handle it
    if (typeof request.tabId === 'number') {
      chrome.tabs.sendMessage(request.tabId, { action: request.action });
    } else if (sender.tab && sender.tab.id !== undefined) {
      chrome.tabs.sendMessage(sender.tab.id, { action: request.action });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        for (const tab of tabs) {
          if (tab.id !== undefined) {
            chrome.tabs.sendMessage(tab.id, { action: request.action });
          }
        }
      });
    }
    return false;
  }

  if (request.action === 'capturedValue') {
    // Forward captured value back to any devtools / panel listeners
    chrome.runtime.sendMessage({
      action: 'capturedValue',
      value: request.value,
    });
    return false;
  }

  return false;
});
