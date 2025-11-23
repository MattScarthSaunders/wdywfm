interface SchemaGenerationResult {
  type: string;
  interfaces: Map<string, string>;
}

export class TypeScriptSchemaService {

  static generateSchema(json: any, interfaceName: string = 'Response'): string {
    if (json === null || json === undefined) {
      return `export type ${interfaceName} = null;`;
    }

    const result = this.generateType(json, '', new Map<string, string>(), new Set<string>());
    const interfaces = Array.from(result.interfaces.values());
    const mainInterface = this.formatAsInterface(result.type, interfaceName);
    
    if (interfaces.length > 0) {
      return [...interfaces, mainInterface].join('\n\n');
    }
    return mainInterface;
  }

  private static generateType(
    value: any, 
    propertyKey: string, 
    interfaces: Map<string, string>,
    visited: Set<string>
  ): SchemaGenerationResult {
    if (value === null) {
      return { type: 'null', interfaces };
    }

    const type = typeof value;

    switch (type) {
      case 'boolean':
        return { type: 'boolean', interfaces };
      case 'number':
        return { type: 'number', interfaces };
      case 'string':
        return { type: 'string', interfaces };
      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return { type: 'unknown[]', interfaces };
          }
          
          const firstItem = value[0];
          const itemInterfaceName = this.toPascalCase(propertyKey);
          const itemResult = this.generateType(firstItem, itemInterfaceName, interfaces, visited);
          
          itemResult.interfaces.forEach((iface, key) => {
            interfaces.set(key, iface);
          });
          
          if (itemResult.type.startsWith('{')) {
            if (!interfaces.has(itemInterfaceName)) {
              const itemInterface = this.formatAsInterface(itemResult.type, itemInterfaceName);
              interfaces.set(itemInterfaceName, itemInterface);
            }
            return { type: `Array<${itemInterfaceName}>`, interfaces };
          }
          
          return { type: `${itemResult.type}[]`, interfaces };
        } else {
          const properties: string[] = [];

          for (const key in value) {
            if (value.hasOwnProperty(key)) {
              const propValue = value[key];
              const propInterfaceName = this.toPascalCase(key);
              const propResult = this.generateType(propValue, propInterfaceName, interfaces, visited);
              let propType = propResult.type;
              
              if (propResult.type.startsWith('{')) {
                if (interfaces.has(propInterfaceName)) {
                  propType = propInterfaceName;
                } else {
                  const propInterface = this.formatAsInterface(propResult.type, propInterfaceName);
                  interfaces.set(propInterfaceName, propInterface);
                  propType = propInterfaceName;
                }
              } else if (propResult.type.startsWith('Array<')) {
                propType = propResult.type;
              }
              
              const safeKey = this.isValidIdentifier(key) ? key : `"${key}"`;
              properties.push(`  ${safeKey}: ${propType};`);
            }
          }

          if (properties.length === 0) {
            return { type: 'Record<string, unknown>', interfaces };
          }

          const objectType = `{\n${properties.join('\n')}\n}`;
          return { type: objectType, interfaces };
        }
      default:
        return { type: 'unknown', interfaces };
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

  static formatAsInterface(schema: string, interfaceName: string = 'Response'): string {
    const cleanSchema = schema.trim();
    if (!cleanSchema.startsWith('{')) {
      return `export interface ${interfaceName} {\n  data: ${cleanSchema};\n}`;
    }
    return `export interface ${interfaceName} ${cleanSchema}`;
  }

  static async getResponseBody(_requestId: string): Promise<string | null> {
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
        resolve(null);
      }
    });
  }

  static generateSchemaFromResponseBody(responseBody: string, interfaceName: string = 'Response'): string | null {
    try {
      const json = JSON.parse(responseBody);
      return this.generateSchema(json, interfaceName);
    } catch (error) {
      return null;
    }
  }
}

