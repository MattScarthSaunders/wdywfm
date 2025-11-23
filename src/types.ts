export interface NetworkRequest {
  id: string;
  requestNumber: number;
  url: string;
  method: string;
  status: number;
  type: string;
  size: number;
  time: number;
  timestamp: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string | string[]>;
  cookies: Cookie[];
  setCookies: ParsedCookie[];
  session: SessionInfo;
  botDetection: BotDetectionInfo;
  postData: string | null;
  responseBody?: string | null;
}

export interface Cookie {
  name: string;
  value: string;
}

export interface ParsedCookie {
  name: string;
  value: string;
  attributes: Record<string, string | boolean>;
}

export interface SessionInfo {
  isSession: boolean;
  reason: string | null;
}

export interface BotDetectionInfo {
  isBotDetection: boolean;
  indicators: string[];
  confidence: 'low' | 'medium' | 'high';
  providers: string[];
}

export interface Filter {
  type: 'property' | 'text';
  key?: string;
  value: string;
}

export interface BotDetectionPattern {
  type: 'header' | 'server' | 'via' | 'cookie' | 'url';
  name?: string;
  value?: string;
  regex: RegExp | null;
}

export interface BotDetectionProvider {
  name: string;
  patterns: BotDetectionPattern[];
}

