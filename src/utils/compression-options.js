/**
 * Compression options configuration for all file types
 * Defines available options, defaults, and metadata for each compression engine
 */

export const compressionOptions = {
  JSON: {
    removeNulls: {
      default: true,
      impact: 'low',
      description: 'Remove null values from objects',
      reversible: true
    },
    removeEmpty: {
      default: true,
      impact: 'low',
      description: 'Remove empty arrays and objects',
      reversible: true
    },
    trimStrings: {
      default: true,
      impact: 'low',
      description: 'Trim whitespace from string values',
      reversible: false
    },
    shortenKeys: {
      default: true,
      impact: 'high',
      description: 'Shorten object keys using frequency-based compression',
      reversible: true
    },
    roundNumbers: {
      default: true,
      impact: 'medium',
      description: 'Round numbers to 2 decimal places',
      reversible: false
    },
    deduplicateArrays: {
      default: true,
      impact: 'medium',
      description: 'Remove duplicate values from arrays',
      reversible: false
    },
    truncateStrings: {
      default: false,
      impact: 'high',
      description: 'Truncate long strings to 100 characters (aggressive)',
      reversible: false
    },
    maxStringLength: {
      default: 100,
      impact: 'high',
      description: 'Maximum string length when truncating',
      reversible: false
    }
  },

  CSV: {
    removeEmptyRows: {
      default: true,
      impact: 'low',
      description: 'Remove rows with all empty values',
      reversible: false
    },
    trimFields: {
      default: true,
      impact: 'low',
      description: 'Trim whitespace from fields',
      reversible: false
    },
    deduplicateRows: {
      default: true,
      impact: 'medium',
      description: 'Remove duplicate rows',
      reversible: false
    },
    roundNumbers: {
      default: true,
      impact: 'medium',
      description: 'Round numbers to specified precision',
      reversible: false
    },
    numberPrecision: {
      default: 2,
      impact: 'medium',
      description: 'Decimal places for rounding numbers',
      reversible: false
    },
    removeLowVarianceColumns: {
      default: true,
      impact: 'medium',
      description: 'Remove columns where all values are the same',
      reversible: false
    },
    truncateText: {
      default: true,
      impact: 'medium',
      description: 'Truncate long text fields',
      reversible: false
    },
    maxTextLength: {
      default: 50,
      impact: 'medium',
      description: 'Maximum length for text fields',
      reversible: false
    },
    deltaEncoding: {
      default: true,
      impact: 'medium',
      description: 'Apply delta encoding to numeric columns (stores differences)',
      reversible: true
    },
    dictionaryEncoding: {
      default: true,
      impact: 'medium',
      description: 'Apply dictionary encoding to string columns (replaces repeated values with codes)',
      reversible: true
    },
    keepFirstNColumns: {
      default: false,
      impact: 'high',
      description: 'Keep only first N columns (aggressive)',
      reversible: false
    },
    maxColumns: {
      default: 5,
      impact: 'high',
      description: 'Number of columns to keep',
      reversible: false
    },
    sampleRows: {
      default: false,
      impact: 'high',
      description: 'Sample rows (keep every nth row) (aggressive)',
      reversible: false
    },
    sampleRate: {
      default: 5,
      impact: 'high',
      description: 'Keep every nth row',
      reversible: false
    },
    removeOutliers: {
      default: false,
      impact: 'high',
      description: 'Remove statistical outliers (aggressive)',
      reversible: false
    },
    statisticalSampling: {
      default: false,
      impact: 'high',
      description: 'Keep 30% of rows systematically (aggressive)',
      reversible: false
    }
  },

  JavaScript: {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove comments (single-line and multi-line)',
      reversible: false
    },
    removeWhitespace: {
      default: true,
      impact: 'low',
      description: 'Remove unnecessary whitespace',
      reversible: false
    },
    removeConsole: {
      default: true,
      impact: 'medium',
      description: 'Remove console.log statements',
      reversible: false
    },
    removeDebugger: {
      default: true,
      impact: 'medium',
      description: 'Remove debugger statements',
      reversible: false
    },
    shortenBooleans: {
      default: true,
      impact: 'low',
      description: 'Shorten booleans (true → !0, false → !1)',
      reversible: true
    },
    shortenUndefined: {
      default: true,
      impact: 'low',
      description: 'Shorten undefined → void 0',
      reversible: true
    },
    shortenInfinity: {
      default: true,
      impact: 'low',
      description: 'Shorten Infinity → 1/0',
      reversible: true
    },
    optimizeNumbers: {
      default: true,
      impact: 'low',
      description: 'Optimize number literals (1.0 → 1, 0.5 → .5)',
      reversible: true
    }
  },

  HTML: {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove HTML comments',
      reversible: false
    },
    removeWhitespace: {
      default: true,
      impact: 'low',
      description: 'Remove unnecessary whitespace',
      reversible: false
    },
    removeAttributeQuotes: {
      default: true,
      impact: 'low',
      description: 'Remove quotes from attributes when safe',
      reversible: true
    },
    removeOptionalTags: {
      default: false,
      impact: 'medium',
      description: 'Remove optional closing tags (aggressive)',
      reversible: true
    },
    removeTypeAttributes: {
      default: true,
      impact: 'low',
      description: 'Remove type="text/javascript" and type="text/css"',
      reversible: true
    },
    removeEmptyAttributes: {
      default: true,
      impact: 'low',
      description: 'Remove empty attributes',
      reversible: false
    },
    shortenBooleanAttributes: {
      default: true,
      impact: 'low',
      description: 'Shorten boolean attributes (disabled="disabled" → disabled)',
      reversible: true
    },
    shortenDoctype: {
      default: true,
      impact: 'low',
      description: 'Shorten DOCTYPE to <!DOCTYPE html>',
      reversible: true
    }
  },

  CSS: {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove CSS comments',
      reversible: false
    },
    removeWhitespace: {
      default: true,
      impact: 'low',
      description: 'Remove unnecessary whitespace',
      reversible: false
    },
    shortenColors: {
      default: true,
      impact: 'low',
      description: 'Shorten color codes (#ffffff → #fff)',
      reversible: true
    },
    shortenZeros: {
      default: true,
      impact: 'low',
      description: 'Remove units from zero values (0px → 0)',
      reversible: true
    },
    removeUnusedRules: {
      default: false,
      impact: 'high',
      description: 'Remove potentially unused CSS rules (aggressive)',
      reversible: false
    },
    mergeDuplicateRules: {
      default: true,
      impact: 'medium',
      description: 'Merge duplicate selectors',
      reversible: true
    },
    removeVendorPrefixes: {
      default: false,
      impact: 'medium',
      description: 'Remove vendor prefixes (-webkit-, -moz-, etc.) (moderate/aggressive)',
      reversible: false
    }
  },

  SQL: {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove SQL comments (-- and /* */)',
      reversible: false
    },
    formatStatements: {
      default: true,
      impact: 'low',
      description: 'Compact SQL statements',
      reversible: false
    },
    lowercaseKeywords: {
      default: true,
      impact: 'low',
      description: 'Convert keywords to lowercase',
      reversible: true
    },
    removeExplain: {
      default: true,
      impact: 'low',
      description: 'Remove EXPLAIN statements',
      reversible: false
    },
    shortenAliases: {
      default: true,
      impact: 'medium',
      description: 'Shorten table/column aliases',
      reversible: true
    },
    removeOptionalKeywords: {
      default: true,
      impact: 'medium',
      description: 'Remove optional keywords (OUTER, PUBLIC, CASCADE)',
      reversible: true
    },
    combineInserts: {
      default: true,
      impact: 'medium',
      description: 'Combine multiple INSERT statements',
      reversible: true
    },
    removeSchemaChanges: {
      default: false,
      impact: 'high',
      description: 'Remove schema changes (CREATE, DROP, ALTER) (aggressive)',
      reversible: false
    },
    keepDataOnly: {
      default: false,
      impact: 'high',
      description: 'Keep only data statements (INSERT, UPDATE, SELECT, DELETE) (aggressive)',
      reversible: false
    },
    removeTransactions: {
      default: false,
      impact: 'high',
      description: 'Remove transaction statements (BEGIN, COMMIT, ROLLBACK) (aggressive)',
      reversible: false
    },
    removeConstraints: {
      default: false,
      impact: 'high',
      description: 'Remove constraints (PRIMARY KEY, FOREIGN KEY, etc.) (aggressive)',
      reversible: false
    },
    sampleInserts: {
      default: false,
      impact: 'high',
      description: 'Sample INSERT statement rows (aggressive)',
      reversible: false
    },
    insertSampleRate: {
      default: 5,
      impact: 'high',
      description: 'Keep every nth INSERT row',
      reversible: false
    }
  },

  SVG: {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove XML comments',
      reversible: false
    },
    removeMetadata: {
      default: true,
      impact: 'low',
      description: 'Remove metadata elements',
      reversible: false
    },
    removeHiddenElements: {
      default: true,
      impact: 'medium',
      description: 'Remove hidden elements (display:none, visibility:hidden)',
      reversible: false
    },
    shortenIds: {
      default: false,
      impact: 'medium',
      description: 'Shorten IDs and class names (aggressive)',
      reversible: false
    },
    optimizePaths: {
      default: true,
      impact: 'medium',
      description: 'Optimize SVG path data',
      reversible: false
    },
    roundNumbers: {
      default: true,
      impact: 'medium',
      description: 'Round coordinate values',
      reversible: false
    },
    numberPrecision: {
      default: 2,
      impact: 'medium',
      description: 'Decimal precision for coordinates',
      reversible: false
    },
    removeDefaultAttrs: {
      default: true,
      impact: 'low',
      description: 'Remove attributes with default values',
      reversible: true
    }
  },

  XML: {
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
    removeDeclaration: {
      default: true,
      impact: 'low',
      description: 'Remove XML declaration (<?xml...?>)',
      reversible: true
    },
    removeDoctype: {
      default: true,
      impact: 'low',
      description: 'Remove DOCTYPE declaration',
      reversible: false
    },
    removeCdata: {
      default: true,
      impact: 'medium',
      description: 'Remove CDATA sections',
      reversible: false
    },
    removeEmptyElements: {
      default: true,
      impact: 'medium',
      description: 'Remove empty XML elements',
      reversible: false
    },
    removeAttributeQuotes: {
      default: true,
      impact: 'low',
      description: 'Remove quotes from simple attribute values',
      reversible: true
    },
    roundNumericValues: {
      default: true,
      impact: 'medium',
      description: 'Round numeric values to 2 decimals',
      reversible: false
    },
    shortenTagNames: {
      default: false,
      impact: 'high',
      description: 'Shorten tag names (aggressive)',
      reversible: false
    }
  },

  YAML: {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove YAML comments',
      reversible: false
    },
    removeDocumentMarkers: {
      default: true,
      impact: 'low',
      description: 'Remove document markers (--- and ...)',
      reversible: true
    },
    inlineShortStrings: {
      default: true,
      impact: 'low',
      description: 'Inline short multi-line strings',
      reversible: true
    },
    removeUnnecessaryQuotes: {
      default: true,
      impact: 'low',
      description: 'Remove unnecessary quotes from strings',
      reversible: true
    },
    shortenNullValues: {
      default: true,
      impact: 'low',
      description: 'Shorten null values (null → ~)',
      reversible: true
    },
    convertToFlowStyle: {
      default: true,
      impact: 'medium',
      description: 'Convert arrays to flow style ([...])',
      reversible: true
    },
    shortenKeys: {
      default: false,
      impact: 'high',
      description: 'Shorten long key names (aggressive)',
      reversible: false
    }
  },

  Text: {
    removeEmptyLines: {
      default: true,
      impact: 'low',
      description: 'Remove empty lines',
      reversible: false
    },
    trimLines: {
      default: true,
      impact: 'low',
      description: 'Trim whitespace from lines',
      reversible: false
    },
    normalizeWhitespace: {
      default: true,
      impact: 'low',
      description: 'Normalize whitespace (multiple spaces → single space)',
      reversible: false
    },
    sampleLines: {
      default: false,
      impact: 'high',
      description: 'Keep every nth line (aggressive)',
      reversible: false
    },
    lineSampleRate: {
      default: 3,
      impact: 'high',
      description: 'Keep every nth line',
      reversible: false
    }
  },

  Markdown: {
    removeEmptyLines: {
      default: true,
      impact: 'low',
      description: 'Remove empty lines',
      reversible: false
    },
    simplifyLinks: {
      default: true,
      impact: 'medium',
      description: 'Simplify links and remove alt text',
      reversible: false
    },
    removeHtmlComments: {
      default: true,
      impact: 'low',
      description: 'Remove HTML comments',
      reversible: false
    },
    simplifyHeaders: {
      default: true,
      impact: 'low',
      description: 'Simplify headers (remove trailing #)',
      reversible: true
    },
    removeImages: {
      default: false,
      impact: 'high',
      description: 'Remove images (aggressive)',
      reversible: false
    }
  }
};

/**
 * Get compression options for a specific file type
 */
export function getOptionsForFileType(fileType) {
  return compressionOptions[fileType] || {};
}

/**
 * Get default options for a specific file type
 */
export function getDefaultOptions(fileType) {
  const options = getOptionsForFileType(fileType);
  const defaults = {};

  Object.entries(options).forEach(([key, config]) => {
    defaults[key] = config.default;
  });

  return defaults;
}

/**
 * Format option name for display (camelCase → Title Case)
 */
export function formatOptionName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
