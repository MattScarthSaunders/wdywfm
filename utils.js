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
  }

  detect(request) {
    const indicators = [];

    // Check response headers for bot detection services
    const responseHeaders = request.responseHeaders || {};
    const serverHeader = responseHeaders['server'] || '';
    const viaHeader = responseHeaders['via'] || '';
    
    for (const service of this.botDetectionServices) {
      if (serverHeader.toLowerCase().includes(service) || 
          viaHeader.toLowerCase().includes(service)) {
        indicators.push(`Bot detection service: ${service}`);
      }
    }

    // Check for Cloudflare-specific headers
    if (responseHeaders['cf-ray']) {
      indicators.push('Cloudflare protection detected');
    }

    // Check URL for bot detection patterns
    const urlLower = request.url.toLowerCase();
    for (const pattern of this.botDetectionPatterns) {
      if (pattern.test(urlLower)) {
        indicators.push(`URL contains bot detection pattern`);
        break;
      }
    }

    // Check response body type (if available)
    const contentType = responseHeaders['content-type'] || '';
    if (contentType.includes('text/html')) {
      // Check if response might contain challenge/captcha
      // This would require body inspection which we can't do easily
    }

    // Check for specific status codes that might indicate challenges
    if (request.status === 403 && responseHeaders['cf-ray']) {
      indicators.push('Cloudflare challenge (403)');
    }

    // Check request headers for fingerprinting
    const requestHeaders = request.requestHeaders || {};
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
      isBotDetection: indicators.length > 0,
      indicators: indicators,
      confidence: indicators.length > 2 ? 'high' : indicators.length > 0 ? 'medium' : 'low'
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
