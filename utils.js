// Utility functions for network analysis

// Filter parser - matches Chrome DevTools Network tab filter syntax
class FilterParser {
  constructor() {
    this.filters = [];
  }

  parse(filterString) {
    if (!filterString || !filterString.trim()) {
      return null;
    }

    const parts = filterString.trim().split(/\s+/);
    this.filters = [];

    for (const part of parts) {
      if (part.includes(':')) {
        const [key, value] = part.split(':', 2);
        this.filters.push({ type: 'property', key: key.toLowerCase(), value: value.toLowerCase() });
      } else {
        this.filters.push({ type: 'text', value: part.toLowerCase() });
      }
    }

    return this;
  }

  matches(request) {
    if (!this.filters || this.filters.length === 0) {
      return true;
    }

    return this.filters.every(filter => {
      if (filter.type === 'property') {
        return this.matchProperty(request, filter.key, filter.value);
      } else {
        return this.matchText(request, filter.value);
      }
    });
  }

  matchProperty(request, key, value) {
    switch (key) {
      case 'status-code':
      case 'status':
        return String(request.status).includes(value);
      case 'method':
        return request.method.toLowerCase().includes(value);
      case 'domain':
        try {
          const url = new URL(request.url);
          return url.hostname.toLowerCase().includes(value);
        } catch {
          return false;
        }
      case 'larger-than':
        const size = parseInt(value);
        return request.size > size;
      case 'smaller-than':
        const size2 = parseInt(value);
        return request.size < size2;
      case 'has-response-header':
        return Object.keys(request.responseHeaders || {}).some(
          h => h.toLowerCase().includes(value)
        );
      case 'is':
        if (value === 'running') {
          return request.status === 0 || request.status === undefined;
        }
        return false;
      case 'mime-type':
        const contentType = request.responseHeaders?.['content-type'] || '';
        return contentType.toLowerCase().includes(value);
      default:
        return false;
    }
  }

  matchText(request, value) {
    const searchText = value.toLowerCase();
    
    // Search in URL
    if (request.url.toLowerCase().includes(searchText)) {
      return true;
    }
    
    // Search in method
    if (request.method.toLowerCase().includes(searchText)) {
      return true;
    }
    
    // Search in status
    if (String(request.status).includes(searchText)) {
      return true;
    }
    
    // Search in type
    if (request.type && request.type.toLowerCase().includes(searchText)) {
      return true;
    }
    
    return false;
  }
}

// Session detection
class SessionDetector {
  constructor() {
    this.sessionIndicators = [
      'session',
      'auth',
      'login',
      'token',
      'jwt',
      'csrf',
      'xsrf',
      'refresh',
      'oauth',
      'sso',
      'identity',
      'user',
      'account',
      'signin',
      'signout',
      'logout'
    ];
    
    this.sessionHeaders = [
      'set-cookie',
      'authorization',
      'x-auth-token',
      'x-csrf-token',
      'x-xsrf-token',
      'x-session-id',
      'x-api-key'
    ];
  }

  isSessionRequest(request) {
    // Check URL
    const urlLower = request.url.toLowerCase();
    if (this.sessionIndicators.some(indicator => urlLower.includes(indicator))) {
      return { isSession: true, reason: 'URL contains session-related keywords' };
    }

    // Check request headers
    const requestHeaders = request.requestHeaders || {};
    for (const [key, value] of Object.entries(requestHeaders)) {
      const keyLower = key.toLowerCase();
      if (this.sessionHeaders.some(header => keyLower.includes(header))) {
        return { isSession: true, reason: `Request header: ${key}` };
      }
      if (keyLower === 'cookie' && this.hasSessionCookie(value)) {
        return { isSession: true, reason: 'Request contains session cookies' };
      }
    }

    // Check response headers
    const responseHeaders = request.responseHeaders || {};
    for (const [key, value] of Object.entries(responseHeaders)) {
      const keyLower = key.toLowerCase();
      if (keyLower === 'set-cookie') {
        const cookies = Array.isArray(value) ? value : [value];
        if (cookies.some(cookie => this.isSessionCookie(cookie))) {
          return { isSession: true, reason: 'Response sets session cookies' };
        }
      }
      if (this.sessionHeaders.some(header => keyLower.includes(header))) {
        return { isSession: true, reason: `Response header: ${key}` };
      }
    }

    // Check status codes (auth-related)
    if (request.status === 401 || request.status === 403) {
      return { isSession: true, reason: 'Authentication status code' };
    }

    return { isSession: false, reason: null };
  }

