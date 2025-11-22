import type {
  NetworkRequest,
  Cookie,
  ParsedCookie,
  SessionInfo,
  BotDetectionInfo,
  Filter,
  BotDetectionPattern,
  BotDetectionProvider,
} from './types';

export class FilterParser {
  private filters: Filter[] = [];

  parse(filterString: string | null | undefined): FilterParser | null {
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

  matches(request: NetworkRequest): boolean {
    if (!this.filters || this.filters.length === 0) {
      return true;
    }

    return this.filters.every(filter => {
      if (filter.type === 'property') {
        return this.matchProperty(request, filter.key!, filter.value);
      } else {
        return this.matchText(request, filter.value);
      }
    });
  }

  private matchProperty(request: NetworkRequest, key: string, value: string): boolean {
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
        const contentType = (request.responseHeaders?.['content-type'] as string) || '';
        return contentType.toLowerCase().includes(value);
      default:
        return false;
    }
  }

  private matchText(request: NetworkRequest, value: string): boolean {
    const searchText = value.toLowerCase();
    
    if (request.url.toLowerCase().includes(searchText)) {
      return true;
    }
    
    if (request.method.toLowerCase().includes(searchText)) {
      return true;
    }
    
    if (String(request.status).includes(searchText)) {
      return true;
    }
    
    if (request.type && request.type.toLowerCase().includes(searchText)) {
      return true;
    }
    
    return false;
  }
}

export class SessionDetector {
  private sessionIndicators: string[] = [
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
  
  private sessionHeaders: string[] = [
    'set-cookie',
    'authorization',
    'x-auth-token',
    'x-csrf-token',
    'x-xsrf-token',
    'x-session-id',
    'x-api-key'
  ];

  isSessionRequest(request: NetworkRequest): SessionInfo {
    const urlLower = request.url.toLowerCase();
    if (this.sessionIndicators.some(indicator => urlLower.includes(indicator))) {
      return { isSession: true, reason: 'URL contains session-related keywords' };
    }

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

    const responseHeaders = request.responseHeaders || {};
    for (const [key, value] of Object.entries(responseHeaders)) {
      const keyLower = key.toLowerCase();
      if (keyLower === 'set-cookie') {
        const cookies = Array.isArray(value) ? value : [value];
        if (cookies.some(cookie => this.isSessionCookie(String(cookie)))) {
          return { isSession: true, reason: 'Response sets session cookies' };
        }
      }
      if (this.sessionHeaders.some(header => keyLower.includes(header))) {
        return { isSession: true, reason: `Response header: ${key}` };
      }
    }

    if (request.status === 401 || request.status === 403) {
      return { isSession: true, reason: 'Authentication status code' };
    }

    return { isSession: false, reason: null };
  }

  private hasSessionCookie(cookieString: string | undefined): boolean {
    if (!cookieString) return false;
    const sessionCookieNames = ['session', 'sess', 'sid', 'jsessionid', 'phpsessid', 'asp.net_sessionid'];
    return sessionCookieNames.some(name => cookieString.toLowerCase().includes(name + '='));
  }

  private isSessionCookie(cookieString: string): boolean {
    if (!cookieString) return false;
    const sessionIndicators = ['session', 'sess', 'sid', 'auth', 'token'];
    return sessionIndicators.some(indicator => cookieString.toLowerCase().includes(indicator));
  }
}

export class BotDetector {
  private siteBotDetectionHeaders: string[] = [
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset',
    'ratelimit-limit',
    'ratelimit-remaining',
    'ratelimit-reset',
    'x-rate-limit-limit',
    'x-rate-limit-remaining',
    'retry-after',
    'x-bot-score',
    'x-risk-score',
    'x-threat-score',
    'x-fraud-score',
    'x-block-reason',
    'x-challenge-reason',
    'x-request-id',
    'x-requested-with',
    'x-csrf-token',
    'x-csrf',
    'cf-cache-status',
    'cf-request-id',
    'x-amzn-requestid',
    'x-amzn-trace-id',
    'x-azure-ref',
    'x-azure-requestid',
    'x-google-trace',
    'x-cloud-trace-context'
  ];

