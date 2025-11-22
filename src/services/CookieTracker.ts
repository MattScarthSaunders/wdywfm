import type { NetworkRequest } from '../types';

export class CookieTracker {
  static findCookieSourceRequests(request: NetworkRequest, allRequests: NetworkRequest[]): Set<string> {
    const cookieToClosestSource = new Map<string, string>();
    
    if (!request.cookies || !Array.isArray(request.cookies) || request.cookies.length === 0) {
      return new Set();
    }
    
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
    
    const requestIndex = allRequests.findIndex(r => String(r.id) === String(request.id));
    if (requestIndex === -1) return new Set();
    
    for (let i = requestIndex - 1; i >= 0; i--) {
      const req = allRequests[i];
      if (!req) continue;
      if (String(req.id) === String(request.id)) continue;
      if (!req.setCookies || !Array.isArray(req.setCookies) || req.setCookies.length === 0) continue;
      
      req.setCookies.forEach(setCookie => {
        if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
          const setName = setCookie.name.trim().toLowerCase();
          if (setName.length > 0 && cookieNames.has(setName)) {
            if (!cookieToClosestSource.has(setName)) {
              cookieToClosestSource.set(setName, String(req.id));
            }
          }
        }
      });
      
      if (cookieToClosestSource.size === cookieNames.size) {
        break;
      }
    }
    
    return new Set(cookieToClosestSource.values());
  }

  static findCookieRecipientRequests(request: NetworkRequest, allRequests: NetworkRequest[]): Set<string> {
    const recipientRequestIds = new Set<string>();
    
    if (!request.setCookies || !Array.isArray(request.setCookies) || request.setCookies.length === 0) {
      return recipientRequestIds;
    }
    
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
    
    const requestIndex = allRequests.findIndex(r => String(r.id) === String(request.id));
    if (requestIndex === -1) return recipientRequestIds;
    
    for (let i = requestIndex + 1; i < allRequests.length; i++) {
      const req = allRequests[i];
      if (!req) continue;
      if (String(req.id) === String(request.id)) continue;
      
      if (!req.cookies || !Array.isArray(req.cookies) || req.cookies.length === 0) continue;
      
      const recipientCookieNames = new Set<string>();
      req.cookies.forEach(cookie => {
        if (cookie && cookie.name && typeof cookie.name === 'string' && cookie.name.trim()) {
          const cookieName = cookie.name.trim().toLowerCase();
          if (cookieName.length > 0) {
            recipientCookieNames.add(cookieName);
          }
        }
      });
      
      const matchingCookies = new Set<string>();
      cookieNames.forEach(cookieName => {
        if (recipientCookieNames.has(cookieName)) {
          matchingCookies.add(cookieName);
        }
      });
      
      if (matchingCookies.size === 0) continue;
      
      let isClosestSourceForAnyCookie = false;
      
      for (const cookieName of matchingCookies) {
        const recipientIndex = i;
        let closestSourceId: string | null = null;
        
        for (let j = recipientIndex - 1; j >= 0; j--) {
          const potentialSource = allRequests[j];
          if (!potentialSource) continue;
          if (!potentialSource.setCookies || !Array.isArray(potentialSource.setCookies) || potentialSource.setCookies.length === 0) continue;
          
          const setsCookie = potentialSource.setCookies.some(setCookie => {
            if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
              return setCookie.name.trim().toLowerCase() === cookieName;
            }
            return false;
          });
          
          if (setsCookie) {
            closestSourceId = String(potentialSource.id);
            break;
          }
        }
        
        if (closestSourceId === String(request.id)) {
          isClosestSourceForAnyCookie = true;
          break;
        }
      }
      
      if (isClosestSourceForAnyCookie) {
        recipientRequestIds.add(String(req.id));
      }
    }
    
    return recipientRequestIds;
  }
}

