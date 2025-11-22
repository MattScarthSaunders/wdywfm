import type { NetworkRequest } from '../types';

/**
 * Service for tracking cookie relationships between requests
 */
export class CookieTracker {
  /**
   * Find requests that set cookies used by the given request
   * Returns a Set of request IDs that are the closest sources for cookies used by the request
   */
  static findCookieSourceRequests(request: NetworkRequest, allRequests: NetworkRequest[]): Set<string> {
    const cookieToClosestSource = new Map<string, string>();
    
    // Check what cookies the request has
    if (!request.cookies || !Array.isArray(request.cookies) || request.cookies.length === 0) {
      return new Set();
    }
    
    // Extract cookie names from request cookies (normalized)
    const cookieNames = new Set<string>();
    request.cookies.forEach(cookie => {
      if (cookie && cookie.name && typeof cookie.name === 'string' && cookie.name.trim()) {
        const name = cookie.name.trim().toLowerCase();
        if (name.length > 0) {
          cookieNames.add(name);
        }
      }
    });
    
    if (cookieNames.size === 0) {
      return new Set();
    }
    
    // Check all requests (use index as fallback if timestamps are the same)
    const requestIndex = allRequests.findIndex(r => String(r.id) === String(request.id));
    if (requestIndex === -1) return new Set();
    
    // Iterate backwards from the closest request to find the most recent source for each cookie
    for (let i = requestIndex - 1; i >= 0; i--) {
      const req = allRequests[i];
      if (!req) continue;
      if (String(req.id) === String(request.id)) continue;
      if (!req.setCookies || !Array.isArray(req.setCookies) || req.setCookies.length === 0) continue;
      
      // Check if this request sets any cookies that the selected request uses
      req.setCookies.forEach(setCookie => {
        if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
          const setName = setCookie.name.trim().toLowerCase();
          if (setName.length > 0 && cookieNames.has(setName)) {
            // Only add if we haven't found a closer source for this cookie yet
            if (!cookieToClosestSource.has(setName)) {
              cookieToClosestSource.set(setName, String(req.id));
            }
          }
        }
      });
      
      // Early exit if we've found sources for all cookies
      if (cookieToClosestSource.size === cookieNames.size) {
        break;
      }
    }
    
    // Return a Set of unique source request IDs
    return new Set(cookieToClosestSource.values());
  }

  /**
   * Find requests that use cookies set by the given request
   * Only includes recipients if the selected request is the closest source for at least one cookie
   */
  static findCookieRecipientRequests(request: NetworkRequest, allRequests: NetworkRequest[]): Set<string> {
    const recipientRequestIds = new Set<string>();
    
    // Check what cookies this request sets
    if (!request.setCookies || !Array.isArray(request.setCookies) || request.setCookies.length === 0) {
      return recipientRequestIds;
    }
    
    // Extract cookie names from set-cookie headers
    const cookieNames = new Set<string>();
    request.setCookies.forEach(setCookie => {
      if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
        const name = setCookie.name.trim().toLowerCase();
        if (name.length > 0) {
          cookieNames.add(name);
        }
      }
    });
    
    if (cookieNames.size === 0) {
      return recipientRequestIds;
    }
    
    // Check all requests (use index as fallback if timestamps are the same)
    const requestIndex = allRequests.findIndex(r => String(r.id) === String(request.id));
    if (requestIndex === -1) return recipientRequestIds;
    
    // Check all later requests
    for (let i = requestIndex + 1; i < allRequests.length; i++) {
      const req = allRequests[i];
      if (!req) continue;
      if (String(req.id) === String(request.id)) continue;
      
      if (!req.cookies || !Array.isArray(req.cookies) || req.cookies.length === 0) continue;
      
      // Extract cookies used by this recipient request
      const recipientCookieNames = new Set<string>();
      req.cookies.forEach(cookie => {
        if (cookie && cookie.name && typeof cookie.name === 'string' && cookie.name.trim()) {
          const cookieName = cookie.name.trim().toLowerCase();
          if (cookieName.length > 0) {
            recipientCookieNames.add(cookieName);
          }
        }
      });
      
      // Find cookies that both the selected request sets and the recipient uses
      const matchingCookies = new Set<string>();
      cookieNames.forEach(cookieName => {
        if (recipientCookieNames.has(cookieName)) {
          matchingCookies.add(cookieName);
        }
      });
      
      if (matchingCookies.size === 0) continue;
      
      // For each matching cookie, check if the selected request is the closest source
      // Only add recipient if selected request is closest source for at least one cookie
      let isClosestSourceForAnyCookie = false;
      
      for (const cookieName of matchingCookies) {
        // Find the closest source for this cookie for the recipient request
        const recipientIndex = i;
        let closestSourceId: string | null = null;
        
        // Iterate backwards from the recipient to find the closest source
        for (let j = recipientIndex - 1; j >= 0; j--) {
          const potentialSource = allRequests[j];
          if (!potentialSource) continue;
          if (!potentialSource.setCookies || !Array.isArray(potentialSource.setCookies) || potentialSource.setCookies.length === 0) continue;
          
          // Check if this request sets the cookie
          const setsCookie = potentialSource.setCookies.some(setCookie => {
            if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
              return setCookie.name.trim().toLowerCase() === cookieName;
            }
            return false;
          });
          
          if (setsCookie) {
            closestSourceId = String(potentialSource.id);
            break; // Found the closest source
          }
        }
        
        // If the closest source is the selected request, mark this recipient
        if (closestSourceId === String(request.id)) {
          isClosestSourceForAnyCookie = true;
          break; // No need to check other cookies if we found one
        }
      }
      
      // Only add if selected request is closest source for at least one cookie
      if (isClosestSourceForAnyCookie) {
        recipientRequestIds.add(String(req.id));
      }
    }
    
    return recipientRequestIds;
  }
}

