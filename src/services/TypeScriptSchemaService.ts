interface SchemaGenerationResult {
  type: string;
  interfaces: Map<string, string>;
  interfaceSchemas: Map<string, string>; // Maps interface name to its schema (type definition)
}

export class TypeScriptSchemaService {

  generateSchema(json: any, interfaceName: string = 'Response'): string {
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

  private findOrCreateInterfaceName(
    schema: string,
    baseName: string,
    parentKey: string,
    interfaces: Map<string, string>,
    interfaceSchemas: Map<string, string>
  ): string {
    const safeBaseName = baseName || 'UnidentifiedInterface';
    const normalizedSchema = this.normalizeSchema(schema);
    
    if (!interfaces.has(safeBaseName)) {
      return safeBaseName;
    }
    
    const existingSchema = interfaceSchemas.get(safeBaseName);
    if (existingSchema && this.normalizeSchema(existingSchema) === normalizedSchema) {
      return safeBaseName;
    }
    
    if (parentKey) {
      const parentPascal = this.toPascalCase(parentKey);
      const differentiatedName = parentPascal + safeBaseName;
      
      if (!interfaces.has(differentiatedName)) {
        return differentiatedName;
      }
      
      const existingDiffSchema = interfaceSchemas.get(differentiatedName);
      if (existingDiffSchema && this.normalizeSchema(existingDiffSchema) === normalizedSchema) {
        return differentiatedName;
      }
      
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

  private normalizeSchema(schema: string): string {
    return schema.replace(/\s+/g, ' ').trim();
  }

  private findNearestNamedProperty(propertyPath: string[]): string | null {
    for (let i = propertyPath.length - 1; i >= 0; i--) {
      const prop = propertyPath[i];
      if (prop && prop.trim() !== '') {
        return prop;
      }
    }
    return null;
  }

  private generateType(
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
          let effectivePropertyKey = propertyKey;
          if (!effectivePropertyKey || effectivePropertyKey.trim() === '') {
            const nearestProperty = this.findNearestNamedProperty(propertyPath);
            effectivePropertyKey = nearestProperty || '';
          }
          const baseName = this.toPascalCase(effectivePropertyKey) || 'UnidentifiedInterface';
          const newPropertyPath = propertyPath;
          const itemResult = this.generateType(firstItem, '', baseName, newPropertyPath, interfaces, interfaceSchemas, visited);
          
          itemResult.interfaces.forEach((iface, key) => {
            interfaces.set(key, iface);
          });
          itemResult.interfaceSchemas.forEach((schema, key) => {
            interfaceSchemas.set(key, schema);
          });
          
          if (itemResult.type.startsWith('{')) {
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
              const nextParentKey = propertyKey || parentKey;
              const newPropertyPath = [...propertyPath, key];
              const propResult = this.generateType(propValue, key, nextParentKey, newPropertyPath, interfaces, interfaceSchemas, visited);
              
              propResult.interfaces.forEach((iface, ifaceKey) => {
                interfaces.set(ifaceKey, iface);
              });
              propResult.interfaceSchemas.forEach((schema, ifaceKey) => {
                interfaceSchemas.set(ifaceKey, schema);
              });
              
              let propType = propResult.type;
              
              if (propResult.type.startsWith('{')) {
                const baseName = this.toPascalCase(key) || 'UnidentifiedInterface';
                let effectiveParent: string;
                const isParentKeyPascalCase = parentKey && 
                  /^[A-Z][a-zA-Z0-9]*$/.test(parentKey);
                
                if (isParentKeyPascalCase) {
                  effectiveParent = parentKey;
                } else if (propertyKey) {
                  effectiveParent = this.toPascalCase(propertyKey);
                } else {
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

  private toPascalCase(str: string): string {
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

  private isValidIdentifier(str: string): boolean {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
  }

  formatAsInterface(schema: string, interfaceName: string = 'Response'): string {
    const cleanSchema = schema.trim();
    if (!cleanSchema.startsWith('{')) {
      return `export interface ${interfaceName} {\n  data: ${cleanSchema};\n}`;
    }
    return `export interface ${interfaceName} ${cleanSchema}`;
  }

  async getResponseBody(_requestId: string): Promise<string | null> {
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

  generateSchemaFromResponseBody(responseBody: string, interfaceName: string = 'Response'): string | null {
    try {
      const json = JSON.parse(responseBody);
      return this.generateSchema(json, interfaceName);
    } catch (error) {
      return null;
    }
  }
}

