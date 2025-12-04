export function replaceTemplateValues(templateString?: string, values?: Record<string, any>): string {
  let output: string = templateString || '';
  if (output && values && Object.keys(values).length > 0) {
    for (const [key, value] of Object.entries(values)) {
      output = output.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), `${value}`);
    }
  }
  return output;
}
