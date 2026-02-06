import type { NetworkRequest } from '../types';

export interface ValueMatchResult {
  matchIds: Set<string>;
  matchPaths: Record<string, string[]>;
}

export interface CapturedExample {
  path: string;
  example: string;
}

export class ValueCaptureService {
  findMatches(
    requests: NetworkRequest[],
    capturedValue: string | null,
    _ignoreNumberPunctuation: boolean
  ): ValueMatchResult {
    const raw = (capturedValue || '').trim();

    if (!raw) {
      return {
        matchIds: new Set<string>(),
        matchPaths: {},
      };
    }

    const matchIds = new Set<string>();
    const matchPaths: Record<string, string[]> = {};

    for (const request of requests) {
      const id = String(request.id);
      const body = request.responseBody;

      if (!body || !body.includes(raw)) {
        continue;
      }

      matchIds.add(id);

      try {
        const json = JSON.parse(body);
        const pathsSet = new Set<string>();

        function visit(node: unknown, segments: string[]): void {
          if (node === null || node === undefined) {
            return;
          }

          const t = typeof node;
          if (t === 'string' || t === 'number' || t === 'boolean') {
            const asString = String(node);
            if (asString.includes(raw)) {
              const path = segments
                .map((seg, index) => (seg === '*' ? '[*]' : index === 0 ? seg : `.${seg}`))
                .join('');
              if (path) {
                pathsSet.add(path);
              }
            }
            return;
          }

          if (Array.isArray(node)) {
            segments.push('*');
            for (const item of node) {
              visit(item, segments);
            }
            segments.pop();
            return;
          }

          if (t === 'object') {
            for (const key in node as Record<string, unknown>) {
              if (!Object.prototype.hasOwnProperty.call(node, key)) {
                continue;
              }
              segments.push(key);
              visit((node as Record<string, unknown>)[key], segments);
              segments.pop();
            }
          }
        }

        visit(json, []);

        if (pathsSet.size > 0) {
          matchPaths[id] = Array.from(pathsSet);
        }
      } catch {
        // Non-JSON body, ignore structured paths
      }
    }

    return {
      matchIds,
      matchPaths,
    };
  }

  buildExamples(
    request: NetworkRequest,
    capturedValue: string | null,
    capturedPaths: string[]
  ): CapturedExample[] {
    const results: CapturedExample[] = [];

    if (!capturedPaths.length) {
      return results;
    }

    const body = request.responseBody;
    if (!body) {
      return results;
    }

    let original: unknown;
    try {
      original = JSON.parse(body);
    } catch {
      return results;
    }

    const searchValue = capturedValue ?? '';

    function nodeContainsValue(node: unknown, value: string): boolean {
      if (node === null || node === undefined) {
        return false;
      }
      const t = typeof node;
      if (t === 'string' || t === 'number' || t === 'boolean') {
        return String(node).includes(value);
      }
      if (Array.isArray(node)) {
        for (const item of node) {
          if (nodeContainsValue(item, value)) {
            return true;
          }
        }
        return false;
      }
      if (t === 'object') {
        for (const key in node as Record<string, unknown>) {
          if (!Object.prototype.hasOwnProperty.call(node, key)) {
            continue;
          }
          if (nodeContainsValue((node as Record<string, unknown>)[key], value)) {
            return true;
          }
        }
      }
      return false;
    }

    for (const path of capturedPaths) {
      let clone: unknown;
      try {
        clone = JSON.parse(JSON.stringify(original));
      } catch {
        continue;
      }

      const tokens = path.split('.');
      let origNode: unknown = original;
      let cloneNode: unknown = clone;
      let failed = false;

      for (const token of tokens) {
        const isArrayToken = token.endsWith('[*]');
        const key = isArrayToken ? token.slice(0, -3) : token;

        if (
          origNode === null ||
          origNode === undefined ||
          typeof origNode !== 'object' ||
          cloneNode === null ||
          cloneNode === undefined ||
          typeof cloneNode !== 'object'
        ) {
          failed = true;
          break;
        }

        const origObj = origNode as Record<string, unknown>;
        const cloneObj = cloneNode as Record<string, unknown>;

        if (!(key in origObj) || !(key in cloneObj)) {
          failed = true;
          break;
        }

        if (isArrayToken) {
          const origArr = origObj[key];
          const cloneArr = cloneObj[key];
          if (!Array.isArray(origArr) || !Array.isArray(cloneArr) || origArr.length === 0) {
            failed = true;
            break;
          }

          let chosenIndex = 0;
          for (let i = 0; i < origArr.length; i++) {
            if (nodeContainsValue(origArr[i], searchValue)) {
              chosenIndex = i;
              break;
            }
          }

          const chosenOrig = origArr[chosenIndex];
          const chosenClone = cloneArr[chosenIndex];
          if (chosenClone === undefined) {
            failed = true;
            break;
          }

          cloneObj[key] = [chosenClone];

          origNode = chosenOrig;
          cloneNode = chosenClone;
        } else {
          origNode = origObj[key];
          cloneNode = cloneObj[key];
          if (cloneNode === undefined) {
            failed = true;
            break;
          }
        }
      }

      if (failed) {
        continue;
      }

      function trimArrays(node: unknown): void {
        if (node === null || node === undefined) {
          return;
        }
        if (Array.isArray(node)) {
          if (node.length > 1) {
            const first = node[0];
            node.length = 1;
            node[0] = first;
          }
          if (node[0] !== undefined && typeof node[0] === 'object') {
            trimArrays(node[0]);
          }
          return;
        }
        if (typeof node === 'object') {
          for (const key in node as Record<string, unknown>) {
            if (!Object.prototype.hasOwnProperty.call(node, key)) {
              continue;
            }
            trimArrays((node as Record<string, unknown>)[key]);
          }
        }
      }

      trimArrays(clone);

      try {
        const exampleStr = JSON.stringify(clone, null, 2);
        results.push({ path, example: exampleStr });
      } catch {
        // ignore stringify errors
      }
    }

    return results;
  }
}

