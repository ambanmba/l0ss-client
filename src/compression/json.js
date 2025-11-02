/**
 * JSON compression engine with lossy optimizations
 */

/**
 * Compress JSON with specified loss level
 */
export async function compressJSON(content, lossLevel = 'moderate', customOptions = {}) {
  let data;
  let originalContent;

  try {
    if (typeof content === 'string') {
      originalContent = content;
      data = JSON.parse(content);
    } else {
      originalContent = JSON.stringify(content);
      data = content;
    }
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  const operations = [];
  let compressed = JSON.parse(JSON.stringify(data)); // Deep clone

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveCompression(compressed, operations, customOptions);
      break;
    default:
      throw new Error('Invalid loss level');
  }

  const result = JSON.stringify(compressed);

  return {
    compressed: result,
    operations,
    originalSize: originalContent.length,
    compressedSize: result.length
  };
}

/**
 * Minimal compression - safe, reversible optimizations
 */
function applyMinimalCompression(data, operations, customOptions) {
  // Remove null values
  if (customOptions.removeNulls !== false) {
    const nullCount = removeNulls(data);
    if (nullCount > 0) {
      operations.push({
        type: 'remove_nulls',
        count: nullCount,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Remove empty arrays and objects
  const emptyCount = removeEmpty(data);
  if (emptyCount > 0) {
    operations.push({
      type: 'remove_empty',
      count: emptyCount,
      reversible: true,
      impact: 'low'
    });
  }

  // Trim whitespace in strings
  const trimCount = trimStrings(data);
  if (trimCount > 0) {
    operations.push({
      type: 'trim_strings',
      count: trimCount,
      reversible: false,
      impact: 'low'
    });
  }

  return data;
}

/**
 * Moderate compression - balance between size and data preservation
 */
function applyModerateCompression(data, operations, customOptions) {
  // First apply minimal compression
  data = applyMinimalCompression(data, operations, customOptions);

  // Shorten object keys (now enabled by default with advanced frequency-based compression)
  if (customOptions.shortenKeys !== false) {
    const keyMap = shortenKeys(data);
    if (keyMap && Object.keys(keyMap).length > 0) {
      operations.push({
        type: 'shorten_keys',
        count: Object.keys(keyMap).length,
        reversible: true,
        impact: 'medium'
      });
    }
  }

  // Round numbers to fewer decimal places
  const roundedCount = roundNumbers(data, 2);
  if (roundedCount > 0) {
    operations.push({
      type: 'round_numbers',
      decimals: 2,
      count: roundedCount,
      reversible: false,
      impact: 'medium'
    });
  }

  // Deduplicate repeated values in arrays
  const dedupeCount = deduplicateArrays(data);
  if (dedupeCount > 0) {
    operations.push({
      type: 'deduplicate_arrays',
      count: dedupeCount,
      reversible: false,
      impact: 'medium'
    });
  }

  return data;
}

/**
 * Aggressive compression - maximum size reduction
 */
function applyAggressiveCompression(data, operations, customOptions) {
  // First apply moderate compression
  data = applyModerateCompression(data, operations, customOptions);

  // Truncate long strings
  if (customOptions.truncateStrings !== false) {
    const truncated = truncateStrings(data, 100);
    if (truncated > 0) {
      operations.push({
        type: 'truncate_strings',
        maxLength: 100,
        count: truncated,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Flatten nested structures
  if (customOptions.flattenNesting) {
    const flattened = flattenNesting(data, 3);
    if (flattened > 0) {
      operations.push({
        type: 'flatten_nesting',
        maxDepth: 3,
        count: flattened,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Round numbers to integers
  const roundedToInt = roundNumbers(data, 0);
  if (roundedToInt > 0) {
    operations.push({
      type: 'round_to_integers',
      count: roundedToInt,
      reversible: false,
      impact: 'high'
    });
  }

  return data;
}

/**
 * Remove null values from objects
 */
function removeNulls(obj, count = { value: 0 }) {
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        removeNulls(item, count);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      if (obj[key] === null) {
        delete obj[key];
        count.value++;
      } else if (typeof obj[key] === 'object') {
        removeNulls(obj[key], count);
      }
    });
  }
  return count.value;
}

/**
 * Remove empty arrays and objects
 */
function removeEmpty(obj, count = { value: 0 }) {
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        removeEmpty(item, count);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeEmpty(obj[key], count);
      }

      if (Array.isArray(obj[key]) && obj[key].length === 0) {
        delete obj[key];
        count.value++;
      } else if (typeof obj[key] === 'object' && obj[key] !== null && Object.keys(obj[key]).length === 0) {
        delete obj[key];
        count.value++;
      }
    });
  }
  return count.value;
}

/**
 * Trim whitespace from strings
 */
function trimStrings(obj, count = { value: 0 }) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        const trimmed = obj[i].trim();
        if (trimmed !== obj[i]) {
          obj[i] = trimmed;
          count.value++;
        }
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        trimStrings(obj[i], count);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        const trimmed = obj[key].trim();
        if (trimmed !== obj[key]) {
          obj[key] = trimmed;
          count.value++;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        trimStrings(obj[key], count);
      }
    });
  }
  return count.value;
}

/**
 * Shorten object keys using frequency-based compression
 * Inspired by jsonschema-key-compression and compress-json
 */
function shortenKeys(obj, keyMap = null, isRoot = true) {
  // First pass: collect key frequencies across entire object tree
  if (isRoot) {
    const keyFrequency = {};
    collectKeyFrequencies(obj, keyFrequency);

    // Sort keys by frequency (most common first) and length (longer first for same frequency)
    const sortedKeys = Object.entries(keyFrequency)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]; // Sort by frequency descending
        return b[0].length - a[0].length; // Then by length descending
      })
      .map(([key]) => key);

    // Generate short keys using base62-like encoding (a-z, A-Z, 0-9, then |a, |b, etc.)
    keyMap = {};
    sortedKeys.forEach((key, index) => {
      keyMap[key] = generateShortKey(index);
    });
  }

  // Second pass: apply key replacements
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        shortenKeys(item, keyMap, false);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    keys.forEach(key => {
      const shortKey = keyMap[key];

      // Only replace if we have a mapping and it's shorter
      if (shortKey && shortKey.length < key.length) {
        obj[shortKey] = obj[key];
        delete obj[key];

        // Recursively process nested objects
        if (typeof obj[shortKey] === 'object' && obj[shortKey] !== null) {
          shortenKeys(obj[shortKey], keyMap, false);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Process nested objects even if key wasn't shortened
        shortenKeys(obj[key], keyMap, false);
      }
    });
  }

  return keyMap;
}

