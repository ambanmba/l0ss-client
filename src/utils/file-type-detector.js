/**
 * File Type Detection Utility
 */

export function detectFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();

  const typeMap = {
    json: 'JSON',
    csv: 'CSV',
    js: 'JavaScript',
    mjs: 'JavaScript',
    html: 'HTML',
    htm: 'HTML',
    css: 'CSS',
    sql: 'SQL',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
    svg: 'SVG',
    md: 'Markdown',
    markdown: 'Markdown',
    txt: 'Text'
  };

  return typeMap[ext] || 'Text';
}

export function getSupportedExtensions() {
  return [
    '.json', '.csv', '.js', '.mjs',
    '.html', '.htm', '.css', '.sql',
    '.xml', '.yaml', '.yml', '.svg',
    '.md', '.markdown', '.txt'
  ];
}
