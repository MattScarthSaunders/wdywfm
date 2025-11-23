interface SchemaGenerationResult {
  type: string;
  interfaces: Map<string, string>;
  interfaceSchemas: Map<string, string>; // Maps interface name to its schema (type definition)
}

export class TypeScriptSchemaService {

  static generateSchema(json: any, interfaceName: string = 'Response'): string {
    if (json === null || json === undefined) {
      return `export type ${interfaceName} = null;`;
    }

    const result = this.generateType(json, '', '', [], new Map<string, string>(), new Map<string, string>(), new Set<string>());
    const interfaces = Array.from(result.interfaces.values());
    const mainInterface = this.formatAsInterface(result.type, interfaceName);
    
    if (interfaces.length > 0) {
      return [...interfaces, mainInterface].join('\n\n');
    }
    return mainInterface;
  }

  /**
   * Finds an existing interface name for a schema, or generates a new one.
   * Checks for duplicates and compares schemas to reuse when possible.
   */
  private static findOrCreateInterfaceName(
    schema: string,
    baseName: string,
    parentKey: string,
    interfaces: Map<string, string>,
    interfaceSchemas: Map<string, string>
  ): string {
    // Prevent empty interface names - use fallback if baseName is empty
    const safeBaseName = baseName || 'UnidentifiedInterface';
    
    // Normalize schema for comparison (remove whitespace differences)
    const normalizedSchema = this.normalizeSchema(schema);
    
    // First, try the base name (property name only)
    if (!interfaces.has(safeBaseName)) {
      // No conflict, use base name
      return safeBaseName;
    }
    
    // Base name exists, check if schemas match
    const existingSchema = interfaceSchemas.get(safeBaseName);
    if (existingSchema && this.normalizeSchema(existingSchema) === normalizedSchema) {
      // Schemas match, reuse existing interface
      return safeBaseName;
    }
    
    // Schemas don't match, need to differentiate with parent
    if (parentKey) {
      const parentPascal = this.toPascalCase(parentKey);
      const differentiatedName = parentPascal + safeBaseName;
      
      // Check if differentiated name also exists
      if (!interfaces.has(differentiatedName)) {
        return differentiatedName;
      }
      
      // Differentiated name also exists, check if schemas match
      const existingDiffSchema = interfaceSchemas.get(differentiatedName);
      if (existingDiffSchema && this.normalizeSchema(existingDiffSchema) === normalizedSchema) {
        return differentiatedName;
      }
      
      // Even differentiated name conflicts with different schema, keep trying with more context
      // This shouldn't happen often, but handle it by appending a number
      let counter = 2;
      let candidateName = differentiatedName + counter;
      while (interfaces.has(candidateName)) {
        const candidateSchema = interfaceSchemas.get(candidateName);
        if (candidateSchema && this.normalizeSchema(candidateSchema) === normalizedSchema) {
          return candidateName;
        }
        counter++;
        candidateName = differentiatedName + counter;
      }
      return candidateName;
    }
    
    // No parent key but base name conflicts, append number
    let counter = 2;
    let candidateName = safeBaseName + counter;
    while (interfaces.has(candidateName)) {
      const candidateSchema = interfaceSchemas.get(candidateName);
      if (candidateSchema && this.normalizeSchema(candidateSchema) === normalizedSchema) {
        return candidateName;
      }
      counter++;
      candidateName = safeBaseName + counter;
    }
    return candidateName;
  }

  /**
   * Normalizes a schema string for comparison by removing whitespace differences
   */
  private static normalizeSchema(schema: string): string {
    return schema.replace(/\s+/g, ' ').trim();
  }

  /**
   * Finds the nearest named property in the property path
   */
  private static findNearestNamedProperty(propertyPath: string[]): string | null {
    // Traverse backwards to find the first non-empty property name
    for (let i = propertyPath.length - 1; i >= 0; i--) {
      const prop = propertyPath[i];
      if (prop && prop.trim() !== '') {
        return prop;
      }
    }
    return null;
  }

