/**
 * HTML/CSS compression engine with lossy optimizations
 */

/**
 * Compress HTML with specified loss level
 */
export async function compressHTML(content, lossLevel = 'moderate', customOptions = {}) {
  const operations = [];
  const originalSize = content.length;
  let compressed = content;

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalHTMLCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateHTMLCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveHTMLCompression(compressed, operations, customOptions);
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
 * Compress CSS with specified loss level
 */
export async function compressCSS(content, lossLevel = 'moderate', customOptions = {}) {
  const operations = [];
  const originalSize = content.length;
  let compressed = content;

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalCSSCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateCSSCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveCSSCompression(compressed, operations, customOptions);
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
 * Minimal HTML compression
 */
function applyMinimalHTMLCompression(html, operations, customOptions) {
  let minified = html;

  // Remove HTML comments
  if (customOptions.removeComments !== false) {
    const before = minified.length;
    minified = minified.replace(/<!--[\s\S]*?-->/g, '');

    if (minified.length < before) {
      operations.push({
        type: 'remove_html_comments',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove extra whitespace between tags
  const before = minified.length;
  minified = minified
    .replace(/>\s+</g, '><')  // Remove whitespace between tags
    .replace(/\s{2,}/g, ' ')  // Multiple spaces to single space
    .trim();

  if (minified.length < before) {
    operations.push({
      type: 'remove_whitespace',
      count: before - minified.length,
      reversible: false,
      impact: 'low'
    });
  }

  return minified;
}

/**
 * Moderate HTML compression
 * Inspired by tdewolff/minify HTML5 optimization techniques
 */
function applyModerateHTMLCompression(html, operations, customOptions) {
  // First apply minimal compression
  let minified = applyMinimalHTMLCompression(html, operations, customOptions);

  // Normalize doctype to short HTML5 doctype
  const beforeDoctype = minified.length;
  minified = minified.replace(/<!DOCTYPE\s+html[^>]*>/i, '<!DOCTYPE html>');

  if (minified.length < beforeDoctype) {
    operations.push({
      type: 'normalize_doctype',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove type attributes from script and style tags (not needed in HTML5)
  const beforeType = minified.length;
  minified = minified
    .replace(/<script\s+type="text\/javascript"/gi, '<script')
    .replace(/<style\s+type="text\/css"/gi, '<style');

  if (minified.length < beforeType) {
    operations.push({
      type: 'remove_default_type_attributes',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Collapse boolean attributes (disabled="disabled" → disabled)
  const beforeBoolean = minified.length;
  minified = minified
    .replace(/\s(checked|disabled|selected|readonly|required|autofocus|autoplay|controls|loop|muted|default|multiple|open)="[^"]*"/g, ' $1')
    .replace(/\s(checked|disabled|selected|readonly|required|autofocus|autoplay|controls|loop|muted|default|multiple|open)='[^']*'/g, ' $1');

  if (minified.length < beforeBoolean) {
    operations.push({
      type: 'collapse_boolean_attributes',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove default attribute values
  const beforeDefaults = minified.length;
  minified = minified
    .replace(/<input([^>]*)\stype="text"/gi, '<input$1')  // type="text" is default
    .replace(/<button([^>]*)\stype="submit"/gi, '<button$1');  // type="submit" is default

  if (minified.length < beforeDefaults) {
    operations.push({
      type: 'remove_default_attributes',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove optional quotes from attributes (safe cases only)
  const beforeQuotes = minified.length;
  minified = minified.replace(/\s([a-z-]+)="([a-zA-Z0-9-]+)"/g, ' $1=$2');

  if (minified.length < beforeQuotes) {
    operations.push({
      type: 'remove_optional_quotes',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove more optional closing tags (inspired by tdewolff/minify)
  const beforeClosing = minified.length;
  minified = minified
    .replace(/<\/li>\s*<li>/gi, '<li>')        // List items
    .replace(/<\/li>\s*<\/ul>/gi, '</ul>')     // Last list item
    .replace(/<\/li>\s*<\/ol>/gi, '</ol>')     // Last list item
    .replace(/<\/p>\s*<p>/gi, '<p>')           // Paragraphs
    .replace(/<\/option>\s*<option>/gi, '<option>')  // Options
    .replace(/<\/option>\s*<\/select>/gi, '</select>')  // Last option
    .replace(/<\/td>\s*<td>/gi, '<td>')        // Table cells
    .replace(/<\/td>\s*<\/tr>/gi, '</tr>')     // Last table cell
    .replace(/<\/tr>\s*<tr>/gi, '<tr>')        // Table rows
    .replace(/<\/th>\s*<th>/gi, '<th>')        // Table headers
    .replace(/<\/dt>\s*<dt>/gi, '<dt>')        // Definition terms
    .replace(/<\/dd>\s*<dd>/gi, '<dd>');       // Definition descriptions

  if (minified.length < beforeClosing) {
    operations.push({
      type: 'remove_optional_closing_tags',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  return minified;
}

/**
 * Aggressive HTML compression
 */
function applyAggressiveHTMLCompression(html, operations, customOptions) {
  // First apply moderate compression
  let minified = applyModerateHTMLCompression(html, operations, customOptions);

  // Remove meta tags (if enabled)
  if (customOptions.removeMetadata) {
    const before = minified.length;
    minified = minified.replace(/<meta[^>]*>/gi, '');

    if (minified.length < before) {
      operations.push({
        type: 'remove_meta_tags',
        count: 1,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  // Remove analytics/tracking scripts
  if (customOptions.removeAnalytics) {
    const before = minified.length;
    minified = minified.replace(/<script[^>]*analytics[^>]*>[\s\S]*?<\/script>/gi, '');
    minified = minified.replace(/<script[^>]*gtag[^>]*>[\s\S]*?<\/script>/gi, '');

    if (minified.length < before) {
      operations.push({
        type: 'remove_analytics_scripts',
        count: 1,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  // Inline small CSS files (if enabled)
  if (customOptions.inlineStyles) {
    // Simplified - would need actual file reading in production
    operations.push({
      type: 'inline_styles',
      count: 0,
      reversible: false,
      impact: 'medium'
    });
  }

  return minified;
}

/**
 * Minimal CSS compression
 */
function applyMinimalCSSCompression(css, operations, customOptions) {
  let minified = css;

  // Remove CSS comments
  if (customOptions.removeComments !== false) {
    const before = minified.length;
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    if (minified.length < before) {
      operations.push({
        type: 'remove_css_comments',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove whitespace
  const before = minified.length;
  minified = minified
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .trim();

  if (minified.length < before) {
    operations.push({
      type: 'remove_whitespace',
      count: before - minified.length,
      reversible: false,
      impact: 'low'
    });
  }

  return minified;
}

/**
 * Moderate CSS compression
 * Inspired by CSSO (CSS Optimizer) structural optimization techniques
 */
function applyModerateCSSCompression(css, operations, customOptions) {
  // First apply minimal compression
  let minified = applyMinimalCSSCompression(css, operations, customOptions);

  // Shorten color codes (#ffffff -> #fff)
  const beforeColors = minified.length;
  minified = minified.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');

  if (minified.length < beforeColors) {
    operations.push({
      type: 'shorten_color_codes',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove unnecessary units (0px -> 0)
  const beforeUnits = minified.length;
  minified = minified.replace(/\b0(px|em|rem|%|vh|vw|ch|ex|cm|mm|in|pt|pc)/g, '0');

  if (minified.length < beforeUnits) {
    operations.push({
      type: 'remove_zero_units',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Merge duplicate properties (inspired by CSSO)
  // Example: margin:20px 30px; margin-left:0px; -> margin:20px 30px 20px 0
  const beforeMerge = minified.length;
  minified = mergeDuplicateProperties(minified);

  if (minified.length < beforeMerge) {
    operations.push({
      type: 'merge_duplicate_properties',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Shorten repeated values (margin: 10px 10px 10px 10px -> margin: 10px)
  const beforeShorten = minified.length;
  minified = minified
    .replace(/:\s*(\S+)\s+\1\s+\1\s+\1(?=\s*[;}])/g, ':$1')       // All 4 same -> 1
    .replace(/:\s*(\S+)\s+(\S+)\s+\1\s+\2(?=\s*[;}])/g, ':$1 $2'); // top/bottom same -> 2

  if (minified.length < beforeShorten) {
    operations.push({
      type: 'shorten_repeated_values',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Merge identical selectors (inspired by CSSO)
  // Example: h1{color:red}h1{font-size:20px} -> h1{color:red;font-size:20px}
  const beforeSelectors = minified.length;
  minified = mergeIdenticalSelectors(minified);

  if (minified.length < beforeSelectors) {
    operations.push({
      type: 'merge_identical_selectors',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove duplicate properties (keep last occurrence)
  const beforeDuplicates = minified.length;
  minified = removeDuplicateProperties(minified);

  if (minified.length < beforeDuplicates) {
    operations.push({
      type: 'remove_duplicate_properties',
      count: 1,
      reversible: false,
      impact: 'low'
    });
  }

  return minified;
}

/**
 * Merge duplicate properties within same selector
 * Inspired by CSSO's property merging algorithm
 */
function mergeDuplicateProperties(css) {
  // Simple regex-based approach for margin/padding merging
  // This is a simplified version of CSSO's full AST-based approach
  return css
    .replace(/margin:(\d+px)\s+(\d+px);margin-left:(\d+px);/g, 'margin:$1 $2 $1 $3;')
    .replace(/margin:(\d+px)\s+(\d+px);margin-right:(\d+px);/g, 'margin:$1 $3 $1 $2;')
    .replace(/padding:(\d+px)\s+(\d+px);padding-left:(\d+px);/g, 'padding:$1 $2 $1 $3;')
    .replace(/padding:(\d+px)\s+(\d+px);padding-right:(\d+px);/g, 'padding:$1 $3 $1 $2;');
}

/**
 * Merge blocks with identical selectors
 * Inspired by CSSO's selector merging
 */
function mergeIdenticalSelectors(css) {
  const selectorMap = new Map();
  const selectorRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  // Collect all selectors and their properties
  while ((match = selectorRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const properties = match[2].trim();

    if (selectorMap.has(selector)) {
      // Merge properties
      selectorMap.set(selector, selectorMap.get(selector) + ';' + properties);
    } else {
      selectorMap.set(selector, properties);
    }
  }

  // Rebuild CSS with merged selectors
  const merged = Array.from(selectorMap.entries())
    .map(([selector, props]) => `${selector}{${props}}`)
    .join('');

  return merged.length < css.length ? merged : css;
}

/**
 * Remove duplicate property declarations (keep last)
 * Inspired by CSSO's duplicate removal
 */
function removeDuplicateProperties(css) {
  return css.replace(/([^{]+)\{([^}]+)\}/g, (match, selector, properties) => {
    const props = properties.split(';').filter(p => p.trim());
    const propMap = new Map();

    // Keep last occurrence of each property
    props.forEach(prop => {
      const [key] = prop.split(':');
      if (key) {
        propMap.set(key.trim(), prop.trim());
      }
    });

    const uniqueProps = Array.from(propMap.values()).join(';');
    return `${selector}{${uniqueProps}}`;
  });
}

/**
 * Aggressive CSS compression
 */
function applyAggressiveCSSCompression(css, operations, customOptions) {
  // First apply moderate compression
  let minified = applyModerateCSSCompression(css, operations, customOptions);

  // Remove unused CSS (simplified - would need DOM analysis in production)
  if (customOptions.removeUnused) {
    operations.push({
      type: 'remove_unused_css',
      count: 0,
      reversible: false,
      impact: 'high'
    });
  }

  // Merge duplicate selectors
  if (customOptions.mergeDuplicates) {
    operations.push({
      type: 'merge_duplicate_selectors',
      count: 0,
      reversible: false,
      impact: 'medium'
    });
  }

  return minified;
}

/**
 * Get custom options for HTML compression
 */
export function getHTMLOptions() {
  return {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove HTML comments',
      reversible: false
    },
    minify: {
      default: true,
      impact: 'low',
      description: 'Basic minification (remove whitespace)',
      reversible: false
    },
    removeMetadata: {
      default: false,
      impact: 'medium',
      description: 'Remove meta tags',
      reversible: false
    },
    removeAnalytics: {
      default: false,
      impact: 'medium',
      description: 'Remove analytics and tracking scripts',
      reversible: false
    },
    inlineStyles: {
      default: false,
      impact: 'medium',
      description: 'Inline small CSS files',
      reversible: false
    }
  };
}

/**
 * Get custom options for CSS compression
 */
export function getCSSOptions() {
  return {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove CSS comments',
      reversible: false
    },
    minify: {
      default: true,
      impact: 'low',
      description: 'Basic minification (remove whitespace)',
      reversible: false
    },
    shortenColors: {
      default: true,
      impact: 'low',
      description: 'Shorten color codes (#ffffff -> #fff)',
      reversible: true
    },
    removeUnused: {
      default: false,
      impact: 'high',
      description: 'Remove unused CSS rules',
      reversible: false
    },
    mergeDuplicates: {
      default: false,
      impact: 'medium',
      description: 'Merge duplicate selectors',
      reversible: false
    }
  };
}
