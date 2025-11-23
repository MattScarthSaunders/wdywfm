export class TypeScriptSchemaService {
  /**
   * Generates a TypeScript interface/type schema from a JSON object
   */
  static generateSchema(json: any, interfaceName: string = 'Response'): string {
    if (json === null || json === undefined) {
      return `export type ${interfaceName} = null;`;
    }

    const schema = this.generateType(json, interfaceName, 0);
    return schema;
  }

  private static generateType(value: any, name: string, depth: number): string {
    const indent = '  '.repeat(depth);
    const nextIndent = '  '.repeat(depth + 1);

    if (value === null) {
      return `${indent}null`;
    }

    const type = typeof value;

    switch (type) {
      case 'boolean':
        return `${indent}boolean`;
      case 'number':
        return `${indent}number`;
      case 'string':
        return `${indent}string`;
      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return `${indent}unknown[]`;
          }
          // Check if all items have the same structure
          const firstItem = value[0];
          const itemType = this.generateType(firstItem, 'Item', depth + 1);
          // Remove indentation from itemType for array syntax
          const cleanItemType = itemType.trim();
          // Handle nested objects in arrays
          if (cleanItemType.startsWith('{')) {
            return `${indent}Array<${cleanItemType}>`;
          }
          return `${indent}${cleanItemType}[]`;
        } else {
          // Object type
          const properties: string[] = [];

          for (const key in value) {
            if (value.hasOwnProperty(key)) {
              const propValue = value[key];
              const propType = this.generateType(propValue, this.toPascalCase(key), depth + 1);
              // Remove leading indentation and adjust for property
              let cleanPropType = propType.trim();
              
              // If it's a multi-line type (object or array), we need to indent it properly
              if (cleanPropType.includes('\n')) {
                const lines = cleanPropType.split('\n');
                const indentedLines = lines.map((line, idx) => {
                  if (idx === 0) return line;
                  return nextIndent + line.trimStart();
                });
                cleanPropType = indentedLines.join('\n');
              }
              
              const safeKey = this.isValidIdentifier(key) ? key : `"${key}"`;
              properties.push(`${nextIndent}${safeKey}: ${cleanPropType};`);
            }
          }

          if (properties.length === 0) {
            return `${indent}Record<string, unknown>`;
          }

          return `${indent}{\n${properties.join('\n')}\n${indent}}`;
        }
      default:
        return `${indent}unknown`;
    }
  }

  private static toPascalCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .split(/[_\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private static isValidIdentifier(str: string): boolean {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
  }

  /**
   * Formats the schema as a complete TypeScript interface
   */
  static formatAsInterface(schema: string, interfaceName: string = 'Response'): string {
    // Remove leading indentation from schema
    const cleanSchema = schema.trim();
    
    // If it's already a simple type, wrap it
    if (!cleanSchema.startsWith('{')) {
      return `export interface ${interfaceName} {\n  data: ${cleanSchema};\n}`;
    }

    return `export interface ${interfaceName} ${cleanSchema}`;
  }

  /**
   * Gets response body from Chrome DevTools API
   */
  static async getResponseBody(requestId: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        if (typeof chrome === 'undefined' || !chrome.devtools || !chrome.devtools.network) {
          resolve(null);
          return;
        }

        // We need to get the request object
        // Since we don't have direct access to the request object,
        // we'll need to use HAR API or store requests differently
        // For now, we'll return null and handle it in the component
        resolve(null);
      } catch (error) {
        console.error('Error getting response body:', error);
        resolve(null);
      }
    });
  }

  /**
   * Generates TypeScript schema from response body string
   */
  static generateSchemaFromResponseBody(responseBody: string, interfaceName: string = 'Response'): string | null {
    try {
      const json = JSON.parse(responseBody);
      const schema = this.generateType(json, interfaceName, 0);
      return this.formatAsInterface(schema, interfaceName);
    } catch (error) {
      // If it's not valid JSON, return null
      return null;
    }
  }
}

