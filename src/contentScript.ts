let captureModeActive = false;

function handleClick(event: MouseEvent) {
  if (!captureModeActive) {
    return;
  }

  captureModeActive = false;
  document.removeEventListener('click', handleClick, true);

  const target = event.target as HTMLElement | null;
  let text = '';

  if (target) {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      text = target.value || '';
    } else {
      text = target.innerText || target.textContent || '';
    }
  }

  text = text.trim();

  try {
    chrome.runtime.sendMessage({
      action: 'capturedValue',
      value: text,
    });
  } catch {
    // fail silently – this runs in the inspected page
  }
}

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (!message || typeof message.action !== 'string') {
    return;
  }

  if (message.action === 'enableCaptureMode') {
    captureModeActive = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('click', handleClick, true);
  }

  if (message.action === 'disableCaptureMode') {
    captureModeActive = false;
    document.body.style.cursor = '';
    document.removeEventListener('click', handleClick, true);
  }
});

