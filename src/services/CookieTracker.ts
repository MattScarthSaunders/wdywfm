import type { NetworkRequest } from '../types';

export class CookieTracker {

  findCookieSourceRequests(request: NetworkRequest, allRequests: NetworkRequest[]): Set<string> {
    const cookieToClosestSource = new Map<string, string>();
    
    const cookieNames = this.extractCookieNamesFromCookies(request.cookies);
    if (cookieNames.size === 0) {
      return new Set();
    }
    
    const requestIndex = this.findRequestIndexById(request.id, allRequests);
    if (requestIndex === -1) return new Set();
    
    for (let i = requestIndex - 1; i >= 0; i--) {
      const req = allRequests[i];
      if (!req || String(req.id) === String(request.id)) continue;
      if (!req.setCookies || !Array.isArray(req.setCookies) || req.setCookies.length === 0) continue;
      
      this.processSetCookiesForSourceMapping(req, cookieNames, cookieToClosestSource);
      
      if (cookieToClosestSource.size === cookieNames.size) {
        break;
      }
    }
    
    return new Set(cookieToClosestSource.values());
  }

  findCookieRecipientRequests(request: NetworkRequest, allRequests: NetworkRequest[]): Set<string> {
    const recipientRequestIds = new Set<string>();
    
    const cookieNames = this.extractCookieNamesFromSetCookies(request.setCookies);
    if (cookieNames.size === 0) {
      return recipientRequestIds;
    }
    
    const requestIndex = this.findRequestIndexById(request.id, allRequests);
    if (requestIndex === -1) return recipientRequestIds;
    
    for (let i = requestIndex + 1; i < allRequests.length; i++) {
      const req = allRequests[i];
      if (!req || String(req.id) === String(request.id)) continue;
      if (!req.cookies || !Array.isArray(req.cookies) || req.cookies.length === 0) continue;
      
      const recipientCookieNames = this.extractCookieNamesFromCookies(req.cookies);
      const matchingCookies = this.findMatchingCookieNames(cookieNames, recipientCookieNames);
      
      if (matchingCookies.size === 0) continue;
      
      const isClosestSource = this.isClosestSourceForCookies(
        request.id,
        matchingCookies,
        allRequests,
        i
      );
      
      if (isClosestSource) {
        recipientRequestIds.add(String(req.id));
      }
    }
    
    return recipientRequestIds;
  }

  private extractCookieNamesFromCookies(cookies: any[] | undefined): Set<string> {
    const cookieNames = new Set<string>();
    
    if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
      return cookieNames;
    }
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const normalizedName = this.normalizeCookieName(cookie?.name);
      if (normalizedName) {
        cookieNames.add(normalizedName);
      }
    }
    
    return cookieNames;
  }

  private extractCookieNamesFromSetCookies(setCookies: any[] | undefined): Set<string> {
    const cookieNames = new Set<string>();
    
    if (!setCookies || !Array.isArray(setCookies) || setCookies.length === 0) {
      return cookieNames;
    }
    
    for (let i = 0; i < setCookies.length; i++) {
      const setCookie = setCookies[i];
      const normalizedName = this.normalizeCookieName(setCookie?.name);
      if (normalizedName) {
        cookieNames.add(normalizedName);
      }
    }
    
    return cookieNames;
  }

  private normalizeCookieName(name: any): string | null {
    if (!name || typeof name !== 'string') {
      return null;
    }
    
    const normalized = name.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private findRequestIndexById(requestId: string | number, allRequests: NetworkRequest[]): number {
    return allRequests.findIndex(r => String(r.id) === String(requestId));
  }

  private findMatchingCookieNames(set1: Set<string>, set2: Set<string>): Set<string> {
    const matchingCookies = new Set<string>();
    for (const cookieName of set1) {
      if (set2.has(cookieName)) {
        matchingCookies.add(cookieName);
      }
    }
    return matchingCookies;
  }

  private processSetCookiesForSourceMapping(
    req: NetworkRequest,
    cookieNames: Set<string>,
    cookieToClosestSource: Map<string, string>
  ): void {
    if (!req.setCookies || !Array.isArray(req.setCookies)) {
      return;
    }
    
    for (let j = 0; j < req.setCookies.length; j++) {
      const setCookie = req.setCookies[j];
      const normalizedName = this.normalizeCookieName(setCookie?.name);
      
      if (normalizedName && cookieNames.has(normalizedName)) {
        if (!cookieToClosestSource.has(normalizedName)) {
          cookieToClosestSource.set(normalizedName, String(req.id));
        }
      }
    }
  }

  private isClosestSourceForCookies(
    requestId: string | number,
    matchingCookies: Set<string>,
    allRequests: NetworkRequest[],
    recipientIndex: number
  ): boolean {
    for (const cookieName of matchingCookies) {
      const closestSourceId = this.findClosestSourceForCookie(
        cookieName,
        allRequests,
        recipientIndex
      );
      
      if (closestSourceId === String(requestId)) {
        return true;
      }
    }
    
    return false;
  }

  private findClosestSourceForCookie(
    cookieName: string,
    allRequests: NetworkRequest[],
    startIndex: number
  ): string | null {
    for (let j = startIndex - 1; j >= 0; j--) {
      const potentialSource = allRequests[j];
      if (!potentialSource) continue;
      if (!potentialSource.setCookies || !Array.isArray(potentialSource.setCookies) || potentialSource.setCookies.length === 0) continue;
      
      const setsCookie = this.doesRequestSetCookie(potentialSource, cookieName);
      if (setsCookie) {
        return String(potentialSource.id);
      }
    }
    
    return null;
  }

  private doesRequestSetCookie(request: NetworkRequest, cookieName: string): boolean {
    if (!request.setCookies || !Array.isArray(request.setCookies)) {
      return false;
    }
    
    for (let i = 0; i < request.setCookies.length; i++) {
      const setCookie = request.setCookies[i];
      const normalizedName = this.normalizeCookieName(setCookie?.name);
      if (normalizedName === cookieName) {
        return true;
      }
    }
    
    return false;
  }
}

