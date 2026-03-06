export class SchemaTransformPromptService {
  buildTransformPrompt(sourceSchema: string, targetSchema: string, notes?: string): string {
    const trimmedSource = sourceSchema.trim();
    const trimmedTarget = targetSchema.trim();
    const trimmedNotes = (notes || '').trim();

    const sections: string[] = [];

    sections.push(
      [
        'You are an expert TypeScript and JavaScript developer.',
        'Given two TypeScript type declarations, write a JavaScript function that',
        'transforms data returned from an HTTP response into an object matching',
        'the desired target schema.'
      ].join(' ')
    );

    sections.push('---');
    sections.push('Source TypeScript schema (actual HTTP response shape):');
    sections.push('');
    sections.push(trimmedSource);

    sections.push('');
    sections.push('Target TypeScript schema (desired application shape):');
    sections.push('');
    sections.push(trimmedTarget);

    if (trimmedNotes) {
      sections.push('');
      sections.push('Additional context and mapping notes from the user:');
      sections.push('');
      sections.push(trimmedNotes);
    }

    sections.push('');
    sections.push('---');
    sections.push(
      [
        'Using only the information above, produce a single self-contained',
        'JavaScript function named `transformResponse` that:'
      ].join(' ')
    );

    const bulletPoints: string[] = [
      '- Accepts one argument `response` typed as the source schema.',
      '- Returns a new plain object matching the target schema shape.',
      '- Does not mutate the input `response` object.',
      '- Safely handles missing or optional fields using sensible defaults (null or empty values).',
      '- Includes any necessary mapping, renaming, or nesting logic to bridge schema differences.',
      '- Does not include explanatory comments outside the function, only minimal inline comments if needed.'
    ];

    for (const point of bulletPoints) {
      sections.push(point);
    }

    sections.push('');
    sections.push('Only output the JavaScript code for `transformResponse`, nothing else.');

    return sections.join('\n');
  }
}

