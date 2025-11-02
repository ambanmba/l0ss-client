/**
 * JavaScript compression engine with lossy optimizations
 */

/**
 * Compress JavaScript with specified loss level
 */
export async function compressJavaScript(content, lossLevel = 'moderate', customOptions = {}) {
  const operations = [];
  const originalSize = content.length;
  let compressed = content;

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalJSCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateJSCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveJSCompression(compressed, operations, customOptions);
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
 * Minimal JS compression - basic minification
 */
function applyMinimalJSCompression(code, operations, customOptions) {
  let minified = code;

  // Remove single-line comments
  if (customOptions.removeComments !== false) {
    const before = minified.length;
    minified = minified.replace(/\/\/.*$/gm, '');

    if (minified.length < before) {
      operations.push({
        type: 'remove_single_line_comments',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove multi-line comments
  if (customOptions.removeComments !== false) {
    const before = minified.length;
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    if (minified.length < before) {
      operations.push({
        type: 'remove_multi_line_comments',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove extra whitespace
  const before = minified.length;
  minified = minified
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\s*([{}();,:])\s*/g, '$1')  // Remove spaces around operators
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
 * Moderate JS compression - more aggressive minification
 * Inspired by tdewolff/minify JavaScript optimization techniques
 * https://github.com/tdewolff/minify
 */
function applyModerateJSCompression(code, operations, customOptions) {
  // First apply minimal compression
  let minified = applyMinimalJSCompression(code, operations, customOptions);

  // Remove console statements
  if (customOptions.removeConsole !== false) {
    const before = minified.length;
    minified = minified.replace(/console\.(log|debug|info|warn|error)\([^)]*\);?/g, '');

    if (minified.length < before) {
      operations.push({
        type: 'remove_console',
        count: 1,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  // Remove debugger statements
  const beforeDebugger = minified.length;
  minified = minified.replace(/debugger;?/g, '');

  if (minified.length < beforeDebugger) {
    operations.push({
      type: 'remove_debugger',
      count: 1,
      reversible: false,
      impact: 'low'
    });
  }

  // Enhanced whitespace removal (tdewolff/minify technique)
  const beforeWhitespace = minified.length;
  minified = enhancedWhitespaceRemoval(minified);

  if (minified.length < beforeWhitespace) {
    operations.push({
      type: 'enhanced_whitespace_removal',
      count: 1,
      reversible: false,
      impact: 'low'
    });
  }

  // Optimize semicolons (remove unnecessary ones)
  const beforeSemicolon = minified.length;
  minified = optimizeSemicolons(minified);

  if (minified.length < beforeSemicolon) {
    operations.push({
      type: 'optimize_semicolons',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Shorten true/false to !0/!1
  const beforeBoolean = minified.length;
  minified = minified.replace(/\btrue\b/g, '!0').replace(/\bfalse\b/g, '!1');

  if (minified.length < beforeBoolean) {
    operations.push({
      type: 'shorten_boolean_literals',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Optimize number literals (remove unnecessary decimals and leading zeros)
  const beforeNumbers = minified.length;
  minified = optimizeNumberLiterals(minified);

  if (minified.length < beforeNumbers) {
    operations.push({
      type: 'optimize_number_literals',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Shorten common patterns
  const beforePatterns = minified.length;
  minified = shortenCommonPatterns(minified);

  if (minified.length < beforePatterns) {
    operations.push({
      type: 'shorten_common_patterns',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  return minified;
}

/**
 * Enhanced whitespace removal following JSMin rules with tdewolff improvements
 * Removes whitespace more aggressively while preserving valid JavaScript
 */
function enhancedWhitespaceRemoval(code) {
  let result = code;

  // Remove whitespace around operators (except where it would create issues)
  result = result.replace(/\s*([+\-*/%=<>!&|^~?:])\s*/g, '$1');

  // Remove whitespace after keywords that don't need it
  result = result.replace(/\b(return|throw|new|typeof|delete|void)\s+/g, '$1 ');

  // Remove whitespace before and after brackets/parens
  result = result.replace(/\s*([()[\]{}])\s*/g, '$1');

  // Remove whitespace around commas (keep space after for readability in some contexts)
  result = result.replace(/\s*,\s*/g, ',');

  // Remove whitespace around dots (object property access)
  result = result.replace(/\s*\.\s*/g, '.');

  // Preserve space between keywords and identifiers
  result = result.replace(/\b(if|while|for|with|switch|catch|function|return|throw|new|typeof|delete|void|in|of)\(/g, '$1 (');

  // Remove redundant spaces that might have been created
  result = result.replace(/\s{2,}/g, ' ');

  return result.trim();
}

/**
 * Optimize semicolons - remove unnecessary ones before closing braces
 * Based on ASI (Automatic Semicolon Insertion) rules
 */
function optimizeSemicolons(code) {
  let result = code;

  // Remove semicolons before closing braces
  result = result.replace(/;}/g, '}');

  // Remove semicolons before closing parens (in for loops, keep them)
  result = result.replace(/;(?=\)(?!\s*;))/g, match => {
    // Keep semicolons in for loops
    return match;
  });

  // Remove multiple consecutive semicolons
  result = result.replace(/;{2,}/g, ';');

  return result;
}

/**
 * Optimize number literals for smaller output
 * Examples: 1.0 → 1, 0.5 → .5, 1000 → 1e3
 */
function optimizeNumberLiterals(code) {
  let result = code;

  // Remove unnecessary decimal zeros (1.0 → 1)
  result = result.replace(/\b(\d+)\.0+\b/g, '$1');

  // Remove leading zero from decimals (0.5 → .5)
  result = result.replace(/\b0(\.\d+)/g, '$1');

  // Convert large numbers to scientific notation where beneficial
  result = result.replace(/\b(\d{4,})\b/g, (match, num) => {
    const n = parseInt(num, 10);
    const scientific = n.toExponential();
    return scientific.length < num.length ? scientific : num;
  });

  return result;
}

/**
 * Shorten common JavaScript patterns
 * Based on tdewolff/minify additional improvements
 */
function shortenCommonPatterns(code) {
  let result = code;

  // undefined → void 0 (shorter)
  result = result.replace(/\bundefined\b/g, 'void 0');

  // Replace window.undefined with void 0
  result = result.replace(/window\.undefined/g, 'void 0');

  // Infinity → 1/0
  result = result.replace(/\bInfinity\b/g, '1/0');

  // -Infinity → -1/0
  result = result.replace(/-Infinity\b/g, '-1/0');

  return result;
}

/**
 * Aggressive JS compression - maximum minification
 */
function applyAggressiveJSCompression(code, operations, customOptions) {
  // First apply moderate compression
  let minified = applyModerateJSCompression(code, operations, customOptions);

  // Mangle variable names (simplified version)
  if (customOptions.mangleNames) {
    const varNames = new Map();
    let counter = 0;

    // Find variable declarations
    const varPattern = /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;

    while ((match = varPattern.exec(minified)) !== null) {
      const varName = match[2];
      if (!varNames.has(varName) && varName.length > 2) {
        varNames.set(varName, getShortName(counter++));
      }
    }

    // Replace variable names
    varNames.forEach((shortName, longName) => {
      const regex = new RegExp(`\\b${longName}\\b`, 'g');
      minified = minified.replace(regex, shortName);
    });

    if (varNames.size > 0) {
      operations.push({
        type: 'mangle_variable_names',
        count: varNames.size,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Remove dead code (simplified)
  if (customOptions.removeDeadCode) {
    // Remove if (false) blocks
    const before = minified.length;
    minified = minified.replace(/if\s*\(\s*(!0|false)\s*\)\s*\{[^}]*\}/g, '');

    if (minified.length < before) {
      operations.push({
        type: 'remove_dead_code',
        count: 1,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  return minified;
}

/**
 * Generate short variable name
 */
function getShortName(index) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let name = '';
  let num = index;

  do {
    name = chars[num % 26] + name;
    num = Math.floor(num / 26);
  } while (num > 0);

  return name;
}

/**
 * Get custom options for JavaScript compression
 */
export function getJavaScriptOptions() {
  return {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove all comments',
      reversible: false
    },
    removeConsole: {
      default: true,
      impact: 'medium',
      description: 'Remove console.log statements',
      reversible: false
    },
    minify: {
      default: true,
      impact: 'low',
      description: 'Basic minification (remove whitespace)',
      reversible: false
    },
    mangleNames: {
      default: false,
      impact: 'high',
      description: 'Shorten variable and function names',
      reversible: false
    },
    removeDeadCode: {
      default: false,
      impact: 'medium',
      description: 'Remove unreachable code',
      reversible: false
    }
  };
}
