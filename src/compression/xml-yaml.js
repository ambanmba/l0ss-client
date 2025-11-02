/**
 * XML/YAML compression engine with lossy optimizations
 */

/**
 * Compress XML with specified loss level
 */
export async function compressXML(content, lossLevel = 'moderate', customOptions = {}) {
  const operations = [];
  const originalSize = content.length;
  let compressed = content;

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalXMLCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateXMLCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveXMLCompression(compressed, operations, customOptions);
      break;
    default:
      throw new Error('Invalid loss level');
  }

  return {
    compressed,
    operations,
    originalSize,
    compressedSize: compressed.length
  };
}

/**
 * Compress YAML with specified loss level
 */
export async function compressYAML(content, lossLevel = 'moderate', customOptions = {}) {
  const operations = [];
  const originalSize = content.length;
  let compressed = content;

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalYAMLCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateYAMLCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveYAMLCompression(compressed, operations, customOptions);
      break;
    default:
      throw new Error('Invalid loss level');
  }

  return {
    compressed,
    operations,
    originalSize,
    compressedSize: compressed.length
  };
}

/**
 * Minimal XML compression
 */
function applyMinimalXMLCompression(xml, operations, customOptions) {
  let compressed = xml;

  // Remove XML comments
  if (customOptions.removeComments !== false) {
    const before = compressed.length;
    compressed = compressed.replace(/<!--[\s\S]*?-->/g, '');

    if (compressed.length < before) {
      operations.push({
        type: 'remove_comments',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove whitespace between tags
  if (customOptions.removeWhitespace !== false) {
    const before = compressed.length;
    compressed = compressed
      .replace(/>\s+</g, '><')  // Remove whitespace between tags
      .replace(/\s{2,}/g, ' ')   // Multiple spaces to single
      .trim();

    if (compressed.length < before) {
      operations.push({
        type: 'remove_whitespace',
        count: before - compressed.length,
        reversible: false,
        impact: 'low'
      });
    }
  }

  return compressed;
}

/**
 * Moderate XML compression
 * Inspired by HTML minification techniques (tdewolff/minify)
 */
function applyModerateXMLCompression(xml, operations, customOptions) {
  // First apply minimal compression
  let compressed = applyMinimalXMLCompression(xml, operations, customOptions);

  // Remove XML declaration if not needed
  const beforeDecl = compressed.length;
  compressed = compressed.replace(/<\?xml[^?]*\?>/g, '');

  if (compressed.length < beforeDecl) {
    operations.push({
      type: 'remove_xml_declaration',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove DOCTYPE declarations
  const beforeDoctype = compressed.length;
  compressed = compressed.replace(/<!DOCTYPE[^>]*>/gi, '');

  if (compressed.length < beforeDoctype) {
    operations.push({
      type: 'remove_doctype',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove CDATA sections (convert to regular text)
  if (customOptions.removeCDATA !== false) {
    const beforeCDATA = compressed.length;
    compressed = compressed.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

    if (compressed.length < beforeCDATA) {
      operations.push({
        type: 'remove_cdata',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Remove empty elements
  if (customOptions.removeEmpty !== false) {
    const beforeEmpty = compressed.length;
    let prevLength;

    // Repeat until no more empty elements
    do {
      prevLength = compressed.length;
      compressed = compressed.replace(/<([a-zA-Z][\w:-]*)[^>]*>\s*<\/\1>/g, '');
    } while (compressed.length < prevLength);

    if (compressed.length < beforeEmpty) {
      operations.push({
        type: 'remove_empty_elements',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Collapse boolean attributes
  const beforeBool = compressed.length;
  compressed = compressed.replace(/(\w+)="(\1)"/g, '$1');

  if (compressed.length < beforeBool) {
    operations.push({
      type: 'collapse_boolean_attributes',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove quotes from simple attribute values
  if (customOptions.removeQuotes !== false) {
    const beforeQuotes = compressed.length;
    // Only remove quotes from alphanumeric values (safe)
    compressed = compressed.replace(/="([a-zA-Z0-9_-]+)"/g, '=$1');

    if (compressed.length < beforeQuotes) {
      operations.push({
        type: 'remove_attribute_quotes',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Shorten numeric precision
  if (customOptions.roundNumbers !== false) {
    const beforeNumbers = compressed.length;
    compressed = compressed.replace(/="(-?\d+\.\d{3,})"/g, (match, num) => {
      return `="${parseFloat(num).toFixed(2)}"`;
    });

    if (compressed.length < beforeNumbers) {
      operations.push({
        type: 'round_numeric_values',
        decimals: 2,
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove optional attributes (xmlns, version, etc.) - only if explicitly enabled
  if (customOptions.removeOptionalAttrs) {
    const beforeAttrs = compressed.length;
    compressed = compressed.replace(/\s+xmlns(:[a-z]+)?="[^"]*"/gi, '');
    compressed = compressed.replace(/\s+version="[^"]*"/gi, '');

    if (compressed.length < beforeAttrs) {
      operations.push({
        type: 'remove_optional_attributes',
        count: 1,
        reversible: true,
        impact: 'medium'
      });
    }
  }

  return compressed;
}

/**
 * Aggressive XML compression
 */
function applyAggressiveXMLCompression(xml, operations, customOptions) {
  // First apply moderate compression
  let compressed = applyModerateXMLCompression(xml, operations, customOptions);

  // Shorten tag names
  if (customOptions.shortenTags) {
    const tagMap = new Map();
    let tagCounter = 0;

    // Find all unique tags
    const tagPattern = /<\/?([a-zA-Z][\w:-]*)/g;
    let match;
    const tags = new Set();

    while ((match = tagPattern.exec(compressed)) !== null) {
      tags.add(match[1]);
    }

    // Create short names for long tags
    tags.forEach(tag => {
      if (tag.length > 3) {
        tagMap.set(tag, `t${tagCounter++}`);
      }
    });

    // Replace tags
    tagMap.forEach((shortTag, longTag) => {
      const regex = new RegExp(`<(\/?)${longTag}([ >])`, 'g');
      compressed = compressed.replace(regex, `<$1${shortTag}$2`);
    });

    if (tagMap.size > 0) {
      operations.push({
        type: 'shorten_tag_names',
        count: tagMap.size,
        mapping: Object.fromEntries(tagMap),
        reversible: true,
        impact: 'high'
      });
    }
  }

  return compressed;
}

/**
 * Minimal YAML compression
 */
function applyMinimalYAMLCompression(yaml, operations, customOptions) {
  let compressed = yaml;

  // Remove YAML comments
  if (customOptions.removeComments !== false) {
    const before = compressed.length;
    compressed = compressed.replace(/#.*$/gm, '');

    if (compressed.length < before) {
      operations.push({
        type: 'remove_comments',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove extra blank lines
  const before = compressed.length;
  compressed = compressed.replace(/\n{3,}/g, '\n\n');

  if (compressed.length < before) {
    operations.push({
      type: 'remove_extra_blank_lines',
      count: 1,
      reversible: false,
      impact: 'low'
    });
  }

  // Remove trailing whitespace
  const beforeTrailing = compressed.length;
  compressed = compressed.replace(/[ \t]+$/gm, '');

  if (compressed.length < beforeTrailing) {
    operations.push({
      type: 'remove_trailing_whitespace',
      count: 1,
      reversible: false,
      impact: 'low'
    });
  }

  return compressed;
}

/**
 * Moderate YAML compression
 * Inspired by YAML minification best practices
 */
function applyModerateYAMLCompression(yaml, operations, customOptions) {
  // First apply minimal compression
  let compressed = applyMinimalYAMLCompression(yaml, operations, customOptions);

  // Remove document markers (--- and ...)
  const beforeMarkers = compressed.length;
  compressed = compressed.replace(/^---\s*$/gm, '');
  compressed = compressed.replace(/^\.\.\.\s*$/gm, '');

  if (compressed.length < beforeMarkers) {
    operations.push({
      type: 'remove_document_markers',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Convert multi-line strings to single line where possible
  if (customOptions.inlineStrings !== false) {
    const beforeInline = compressed.length;
    // Convert literal block scalars (|) to inline where short
    compressed = compressed.replace(/:\s*\|\s*\n\s+(.+)$/gm, ': "$1"');
    // Convert folded block scalars (>) to inline where short
    compressed = compressed.replace(/:\s*>\s*\n\s+(.+)$/gm, ': "$1"');

    if (compressed.length < beforeInline) {
      operations.push({
        type: 'inline_short_strings',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Remove unnecessary quotes from simple strings
  if (customOptions.removeQuotes !== false) {
    const beforeQuotes = compressed.length;
    // Only remove quotes from simple alphanumeric strings
    compressed = compressed.replace(/:\s*"([a-zA-Z0-9_-]+)"\s*$/gm, ': $1');
    compressed = compressed.replace(/:\s*'([a-zA-Z0-9_-]+)'\s*$/gm, ': $1');

    if (compressed.length < beforeQuotes) {
      operations.push({
        type: 'remove_unnecessary_quotes',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Convert null values to shorter form
  const beforeNull = compressed.length;
  compressed = compressed.replace(/:\s*null\s*$/gm, ': ~');

  if (compressed.length < beforeNull) {
    operations.push({
      type: 'shorten_null_values',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Convert true/false to shorter form
  const beforeBool = compressed.length;
  compressed = compressed.replace(/:\s*true\s*$/gm, ': !!bool true');
  compressed = compressed.replace(/:\s*false\s*$/gm, ': !!bool false');
  // Actually, the !!bool tag is longer, so let's keep true/false as is
  compressed = compressed.replace(/:\s*!!bool (true|false)\s*$/gm, ': $1');

  // Convert multi-line to flow style for arrays (if enabled)
  if (customOptions.useFlowStyle) {
    const lines = compressed.split('\n');
    const result = [];
    let inArray = false;
    let arrayItems = [];
    let indent = '';

    lines.forEach(line => {
      const trimmed = line.trim();

      if (trimmed.startsWith('- ')) {
        if (!inArray) {
          inArray = true;
          indent = line.match(/^\s*/)[0];
          arrayItems = [];
        }
        arrayItems.push(trimmed.substring(2));
      } else {
        if (inArray) {
          result.push(`${indent}[${arrayItems.join(', ')}]`);
          inArray = false;
          arrayItems = [];
        }
        result.push(line);
      }
    });

    if (inArray) {
      result.push(`${indent}[${arrayItems.join(', ')}]`);
    }

    compressed = result.join('\n');

    operations.push({
      type: 'convert_to_flow_style',
      count: 1,
      reversible: true,
      impact: 'medium'
    });
  }

  return compressed;
}

/**
 * Aggressive YAML compression
 */
function applyAggressiveYAMLCompression(yaml, operations, customOptions) {
  // First apply moderate compression
  let compressed = applyModerateYAMLCompression(yaml, operations, customOptions);

  // Shorten long keys
  if (customOptions.shortenKeys) {
    const keyMap = new Map();
    let keyCounter = 0;

    // Find all keys
    const keyPattern = /^(\s*)([a-zA-Z_][\w-]*):(?!\s*[|>])/gm;
    let match;
    const keys = new Set();

    while ((match = keyPattern.exec(compressed)) !== null) {
      const key = match[2];
      if (key.length > 5) {
        keys.add(key);
      }
    }

    // Create short names
    keys.forEach(key => {
      keyMap.set(key, `k${keyCounter++}`);
    });

    // Replace keys
    keyMap.forEach((shortKey, longKey) => {
      const regex = new RegExp(`^(\\s*)${longKey}:`, 'gm');
      compressed = compressed.replace(regex, `$1${shortKey}:`);
    });

    if (keyMap.size > 0) {
      operations.push({
        type: 'shorten_keys',
        count: keyMap.size,
        mapping: Object.fromEntries(keyMap),
        reversible: true,
        impact: 'high'
      });
    }
  }

  return compressed;
}

/**
 * Get custom options for XML compression
 */
export function getXMLOptions() {
  return {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove XML comments',
      reversible: false
    },
    removeWhitespace: {
      default: true,
      impact: 'low',
      description: 'Remove unnecessary whitespace',
      reversible: false
    },
    removeOptionalAttrs: {
      default: false,
      impact: 'medium',
      description: 'Remove optional attributes (xmlns, version)',
      reversible: true
    },
    shortenTags: {
      default: false,
      impact: 'high',
      description: 'Shorten tag names',
      reversible: true
    }
  };
}

/**
 * Get custom options for YAML compression
 */
export function getYAMLOptions() {
  return {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove YAML comments',
      reversible: false
    },
    useFlowStyle: {
      default: false,
      impact: 'medium',
      description: 'Convert arrays to flow style',
      reversible: true
    },
    shortenKeys: {
      default: false,
      impact: 'high',
      description: 'Shorten long key names',
      reversible: true
    }
  };
}