  hasSessionCookie(cookieString) {
    if (!cookieString) return false;
    const sessionCookieNames = ['session', 'sess', 'sid', 'jsessionid', 'phpsessid', 'asp.net_sessionid'];
    return sessionCookieNames.some(name => cookieString.toLowerCase().includes(name + '='));
  }

  isSessionCookie(cookieString) {
    if (!cookieString) return false;
    const sessionIndicators = ['session', 'sess', 'sid', 'auth', 'token'];
    return sessionIndicators.some(indicator => cookieString.toLowerCase().includes(indicator));
  }
}

// Bot detection analyzer
class BotDetector {
  constructor() {
    this.botDetectionHeaders = [
      'cf-ray', // Cloudflare
      'cf-connecting-ip',
      'x-forwarded-for',
      'x-real-ip',
      'x-vercel-id',
      'server',
      'via'
    ];

    this.botDetectionServices = [
      'cloudflare',
      'cloudfront',
      'akamai',
      'fastly',
      'incapsula',
      'imperva',
      'sucuri',
      'datadome',
      'perimeterx',
      'shape security',
      'human security',
      'f5',
      'barracuda'
    ];

    this.botDetectionPatterns = [
      /bot/i,
      /captcha/i,
      /challenge/i,
      /verification/i,
      /recaptcha/i,
      /hcaptcha/i,
      /turnstile/i,
      /fingerprint/i,
      /device.*id/i,
      /browser.*id/i
    ];

    // Known bot-detection providers with their identifying characteristics
    this.botDetectionProviders = [
      {
        name: 'Cloudflare',
        patterns: [
          { type: 'header', name: 'cf-ray', regex: null },
          { type: 'header', name: 'cf-connecting-ip', regex: null },
          { type: 'header', name: 'cf-visitor', regex: null },
          { type: 'header', name: 'cf-ipcountry', regex: null },
          { type: 'header', name: 'cf-ray', regex: null },
          { type: 'server', value: 'cloudflare', regex: /cloudflare/i },
          { type: 'cookie', name: '__cf_bm', regex: null },
          { type: 'cookie', name: 'cf_clearance', regex: null },
          { type: 'url', regex: /cloudflare/i }
        ]
      },
      {
        name: 'DataDome',
        patterns: [
          { type: 'header', name: 'x-datadome', regex: /^x-datadome/i },
          { type: 'cookie', name: 'datadome', regex: /datadome/i },
          { type: 'url', regex: /datadome/i }
        ]
      },
      {
        name: 'PerimeterX',
        patterns: [
          { type: 'header', name: 'x-px', regex: /^x-px/i },
          { type: 'cookie', name: '_px', regex: /^_px/i },
          { type: 'cookie', name: 'px-captcha', regex: null },
          { type: 'url', regex: /perimeterx|px-captcha/i }
        ]
      },
      {
        name: 'Imperva (Incapsula)',
        patterns: [
          { type: 'header', name: 'x-iinfo', regex: null },
          { type: 'header', name: 'x-cdn', regex: null },
          { type: 'cookie', name: 'incap_ses', regex: null },
          { type: 'cookie', name: 'visid_incap', regex: null },
          { type: 'server', value: 'incapsula', regex: /incapsula/i },
          { type: 'url', regex: /incapsula|imperva/i }
        ]
      },
      {
        name: 'Akamai',
        patterns: [
          { type: 'header', name: 'x-akamai', regex: /^x-akamai/i },
          { type: 'server', value: 'akamai', regex: /akamai/i },
          { type: 'via', value: 'akamai', regex: /akamai/i },
          { type: 'url', regex: /akamai/i }
        ]
      },
      {
        name: 'AWS CloudFront',
        patterns: [
          { type: 'header', name: 'x-amz-cf', regex: /^x-amz-cf/i },
          { type: 'server', value: 'cloudfront', regex: /cloudfront/i },
          { type: 'via', value: 'cloudfront', regex: /cloudfront/i },
          { type: 'url', regex: /cloudfront/i }
        ]
      },
      {
        name: 'Fastly',
        patterns: [
          { type: 'header', name: 'x-fastly', regex: /^x-fastly/i },
          { type: 'server', value: 'fastly', regex: /fastly/i },
          { type: 'via', value: 'fastly', regex: /fastly/i },
          { type: 'url', regex: /fastly/i }
        ]
      },
      {
        name: 'Sucuri',
        patterns: [
          { type: 'header', name: 'x-sucuri', regex: /^x-sucuri/i },
          { type: 'cookie', name: 'sucuri', regex: /sucuri/i },
          { type: 'server', value: 'sucuri', regex: /sucuri/i },
          { type: 'url', regex: /sucuri/i }
        ]
      },
      {
        name: 'F5',
        patterns: [
          { type: 'header', name: 'x-f5', regex: /^x-f5/i },
          { type: 'server', value: 'f5', regex: /f5/i },
          { type: 'url', regex: /f5bigip/i }
        ]
      },
      {
        name: 'Barracuda',
        patterns: [
          { type: 'header', name: 'x-barracuda', regex: /^x-barracuda/i },
          { type: 'server', value: 'barracuda', regex: /barracuda/i },
          { type: 'url', regex: /barracuda/i }
        ]
      },
      {
        name: 'Shape Security',
        patterns: [
          { type: 'header', name: 'x-shape', regex: /^x-shape/i },
          { type: 'cookie', name: 'shape', regex: /shape/i },
          { type: 'url', regex: /shapesecurity|shape/i }
        ]
      },
      {
        name: 'Human Security (formerly White Ops)',
        patterns: [
          { type: 'header', name: 'x-human', regex: /^x-human/i },
          { type: 'cookie', name: 'human', regex: /human/i },
          { type: 'url', regex: /humansecurity|whiteops/i }
        ]
      },
      {
        name: 'Kasada',
        patterns: [
          { type: 'header', name: 'x-kpsdk', regex: /^x-kpsdk/i },
          { type: 'cookie', name: 'kasada', regex: /kasada/i },
          { type: 'url', regex: /kasada/i }
        ]
      },
      {
        name: 'Radware',
        patterns: [
          { type: 'header', name: 'x-radware', regex: /^x-radware/i },
          { type: 'server', value: 'radware', regex: /radware/i },
          { type: 'url', regex: /radware/i }
        ]
      },
      {
        name: 'Google reCAPTCHA',
        patterns: [
          { type: 'url', regex: /recaptcha|google\.com\/recaptcha/i },
          { type: 'header', name: 'g-recaptcha', regex: /g-recaptcha/i },
          { type: 'cookie', name: 'recaptcha', regex: /recaptcha/i }
        ]
      },
      {
        name: 'hCaptcha',
        patterns: [
          { type: 'url', regex: /hcaptcha/i },
          { type: 'cookie', name: 'hcaptcha', regex: /hcaptcha/i }
        ]
      },
      {
        name: 'Cloudflare Turnstile',
        patterns: [
          { type: 'url', regex: /turnstile|challenges\.cloudflare\.com/i },
          { type: 'cookie', name: 'cf_turnstile', regex: null }
        ]
      },
      {
        name: 'Vercel',
        patterns: [
          { type: 'header', name: 'x-vercel-id', regex: null },
          { type: 'header', name: 'x-vercel', regex: /^x-vercel/i },
          { type: 'server', value: 'vercel', regex: /vercel/i }
        ]
      },
      {
        name: 'AWS WAF',
        patterns: [
          { type: 'header', name: 'x-amzn', regex: /^x-amzn/i },
          { type: 'server', value: 'awswaf', regex: /awswaf/i }
        ]
      },
      {
        name: 'Azure Application Gateway',
        patterns: [
          { type: 'header', name: 'x-azure', regex: /^x-azure/i },
          { type: 'server', value: 'microsoft', regex: /microsoft.*gateway/i }
        ]
      }
    ];
  }

