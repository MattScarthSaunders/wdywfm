# Network Analysis Chrome Extension

A powerful Chrome extension that provides advanced network request analysis with session tracking and bot detection capabilities. This extension integrates with Chrome DevTools to give you comprehensive insights into network traffic.

## Features

1. **Filter Input** - Full compatibility with Chrome DevTools Network tab filter syntax
2. **Network Request Data** - Access to all network request information
3. **Header Tracking** - Records all headers passed between requests, including:
   - Set-Cookie headers
   - Session cookies
   - Authentication headers
   - Custom headers
4. **Session Request Highlighting** - Automatically identifies and highlights likely session-related requests
5. **Bot Detection Identification** - Detects the presence of bot-detection measures including:
   - Cloudflare protection
   - Other CDN/WAF services
   - Captcha services
   - Fingerprinting mechanisms
6. **Clean Interface** - Modern, intuitive UI for exploring network data

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `network-analysis` directory
5. Open Chrome DevTools (F12)
6. Look for the "Network Analysis" tab in the DevTools panel

## Usage

### Filtering Requests

The filter input supports the same syntax as Chrome DevTools Network tab:

- **Text search**: Type any text to search in URL, method, status, or type
- **Property filters**:
  - `status-code:200` - Filter by status code
  - `method:GET` - Filter by HTTP method
  - `domain:example.com` - Filter by domain
  - `larger-than:1000` - Show requests larger than specified bytes
  - `smaller-than:500` - Show requests smaller than specified bytes
  - `mime-type:json` - Filter by MIME type
  - `has-response-header:set-cookie` - Filter by response headers

Examples:
- `status-code:200 method:GET` - GET requests with 200 status
- `domain:api.example.com larger-than:5000` - Large requests from API domain
- `json` - All requests containing "json" in URL or type

### Viewing Request Details

Click on any request in the table to view detailed information:
- General request information
- Request headers
- Response headers
- Cookies (both request and set-cookie)
- Session analysis
- Bot detection analysis

### Session Detection

The extension automatically identifies session-related requests based on:
- URL patterns (login, auth, session, token, etc.)
- Request/response headers (Authorization, Set-Cookie, etc.)
- Cookie names containing session indicators
- Authentication status codes (401, 403)

Session requests are highlighted in orange in the table.

### Bot Detection

The extension identifies bot detection measures by checking for:
- Bot detection services (Cloudflare, Akamai, etc.)
- Specific headers (CF-Ray, etc.)
- URL patterns (captcha, challenge, etc.)
- Suspicious request characteristics

Bot detection indicators are highlighted with a red border and badge.

### Exporting Data

Click the "Export" button to download all captured network data as JSON.

## File Structure

```
network-analysis/
├── manifest.json          # Extension manifest
├── devtools.html          # DevTools page entry point
├── devtools.js            # DevTools panel creation
├── panel.html             # Main panel UI
├── panel.js               # Panel logic and event handlers
├── utils.js               # Utility classes (filtering, detection, parsing)
├── styles.css             # UI styles
├── background.js          # Background service worker
```

## Permissions

This extension requires the following permissions:
- `storage` - To save user preferences
- `webRequest` - To access network request data
- `cookies` - To read cookie information
- `host_permissions: <all_urls>` - To monitor all network traffic

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload the DevTools panel

## Notes

- The extension only captures network requests while DevTools is open
- Data is stored in memory and cleared when the page is refreshed (unless "Preserve log" is enabled)
- The extension works best when DevTools is open from the start of page load

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
