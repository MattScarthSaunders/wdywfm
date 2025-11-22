import type { NetworkRequest, ParsedCookie } from '../types';

/**
 * Service for formatting cookies for display
 */
export class CookieFormatter {
  /**
   * Find the first request that sets a specific cookie
   */
  private static findFirstSourceOfCookie(
    cookieName: string,
    cookieValue: string,
    allRequests: NetworkRequest[]
  ): { index: number; request: NetworkRequest } | null {
    const normalizedCookieName = cookieName.trim().toLowerCase();
    const normalizedCookieValue = cookieValue.trim();
    
    if (normalizedCookieName.length === 0) {
      return null;
    }
    
    // Search from the beginning to find the first request that sets this exact cookie
    for (let i = 0; i < allRequests.length; i++) {
      const req = allRequests[i];
      if (!req) continue;
      if (!req.setCookies || !Array.isArray(req.setCookies) || req.setCookies.length === 0) {
        continue;
      }
      
      // Check if this request sets the exact cookie (name + value match)
      const setsCookie = req.setCookies.some(cookie => {
        if (!cookie) return false;
        if (!cookie.name || typeof cookie.name !== 'string') return false;
        if (!cookie.value || typeof cookie.value !== 'string') return false;
        const trimmedName = cookie.name.trim();
        if (trimmedName.length === 0) return false;
        const trimmedValue = cookie.value.trim();
        return trimmedName.toLowerCase() === normalizedCookieName && trimmedValue === normalizedCookieValue;
      });
      
      if (setsCookie) {
        return { index: i, request: req };
      }
    }
    
    return null;
  }

  /**
   * Find all usages of a specific cookie
   */
  private static findAllUsagesOfCookie(
    cookieName: string,
    cookieValue: string,
    sourceRequestIndex: number,
    sourceRequestNumber: number,
    allRequests: NetworkRequest[]
  ) {
    const normalizedCookieName = cookieName.trim().toLowerCase();
    const normalizedCookieValue = cookieValue.trim();
    
    if (normalizedCookieName.length === 0) {
      return {
        source: { id: sourceRequestNumber || '?', name: null },
        usages: []
      };
    }
    
    // Find the first request that sets this exact cookie (name + value)
    const firstSource = this.findFirstSourceOfCookie(cookieName, cookieValue, allRequests);
    
    if (!firstSource) {
      // If no source found, use the current request as the source
      const currentRequest = allRequests[sourceRequestIndex];
      let sourceName: string | null = null;
      if (currentRequest) {
        try {
          const url = new URL(currentRequest.url);
          sourceName = url.pathname.split('/').pop() || url.pathname || url.hostname;
        } catch (e) {
          sourceName = currentRequest.url;
        }
      }
      return {
        source: { id: sourceRequestNumber || '?', name: sourceName },
        usages: []
      };
    }
    
    const usageRequestNumbers: number[] = [];
    const sourceIndex = firstSource.index;
    const sourceRequest = firstSource.request;
    
    // Check all requests after the first source that use this exact cookie in their Cookie header
    for (let i = sourceIndex + 1; i < allRequests.length; i++) {
      const req = allRequests[i];
      if (!req) continue;
      if (!req.cookies || !Array.isArray(req.cookies) || req.cookies.length === 0) continue;
      
      // Check if this request uses the exact cookie (name + value match)
      const usesCookie = req.cookies.some(cookie => {
        if (!cookie || !cookie.name || typeof cookie.name !== 'string') return false;
        if (!cookie.value || typeof cookie.value !== 'string') return false;
        const trimmedName = cookie.name.trim();
        if (trimmedName.length === 0) return false;
        const trimmedValue = cookie.value.trim();
        return trimmedName.toLowerCase() === normalizedCookieName && trimmedValue === normalizedCookieValue;
      });
      
      if (usesCookie && req.requestNumber) {
        usageRequestNumbers.push(req.requestNumber);
      }
    }
    
    // Get the source request name
    let sourceName: string | null = null;
    if (sourceRequest) {
      try {
        const url = new URL(sourceRequest.url);
        sourceName = url.pathname.split('/').pop() || url.pathname || url.hostname;
      } catch (e) {
        sourceName = sourceRequest.url;
      }
    }
    
    return {
      source: { id: sourceRequest.requestNumber || '?', name: sourceName },
      usages: usageRequestNumbers
    };
  }

  /**
   * Get cookie data with usage information for Vue components
   */
  static getCookiesWithUsage(
    cookies: ParsedCookie[] | undefined,
    request: NetworkRequest,
    allRequests: NetworkRequest[]
  ): Array<{ cookie: ParsedCookie; usageInfo: { source: { id: string | number; name: string | null }; usages: number[] } }> {
    if (!cookies || cookies.length === 0) {
      return [];
    }
    
    // Find the index of the current request
    const requestIndex = allRequests.findIndex(r => String(r.id) === String(request.id));
    
    return cookies.map(cookie => {
      // Find all usages of this exact cookie (name + value)
      const usageInfo = requestIndex !== -1 && request.requestNumber
        ? this.findAllUsagesOfCookie(cookie.name, cookie.value, requestIndex, request.requestNumber, allRequests)
        : { source: { id: request.requestNumber || '?', name: null }, usages: [] };
      
      return {
        cookie,
        usageInfo
      };
    });
  }
}

