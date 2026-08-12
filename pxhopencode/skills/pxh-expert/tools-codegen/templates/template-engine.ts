function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in data) return String(data[key]);
    throw new Error(`Missing template variable: ${key}`);
  });
}

// PascalCase helper
function pascalCase(str: string): string {
  return str.replace(/(^\w|[-_]\w)/g, g => g.replace(/[-_]/, "").toUpperCase());
}

// camelCase helper
function camelCase(str: string): string {
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}