  private botDetectionServices: string[] = [
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

  private botDetectionPatterns: RegExp[] = [
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

  private botDetectionCookieNames: RegExp[] = [
    /__cf_bm/i,
    /cf_clearance/i,
    /cf_turnstile/i,
    /datadome/i,
    /_px/i,
    /_px2/i,
    /_px3/i,
    /__pxvid/i,
    /px-captcha/i,
    /incap_ses/i,
    /visid_incap/i,
    /nlbi_/i,
    /shape/i,
    /human/i,
    /kasada/i,
    /sucuri/i,
    /recaptcha/i,
    /hcaptcha/i,
    /bm_sz/i,
    /_bot/i,
    /bot.*token/i,
    /challenge.*token/i,
    /verification.*token/i
  ];

  private botDetectionProviders: BotDetectionProvider[] = [
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

  detect(request: NetworkRequest): BotDetectionInfo {
    const indicators: string[] = [];
    const matchedProviders = new Set<string>();

    const requestHeaders = request.requestHeaders || {};
    const responseHeaders = request.responseHeaders || {};
    const urlLower = request.url.toLowerCase();
    const serverHeader = ((responseHeaders['server'] as string) || '').toLowerCase();
    const viaHeader = ((responseHeaders['via'] as string) || '').toLowerCase();

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

    for (const provider of this.botDetectionProviders) {
      let matched = false;

      for (const pattern of provider.patterns) {
        if (pattern.type === 'header') {
          if (pattern.regex) {
            const allHeaders = { ...requestHeaders, ...responseHeaders };
            for (const [headerName] of Object.entries(allHeaders)) {
              if (pattern.regex.test(headerName)) {
                matched = true;
                break;
              }
            }
          } else {
            const headerKeys = Object.keys({ ...requestHeaders, ...responseHeaders });
            if (headerKeys.some(key => key.toLowerCase() === pattern.name!.toLowerCase())) {
              matched = true;
            }
          }
        } else if (pattern.type === 'server') {
          if (pattern.regex) {
            if (pattern.regex.test(serverHeader)) {
              matched = true;
            }
          } else if (serverHeader.includes(pattern.value!.toLowerCase())) {
            matched = true;
          }
        } else if (pattern.type === 'via') {
          if (pattern.regex) {
            if (pattern.regex.test(viaHeader)) {
              matched = true;
            }
          } else if (viaHeader.includes(pattern.value!.toLowerCase())) {
            matched = true;
          }
        } else if (pattern.type === 'cookie') {
          if (pattern.regex) {
            if (allCookieNames.some(name => pattern.regex!.test(name)) ||
                allCookieStrings.some(cookie => pattern.regex!.test(cookie))) {
              matched = true;
            }
          } else {
            if (allCookieNames.includes(pattern.name!.toLowerCase())) {
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

    for (const service of this.botDetectionServices) {
      if (serverHeader.includes(service) || viaHeader.includes(service)) {
        indicators.push(`Bot detection service: ${service}`);
      }
    }

    for (const pattern of this.botDetectionPatterns) {
      if (pattern.test(urlLower)) {
        indicators.push(`URL contains bot detection pattern`);
        break;
      }
    }

    if (request.status === 403) {
      indicators.push('403 Forbidden - may indicate bot detection blocking');
    }
    if (request.status === 429) {
      indicators.push('429 Too Many Requests - rate limiting/bot detection');
    }
    if (request.status === 503 && responseHeaders['retry-after']) {
      indicators.push('503 Service Unavailable with Retry-After - challenge system');
    }

    const rateLimitHeaders = ['x-ratelimit-limit', 'x-ratelimit-remaining', 'ratelimit-limit', 'ratelimit-remaining'];
    const hasRateLimit = rateLimitHeaders.some(header => 
      responseHeaders[header] || responseHeaders[header.toLowerCase()]
    );
    if (hasRateLimit) {
      indicators.push('Rate limiting headers detected');
    }

    for (const cookiePattern of this.botDetectionCookieNames) {
      if (allCookieNames.some(name => cookiePattern.test(name))) {
        indicators.push('Bot detection cookies present');
        break;
      }
    }

    for (const header of this.siteBotDetectionHeaders) {
      const headerLower = header.toLowerCase();
      if (responseHeaders[header] || responseHeaders[headerLower]) {
        if (header.includes('bot') || header.includes('risk') || header.includes('threat') || 
            header.includes('fraud') || header.includes('challenge') || header.includes('block')) {
          indicators.push(`Bot detection header: ${header}`);
        } else if (header.includes('ratelimit') || header.includes('rate-limit')) {
        } else if (indicators.length > 0) {
          indicators.push(`Security/tracking header: ${header}`);
        }
      }
    }

    if (responseHeaders['cf-ray'] || responseHeaders['cf-request-id'] || responseHeaders['cf-cache-status']) {
      indicators.push('Cloudflare protection headers detected');
    }

    const wafHeaders = ['x-amzn-requestid', 'x-amzn-trace-id', 'x-azure-ref', 'x-azure-requestid', 
                       'x-google-trace', 'x-cloud-trace-context'];
    const hasWaf = wafHeaders.some(header => 
      responseHeaders[header] || responseHeaders[header.toLowerCase()]
    );
    if (hasWaf) {
      indicators.push('WAF/Cloud provider security headers detected');
    }

    const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection', 
                            'strict-transport-security', 'content-security-policy'];
    const securityHeaderCount = securityHeaders.filter(header => 
      responseHeaders[header] || responseHeaders[header.toLowerCase()]
    ).length;
    if (securityHeaderCount >= 3) {
      indicators.push('Multiple security headers present (often used with bot detection)');
    }

    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (matchedProviders.size > 0) {
      confidence = 'high';
    } else if (indicators.length > 2) {
      confidence = 'high';
    } else if (indicators.length > 0) {
      confidence = 'medium';
    }

    return {
      isBotDetection: indicators.length > 0 || matchedProviders.size > 0,
      indicators: indicators,
      confidence: confidence,
      providers: Array.from(matchedProviders).sort()
    };
  }
}

export class CookieParser {
  parseSetCookie(setCookieHeader: string | string[] | undefined): ParsedCookie[] {
    if (!setCookieHeader) return [];
    
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    return cookies.map(cookie => {
      if (!cookie || !cookie.trim()) return null;
      const parts = cookie.split(';');
      const [nameValue] = parts;
      if (!nameValue || !nameValue.trim()) return null;
      
      const [name, ...valueParts] = nameValue.split('=');
      const value = valueParts.join('=');
      const trimmedName = name ? name.trim() : '';
      if (!trimmedName) return null;
      
      const cookieObj: ParsedCookie = {
        name: trimmedName,
        value: value ? value.trim() : '',
        attributes: {}
      };

      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i].trim();
        if (!attr) continue;
        if (attr.includes('=')) {
          const [key, val] = attr.split('=');
          cookieObj.attributes[key.toLowerCase()] = val;
        } else {
          cookieObj.attributes[attr.toLowerCase()] = true;
        }
      }

      return cookieObj;
    }).filter((c): c is ParsedCookie => c !== null);
  }

  parseCookie(cookieHeader: string | undefined): Cookie[] {
    if (!cookieHeader) return [];
    
    const cookies = cookieHeader.split(';').map(c => {
      const trimmed = c.trim();
      if (!trimmed) return null;
      const [name, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      const trimmedName = name ? name.trim() : '';
      if (!trimmedName) return null;
      return { name: trimmedName, value: value ? value.trim() : '' };
    }).filter((c): c is Cookie => c !== null);
    
    return cookies;
  }
}

export class Formatter {
  formatSize(bytes: number): string {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatTime(ms: number): string {
    if (!ms && ms !== 0) return '-';
    if (ms < 1000) return ms.toFixed(0) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  }

  formatHeaders(headers: Record<string, string | string[]>): string {
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

  getResourceType(url: string, contentType: string): string {
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

export const filterParser = new FilterParser();
export const sessionDetector = new SessionDetector();
export const botDetector = new BotDetector();
export const cookieParser = new CookieParser();
export const formatter = new Formatter();

