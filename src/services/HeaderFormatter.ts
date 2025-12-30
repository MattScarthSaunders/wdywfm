export interface Header {
  name: string;
  value: string;
  importance?: string;
}

export class HeaderFormatter {

  getHeader(headers: Record<string, string | string[]>, headerName: string): string | undefined {
    if (!headers || !headerName) return undefined;
    
    if (headers[headerName] !== undefined) {
      const value = headers[headerName];
      return Array.isArray(value) ? value[0] : value;
    }
    
    const lowerName = headerName.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === lowerName) {
        return Array.isArray(value) ? value[0] : value;
      }
    }
    
    return undefined;
  }

  getHeaderImportance(headerName: string): string {
    if (!headerName) return 'unknown';
    const normalizedName = headerName.toLowerCase();
    
    if (normalizedName.startsWith('sec-ch')) {
      return 'required';
    }
    
    if (normalizedName.includes('ssgtoken') || 
        normalizedName.includes('ssotoken') ||
        normalizedName.includes('sso-token') ||
        normalizedName.includes('ssg-token')) {
      return 'required';
    }
    
    const requiredHeaders = [
      'host', 'cf-ray', 'cf-connecting-ip', 'cf-visitor', 'cf-ipcountry',
      'x-datadome', 'x-px', 'x-iinfo', 'x-cdn', 'x-akamai', 'x-amz-cf',
      'x-fastly', 'x-sucuri', 'x-f5', 'x-barracuda', 'x-shape', 'x-human',
      'x-kpsdk', 'x-radware', 'g-recaptcha', 'x-vercel-id', 'x-vercel',
      'x-amzn', 'x-azure', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
      'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-user', 'sec-fetch-dest',
      'user-agent', 'x-forwarded-for', 'x-real-ip', 'via', 'server'
    ];
    
    const optionalHeaders = [
      'accept', 'accept-language', 'accept-encoding', 'accept-charset',
      'referer', 'referrer-policy', 'cookie', 'authorization', 'content-type',
      'content-length', 'content-encoding', 'connection', 'cache-control',
      'if-modified-since', 'if-none-match', 'if-match', 'if-range', 'range',
      'origin', 'dnt', 'upgrade-insecure-requests', 'expect', 'te', 'trailer',
      'transfer-encoding', 'warning', 'x-requested-with', 'x-forwarded-proto',
      'x-forwarded-host'
    ];
    
    if (requiredHeaders.includes(normalizedName)) {
      return 'required';
    } else if (optionalHeaders.includes(normalizedName)) {
      return 'optional';
    } else {
      return 'unknown';
    }
  }

  getHeaders(headers: Record<string, string | string[]>, gradeImportance: boolean): Header[] {
    if (!headers || Object.keys(headers).length === 0) {
      return [];
    }

    const headerList: Header[] = [];
    for (const [key, value] of Object.entries(headers)) {
      const val = Array.isArray(value) ? value.join(', ') : value;
      const valStr = String(val);
      
      const importance = gradeImportance ? this.getHeaderImportance(key) : undefined;
      
      headerList.push({
        name: key,
        value: valStr,
        importance
      });
    }
    
    return headerList;
  }
}

