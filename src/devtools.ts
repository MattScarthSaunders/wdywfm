// Create the DevTools panel
chrome.devtools.panels.create(
  "Network Analysis",
  "icons/icon48.png",
  "panel.html",
  (panel) => {
    // Panel created
  }
);

