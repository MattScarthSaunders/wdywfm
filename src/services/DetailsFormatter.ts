import type { NetworkRequest } from '../types';
import { formatter } from '../utils';

export class DetailsFormatter {
  getGeneralInfo(request: NetworkRequest): {
    url: string;
    method: string;
    status: number;
    type: string;
    size: string;
    time: string;
    timestamp: string;
  } {
    return {
      url: request.url,
      method: request.method,
      status: request.status,
      type: request.type,
      size: formatter.formatSize(request.size),
      time: formatter.formatTime(request.time),
      timestamp: new Date(request.timestamp).toLocaleString()
    };
  }
}

