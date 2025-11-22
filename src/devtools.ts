// Create the DevTools panel
chrome.devtools.panels.create(
  "Network Analysis",
  undefined,
  "panel.html",
  (panel) => {
    // Panel created
  }
);