/**
 * Collect key frequencies across the entire object tree
 */
function collectKeyFrequencies(obj, frequencies = {}) {
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        collectKeyFrequencies(item, frequencies);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      frequencies[key] = (frequencies[key] || 0) + 1;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        collectKeyFrequencies(obj[key], frequencies);
      }
    });
  }

  return frequencies;
}

/**
 * Generate short key using base62-like encoding
 * 0-9, a-z, A-Z for first 62 keys, then |a, |b, etc.
 */
function generateShortKey(index) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  if (index < chars.length) {
    return chars[index];
  }

  // For keys beyond 62, use |a, |b, |c, ... |aa, |ab, etc.
  const extraIndex = index - chars.length;
  let result = '|';
  let remaining = extraIndex;

  do {
    result += chars[remaining % chars.length];
    remaining = Math.floor(remaining / chars.length);
  } while (remaining > 0);

  return result;
}

/**
 * Round numbers to specified decimal places
 */
function roundNumbers(obj, decimals = 2, count = { value: 0 }) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'number' && !Number.isInteger(obj[i])) {
        obj[i] = parseFloat(obj[i].toFixed(decimals));
        count.value++;
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        roundNumbers(obj[i], decimals, count);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'number' && !Number.isInteger(obj[key])) {
        obj[key] = parseFloat(obj[key].toFixed(decimals));
        count.value++;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        roundNumbers(obj[key], decimals, count);
      }
    });
  }
  return count.value;
}

/**
 * Deduplicate values in arrays
 */
function deduplicateArrays(obj, count = { value: 0 }) {
  if (Array.isArray(obj)) {
    const originalLength = obj.length;
    const unique = [...new Set(obj.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));

    if (unique.length < originalLength) {
      obj.length = 0;
      obj.push(...unique);
      count.value += originalLength - unique.length;
    }

    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        deduplicateArrays(item, count);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        deduplicateArrays(obj[key], count);
      }
    });
  }
  return count.value;
}

/**
 * Truncate long strings
 */
function truncateStrings(obj, maxLength = 100, count = { value: 0 }) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string' && obj[i].length > maxLength) {
        obj[i] = obj[i].substring(0, maxLength) + '...';
        count.value++;
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        truncateStrings(obj[i], maxLength, count);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string' && obj[key].length > maxLength) {
        obj[key] = obj[key].substring(0, maxLength) + '...';
        count.value++;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        truncateStrings(obj[key], maxLength, count);
      }
    });
  }
  return count.value;
}

/**
 * Flatten nested structures beyond a certain depth
 */
function flattenNesting(obj, maxDepth = 3, currentDepth = 0, count = { value: 0 }) {
  if (currentDepth >= maxDepth) {
    return count.value;
  }

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        flattenNesting(item, maxDepth, currentDepth + 1, count);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (currentDepth >= maxDepth - 1) {
          obj[key] = '[Flattened]';
          count.value++;
        } else {
          flattenNesting(obj[key], maxDepth, currentDepth + 1, count);
        }
      }
    });
  }
  return count.value;
}

/**
 * Get custom options for JSON compression
 */
export function getJSONOptions() {
  return {
    removeNulls: {
      default: true,
      impact: 'low',
      description: 'Remove null values from objects',
      reversible: true
    },
    shortenKeys: {
      default: false,
      impact: 'medium',
      description: 'Shorten object keys to reduce size',
      reversible: true
    },
    truncateStrings: {
      default: false,
      impact: 'high',
      description: 'Truncate long strings to 100 characters',
      reversible: false
    },
    flattenNesting: {
      default: false,
      impact: 'high',
      description: 'Flatten deeply nested structures',
      reversible: false
    }
  };
}