  private static generateType(
    value: any, 
    propertyKey: string,
    parentKey: string,
    propertyPath: string[],
    interfaces: Map<string, string>,
    interfaceSchemas: Map<string, string>,
    visited: Set<string>
  ): SchemaGenerationResult {
    if (value === null) {
      return { type: 'null', interfaces, interfaceSchemas };
    }

    const type = typeof value;

    switch (type) {
      case 'boolean':
        return { type: 'boolean', interfaces, interfaceSchemas };
      case 'number':
        return { type: 'number', interfaces, interfaceSchemas };
      case 'string':
        return { type: 'string', interfaces, interfaceSchemas };
      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return { type: 'unknown[]', interfaces, interfaceSchemas };
          }
          
          const firstItem = value[0];
          // Determine the base interface name for the array items
          // If propertyKey is empty (nested array), find the nearest named property from the path
          let effectivePropertyKey = propertyKey;
          if (!effectivePropertyKey || effectivePropertyKey.trim() === '') {
            const nearestProperty = this.findNearestNamedProperty(propertyPath);
            effectivePropertyKey = nearestProperty || '';
          }
          const baseName = this.toPascalCase(effectivePropertyKey) || 'UnidentifiedInterface';
          
          // Update property path - arrays don't add to the path since they're not named properties
          // The path only tracks object property names we've traversed
          const newPropertyPath = propertyPath;
          
          // For array items, we'll use the base name as parentKey when processing nested properties
          // This allows nested properties to be prefixed with the array's interface name
          const itemResult = this.generateType(firstItem, '', baseName, newPropertyPath, interfaces, interfaceSchemas, visited);
          
          // Merge interfaces and schemas from nested types
          itemResult.interfaces.forEach((iface, key) => {
            interfaces.set(key, iface);
          });
          itemResult.interfaceSchemas.forEach((schema, key) => {
            interfaceSchemas.set(key, schema);
          });
          
          if (itemResult.type.startsWith('{')) {
            // Find or create interface name, checking for duplicates
            // parentKey here is the parent of the array itself (e.g., "extensions")
            const itemInterfaceName = this.findOrCreateInterfaceName(
              itemResult.type,
              baseName,
              parentKey,
              interfaces,
              interfaceSchemas
            );
            
            if (!interfaces.has(itemInterfaceName)) {
              const itemInterface = this.formatAsInterface(itemResult.type, itemInterfaceName);
              interfaces.set(itemInterfaceName, itemInterface);
              interfaceSchemas.set(itemInterfaceName, itemResult.type);
            }
            return { type: `Array<${itemInterfaceName}>`, interfaces, interfaceSchemas };
          }
          
          return { type: `${itemResult.type}[]`, interfaces, interfaceSchemas };
        } else {
          const properties: string[] = [];

          for (const key in value) {
            if (value.hasOwnProperty(key)) {
              const propValue = value[key];
              // Determine the parent key for nested properties
              // If we're in an array item (propertyKey is empty), use parentKey (which is the array interface name)
              // Otherwise, use propertyKey (the current object's property name)
              const nextParentKey = propertyKey || parentKey;
              // Update property path - add current property key to the path
              const newPropertyPath = [...propertyPath, key];
              const propResult = this.generateType(propValue, key, nextParentKey, newPropertyPath, interfaces, interfaceSchemas, visited);
              
              // Merge interfaces and schemas from nested types
              propResult.interfaces.forEach((iface, ifaceKey) => {
                interfaces.set(ifaceKey, iface);
              });
              propResult.interfaceSchemas.forEach((schema, ifaceKey) => {
                interfaceSchemas.set(ifaceKey, schema);
              });
              
              let propType = propResult.type;
              
              if (propResult.type.startsWith('{')) {
                // Find or create interface name, checking for duplicates
                // If key is empty, use fallback name (shouldn't happen in normal JSON)
                const baseName = this.toPascalCase(key) || 'UnidentifiedInterface';
                // Determine parent for interface name generation
                // parentKey is the parent of the current object context
                // When processing array items, parentKey is set to the array's base name (PascalCase, e.g., "Errors")
                // When processing regular objects, parentKey is the raw property name (e.g., "extensions")
                // We detect PascalCase by checking if it starts with uppercase and is a valid identifier
                let effectiveParent: string;
                const isParentKeyPascalCase = parentKey && 
                  /^[A-Z][a-zA-Z0-9]*$/.test(parentKey);
                
                if (isParentKeyPascalCase) {
                  // parentKey is already PascalCase (from array item context), use it directly
                  effectiveParent = parentKey;
                } else if (propertyKey) {
                  // We're in a regular object, use the current object's property name as parent
                  effectiveParent = this.toPascalCase(propertyKey);
                } else {
                  // We're at root level, no parent
                  effectiveParent = '';
                }
                
                const propInterfaceName = this.findOrCreateInterfaceName(
                  propResult.type,
                  baseName,
                  effectiveParent,
                  interfaces,
                  interfaceSchemas
                );
                
                if (!interfaces.has(propInterfaceName)) {
                  const propInterface = this.formatAsInterface(propResult.type, propInterfaceName);
                  interfaces.set(propInterfaceName, propInterface);
                  interfaceSchemas.set(propInterfaceName, propResult.type);
                }
                propType = propInterfaceName;
              } else if (propResult.type.startsWith('Array<')) {
                propType = propResult.type;
              }
              
              const safeKey = this.isValidIdentifier(key) ? key : `"${key}"`;
              properties.push(`  ${safeKey}: ${propType};`);
            }
          }

          if (properties.length === 0) {
            return { type: 'Record<string, unknown>', interfaces, interfaceSchemas };
          }

          const objectType = `{\n${properties.join('\n')}\n}`;
          return { type: objectType, interfaces, interfaceSchemas };
        }
      default:
        return { type: 'unknown', interfaces, interfaceSchemas };
    }
  }

  private static toPascalCase(str: string): string {
    if (!str || str.trim() === '') {
      return '';
    }
    const result = str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .split(/[_\s-]+/)
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    return result || '';
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