  detect(request) {
    const indicators = [];
    const matchedProviders = new Set();

    const requestHeaders = request.requestHeaders || {};
    const responseHeaders = request.responseHeaders || {};
    const urlLower = request.url.toLowerCase();
    const serverHeader = (responseHeaders['server'] || '').toLowerCase();
    const viaHeader = (responseHeaders['via'] || '').toLowerCase();

    // Get all cookies from request and response
    const requestCookies = request.cookies || [];
    const responseCookies = request.setCookies || [];
    const allCookieNames = [
      ...requestCookies.map(c => c.name.toLowerCase()),
      ...responseCookies.map(c => c.name.toLowerCase())
    ];
    const allCookieStrings = [
      ...requestCookies.map(c => `${c.name}=${c.value}`.toLowerCase()),
      ...responseCookies.map(c => `${c.name}=${c.value}`.toLowerCase())
    ];

    // Check each provider
    for (const provider of this.botDetectionProviders) {
      let matched = false;

      for (const pattern of provider.patterns) {
        if (pattern.type === 'header') {
          // Check if header exists (exact match or regex)
          if (pattern.regex) {
            // Check all headers for regex match
            const allHeaders = { ...requestHeaders, ...responseHeaders };
            for (const [headerName, headerValue] of Object.entries(allHeaders)) {
              if (pattern.regex.test(headerName)) {
                matched = true;
                break;
              }
            }
          } else {
            // Exact header name match (case-insensitive)
            const headerKeys = Object.keys({ ...requestHeaders, ...responseHeaders });
            if (headerKeys.some(key => key.toLowerCase() === pattern.name.toLowerCase())) {
              matched = true;
            }
          }
        } else if (pattern.type === 'server') {
          if (pattern.regex) {
            if (pattern.regex.test(serverHeader)) {
              matched = true;
            }
          } else if (serverHeader.includes(pattern.value.toLowerCase())) {
            matched = true;
          }
        } else if (pattern.type === 'via') {
          if (pattern.regex) {
            if (pattern.regex.test(viaHeader)) {
              matched = true;
            }
          } else if (viaHeader.includes(pattern.value.toLowerCase())) {
            matched = true;
          }
        } else if (pattern.type === 'cookie') {
          if (pattern.regex) {
            // Check cookie names and full cookie strings
            if (allCookieNames.some(name => pattern.regex.test(name)) ||
                allCookieStrings.some(cookie => pattern.regex.test(cookie))) {
              matched = true;
            }
          } else {
            // Exact cookie name match (case-insensitive)
            if (allCookieNames.includes(pattern.name.toLowerCase())) {
              matched = true;
            }
          }
        } else if (pattern.type === 'url') {
          if (pattern.regex && pattern.regex.test(urlLower)) {
            matched = true;
          }
        }

        if (matched) break;
      }

      if (matched) {
        matchedProviders.add(provider.name);
      }
    }

    // Legacy checks for indicators (keep existing logic)
    for (const service of this.botDetectionServices) {
      if (serverHeader.includes(service) || viaHeader.includes(service)) {
        indicators.push(`Bot detection service: ${service}`);
      }
    }

    // Check for Cloudflare-specific headers
    if (responseHeaders['cf-ray']) {
      indicators.push('Cloudflare protection detected');
    }

    // Check URL for bot detection patterns
    for (const pattern of this.botDetectionPatterns) {
      if (pattern.test(urlLower)) {
        indicators.push(`URL contains bot detection pattern`);
        break;
      }
    }

    // Check for specific status codes that might indicate challenges
    if (request.status === 403 && responseHeaders['cf-ray']) {
      indicators.push('Cloudflare challenge (403)');
    }

    // Check request headers for fingerprinting
    const userAgent = requestHeaders['user-agent'] || '';
    if (!userAgent || userAgent.length < 10) {
      indicators.push('Suspicious or missing User-Agent');
    }

    // Check for too many headers (might indicate fingerprinting)
    const headerCount = Object.keys(requestHeaders).length;
    if (headerCount > 20) {
      indicators.push('Unusually high number of request headers');
    }

    // Check for specific bot detection headers
    for (const header of this.botDetectionHeaders) {
      if (responseHeaders[header] || responseHeaders[header.toLowerCase()]) {
        // Some headers are normal, but their presence with other indicators is notable
        if (indicators.length > 0) {
          indicators.push(`Bot detection header: ${header}`);
        }
      }
    }

    return {
      isBotDetection: indicators.length > 0 || matchedProviders.size > 0,
      indicators: indicators,
      confidence: indicators.length > 2 ? 'high' : indicators.length > 0 ? 'medium' : 'low',
      providers: Array.from(matchedProviders).sort()
    };
  }
}

