/**
 * SQL compression engine with lossy optimizations
 */

/**
 * Compress SQL with specified loss level
 */
export async function compressSQL(content, lossLevel = 'moderate', customOptions = {}) {
  const operations = [];
  const originalSize = content.length;
  let compressed = content;

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalSQLCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateSQLCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveSQLCompression(compressed, operations, customOptions);
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
 * Minimal SQL compression
 */
function applyMinimalSQLCompression(sql, operations, customOptions) {
  let compressed = sql;

  // Remove SQL comments
  if (customOptions.removeComments !== false) {
    const before = compressed.length;

    // Remove single-line comments
    compressed = compressed.replace(/--.*$/gm, '');

    // Remove multi-line comments
    compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');

    if (compressed.length < before) {
      operations.push({
        type: 'remove_comments',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove extra whitespace
  const before = compressed.length;
  compressed = compressed
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/\s*([(),;])\s*/g, '$1')  // Remove spaces around delimiters
    .trim();

  if (compressed.length < before) {
    operations.push({
      type: 'remove_whitespace',
      count: before - compressed.length,
      reversible: false,
      impact: 'low'
    });
  }

  return compressed;
}

/**
 * Moderate SQL compression
 */
function applyModerateSQLCompression(sql, operations, customOptions) {
  // First apply minimal compression
  let compressed = applyMinimalSQLCompression(sql, operations, customOptions);

  // Uppercase SQL keywords for consistency, then lowercase them to save space
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
    'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
    'ON', 'AND', 'OR', 'NOT', 'NULL', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING',
    'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'
  ];

  // Convert to lowercase to save bytes
  const before = compressed.length;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    compressed = compressed.replace(regex, keyword.toLowerCase());
  });

  if (compressed.length < before) {
    operations.push({
      type: 'lowercase_keywords',
      count: keywords.length,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove EXPLAIN statements
  if (customOptions.removeExplain !== false) {
    const beforeExplain = compressed.length;
    compressed = compressed.replace(/\bEXPLAIN\s+/gi, '');

    if (compressed.length < beforeExplain) {
      operations.push({
        type: 'remove_explain',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Shorten table/column aliases (moved from aggressive to moderate)
  if (customOptions.shortenAliases !== false) {
    const aliasMap = new Map();
    let aliasCounter = 0;

    // Find AS aliases
    const aliasPattern = /\s+AS\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    let match;

    while ((match = aliasPattern.exec(compressed)) !== null) {
      const originalAlias = match[1];
      if (!aliasMap.has(originalAlias) && originalAlias.length > 2) {
        const shortAlias = getShortAlias(aliasCounter++);
        aliasMap.set(originalAlias, shortAlias);
      }
    }

    // Replace aliases
    aliasMap.forEach((shortAlias, longAlias) => {
      const regex = new RegExp(`\\b${longAlias}\\b`, 'g');
      compressed = compressed.replace(regex, shortAlias);
    });

    if (aliasMap.size > 0) {
      operations.push({
        type: 'shorten_aliases',
        count: aliasMap.size,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  // Remove optional keywords (OUTER, PUBLIC, etc.)
  if (customOptions.removeOptionalKeywords !== false) {
    const beforeOptional = compressed.length;

    // Remove OUTER from joins (LEFT OUTER JOIN → LEFT JOIN)
    compressed = compressed.replace(/\b(left|right|full)\s+outer\s+join\b/gi, '$1 join');

    // Remove PUBLIC schema qualifier
    compressed = compressed.replace(/\bpublic\./gi, '');

    // Remove CASCAD E from constraints (optional in many contexts)
    compressed = compressed.replace(/\s+cascade\b/gi, '');

    if (compressed.length < beforeOptional) {
      operations.push({
        type: 'remove_optional_keywords',
        count: 1,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  // Combine related INSERT statements
  if (customOptions.combineInserts !== false) {
    const beforeCombine = compressed.length;

    // Pattern: INSERT INTO table VALUES(...);INSERT INTO table VALUES(...);
    // Becomes: INSERT INTO table VALUES(...),(...);
    const insertPattern = /insert into\s+(\w+)\s*\([^)]*\)\s*values\s*\(([^)]+)\);insert into\s+\1\s*\([^)]*\)\s*values\s*\(/gi;

    let combined = 0;
    let previousLength;
    do {
      previousLength = compressed.length;
      compressed = compressed.replace(insertPattern, (match, table, firstValues) => {
        combined++;
        return `insert into ${table} values(${firstValues}),(`;
      });
    } while (compressed.length < previousLength);

    if (combined > 0) {
      operations.push({
        type: 'combine_insert_statements',
        count: combined,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  return compressed;
}

/**
 * Aggressive SQL compression
 */
function applyAggressiveSQLCompression(sql, operations, customOptions) {
  // First apply moderate compression
  let compressed = applyModerateSQLCompression(sql, operations, customOptions);

  // Remove CREATE and DROP statements (keep only data manipulation)
  if (customOptions.removeSchemaChanges !== false) {
    const beforeRemove = compressed.length;

    // Remove CREATE statements
    compressed = compressed.replace(/\bcreate\s+(table|database|index|view)\s+[^;]+;?/gi, '');

    // Remove DROP statements
    compressed = compressed.replace(/\bdrop\s+(table|database|index|view)\s+[^;]+;?/gi, '');

    // Remove ALTER statements
    compressed = compressed.replace(/\balter\s+table\s+[^;]+;?/gi, '');

    if (compressed.length < beforeRemove) {
      operations.push({
        type: 'remove_schema_changes',
        count: 1,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Keep only INSERT, UPDATE, SELECT statements
  if (customOptions.keepDataOnly) {
    const beforeFilter = compressed.length;
    const statements = compressed.split(';').filter(s => s.trim());

    const dataStatements = statements.filter(stmt => {
      const trimmed = stmt.trim().toLowerCase();
      return trimmed.startsWith('insert') ||
             trimmed.startsWith('update') ||
             trimmed.startsWith('select') ||
             trimmed.startsWith('delete');
    });

    if (dataStatements.length < statements.length) {
      compressed = dataStatements.join(';') + (dataStatements.length > 0 ? ';' : '');
      operations.push({
        type: 'keep_data_statements_only',
        kept: dataStatements.length,
        removed: statements.length - dataStatements.length,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Remove transaction statements (BEGIN, COMMIT, ROLLBACK)
  if (customOptions.removeTransactions !== false) {
    const beforeTrans = compressed.length;

    compressed = compressed.replace(/\b(begin|start\s+transaction|commit|rollback)\s*;?/gi, '');

    if (compressed.length < beforeTrans) {
      operations.push({
        type: 'remove_transactions',
        count: 1,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Remove constraints from table definitions
  if (customOptions.removeConstraints) {
    const beforeConstraints = compressed.length;

    // Remove PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK constraints
    compressed = compressed.replace(/,?\s*(primary key|foreign key|unique|check)\s*\([^)]*\)/gi, '');
    compressed = compressed.replace(/\s+(primary key|foreign key|unique|check|not null|default\s+[^,)]+)/gi, '');

    if (compressed.length < beforeConstraints) {
      operations.push({
        type: 'remove_constraints',
        count: 1,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Sample rows from INSERT statements
  if (customOptions.sampleInserts) {
    const beforeSample = compressed.length;
    const sampleRate = customOptions.insertSampleRate || 5; // Keep every 5th row

    // Find multi-value INSERT statements
    const insertPattern = /insert into\s+(\w+)[^)]*\)\s*values\s*(\([^;]+\));/gi;
    compressed = compressed.replace(insertPattern, (match, table, values) => {
      // Split values by ),( pattern
      const valueGroups = values.split(/\),\s*\(/);
      const sampled = valueGroups.filter((_, index) => index % sampleRate === 0);

      if (sampled.length < valueGroups.length) {
        return `insert into ${table} values ${sampled.join('),(')};`;
      }
      return match;
    });

    if (compressed.length < beforeSample) {
      operations.push({
        type: 'sample_insert_rows',
        sampleRate: sampleRate,
        reversible: false,
        impact: 'high'
      });
    }
  }

  return compressed;
}

/**
 * Generate short alias name
 */
function getShortAlias(index) {
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
 * Get custom options for SQL compression
 */
export function getSQLOptions() {
  return {
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
    removeExplain: {
      default: true,
      impact: 'low',
      description: 'Remove EXPLAIN statements',
      reversible: false
    },
    lowercaseKeywords: {
      default: true,
      impact: 'low',
      description: 'Convert keywords to lowercase',
      reversible: true
    },
    shortenAliases: {
      default: true,
      impact: 'medium',
      description: 'Shorten table and column aliases (moderate level)',
      reversible: false
    },
    removeOptionalKeywords: {
      default: true,
      impact: 'medium',
      description: 'Remove optional keywords (OUTER, PUBLIC, CASCADE)',
      reversible: false
    },
    combineInserts: {
      default: true,
      impact: 'medium',
      description: 'Combine multiple INSERT statements into single multi-value INSERT',
      reversible: false
    },
    removeSchemaChanges: {
      default: true,
      impact: 'high',
      description: 'Remove CREATE, DROP, ALTER statements (aggressive level)',
      reversible: false
    },
    keepDataOnly: {
      default: false,
      impact: 'high',
      description: 'Keep only INSERT, UPDATE, SELECT, DELETE statements (aggressive level)',
      reversible: false
    },
    removeTransactions: {
      default: true,
      impact: 'high',
      description: 'Remove BEGIN, COMMIT, ROLLBACK statements (aggressive level)',
      reversible: false
    },
    removeConstraints: {
      default: false,
      impact: 'high',
      description: 'Remove constraints (PRIMARY KEY, FOREIGN KEY, etc.) (aggressive level)',
      reversible: false
    },
    sampleInserts: {
      default: false,
      impact: 'high',
      description: 'Sample INSERT statement rows (keep every nth row) (aggressive level)',
      reversible: false
    },
    insertSampleRate: {
      default: 5,
      impact: 'high',
      description: 'Sample rate for INSERT rows (keep every nth row)',
      reversible: false
    }
  };
}