// Cookie parser
class CookieParser {
  parseSetCookie(setCookieHeader) {
    if (!setCookieHeader) return [];
    
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    return cookies.map(cookie => {
      const parts = cookie.split(';');
      const [nameValue] = parts;
      const [name, value] = nameValue.split('=');
      
      const cookieObj = {
        name: name.trim(),
        value: value ? value.trim() : '',
        attributes: {}
      };

      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i].trim();
        if (attr.includes('=')) {
          const [key, val] = attr.split('=');
          cookieObj.attributes[key.toLowerCase()] = val;
        } else {
          cookieObj.attributes[attr.toLowerCase()] = true;
        }
      }

      return cookieObj;
    });
  }

  parseCookie(cookieHeader) {
    if (!cookieHeader) return [];
    
    const cookies = cookieHeader.split(';').map(c => {
      const [name, value] = c.trim().split('=');
      return { name: name.trim(), value: value ? value.trim() : '' };
    });
    
    return cookies;
  }
}

// Format utilities
class Formatter {
  formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatTime(ms) {
    if (!ms && ms !== 0) return '-';
    if (ms < 1000) return ms.toFixed(0) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  }

  formatHeaders(headers) {
    if (!headers || Object.keys(headers).length === 0) {
      return 'No headers';
    }
    
    return Object.entries(headers)
      .map(([key, value]) => {
        const val = Array.isArray(value) ? value.join(', ') : value;
        return `${key}: ${val}`;
      })
      .join('\n');
  }

  getResourceType(url, contentType) {
    if (!url) return 'other';
    
    const urlLower = url.toLowerCase();
    const typeLower = (contentType || '').toLowerCase();
    
    if (urlLower.match(/\.(js|mjs)$/) || typeLower.includes('javascript')) return 'script';
    if (urlLower.match(/\.(css)$/) || typeLower.includes('css')) return 'stylesheet';
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/) || typeLower.includes('image')) return 'image';
    if (urlLower.match(/\.(woff|woff2|ttf|otf|eot)$/) || typeLower.includes('font')) return 'font';
    if (urlLower.match(/\.(mp4|webm|ogg|mp3|wav)$/) || typeLower.includes('video') || typeLower.includes('audio')) return 'media';
    if (typeLower.includes('json')) return 'xhr';
    if (typeLower.includes('xml')) return 'xhr';
    if (urlLower.match(/\.(html|htm)$/) || typeLower.includes('html')) return 'document';
    
    return 'other';
  }
}

// Export utilities
const filterParser = new FilterParser();
const sessionDetector = new SessionDetector();
const botDetector = new BotDetector();
const cookieParser = new CookieParser();
const formatter = new Formatter();
