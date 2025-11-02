/**
 * Text/Markdown compression engine with lossy optimizations
 */

/**
 * Compress text/markdown with specified loss level
 */
export async function compressText(content, lossLevel = 'moderate', customOptions = {}) {
  const operations = [];
  const originalSize = content.length;
  let compressed = content;

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalTextCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateTextCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveTextCompression(compressed, operations, customOptions);
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
 * Minimal text compression
 */
function applyMinimalTextCompression(text, operations, customOptions) {
  let compressed = text;

  // Remove extra blank lines (3+ -> 2)
  if (customOptions.removeExtraWhitespace !== false) {
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
  }

  // Remove trailing whitespace
  const before = compressed.length;
  compressed = compressed.replace(/[ \t]+$/gm, '');

  if (compressed.length < before) {
    operations.push({
      type: 'remove_trailing_whitespace',
      count: 1,
      reversible: false,
      impact: 'low'
    });
  }

  // Normalize line endings
  compressed = compressed.replace(/\r\n/g, '\n');

  return compressed;
}

/**
 * Moderate text/Markdown compression
 * Includes Markdown-specific optimizations
 */
function applyModerateTextCompression(text, operations, customOptions) {
  // First apply minimal compression
  let compressed = applyMinimalTextCompression(text, operations, customOptions);

  // Markdown-specific: Simplify reference-style links to inline links
  if (customOptions.simplifyLinks !== false) {
    const beforeLinks = compressed.length;

    // Find all link references at the bottom
    const linkRefs = new Map();
    compressed = compressed.replace(/^\[([^\]]+)\]:\s*(.+)$/gm, (match, id, url) => {
      linkRefs.set(id.toLowerCase(), url);
      return ''; // Remove the reference
    });

    // Replace reference-style links with inline links
    compressed = compressed.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (match, text, id) => {
      const refId = (id || text).toLowerCase();
      if (linkRefs.has(refId)) {
        return `[${text}](${linkRefs.get(refId)})`;
      }
      return match;
    });

    if (compressed.length < beforeLinks) {
      operations.push({
        type: 'markdown_simplify_links',
        count: linkRefs.size,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Markdown-specific: Remove HTML comments
  const beforeComments = compressed.length;
  compressed = compressed.replace(/<!--[\s\S]*?-->/g, '');

  if (compressed.length < beforeComments) {
    operations.push({
      type: 'markdown_remove_html_comments',
      count: 1,
      reversible: false,
      impact: 'low'
    });
  }

  // Markdown-specific: Simplify headers (remove extra #'s from atx-style headers)
  if (customOptions.simplifyHeaders !== false) {
    const beforeHeaders = compressed.length;
    compressed = compressed.replace(/^(#{1,6})\s+(.+?)\s+#*$/gm, '$1 $2');

    if (compressed.length < beforeHeaders) {
      operations.push({
        type: 'markdown_simplify_headers',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Markdown-specific: Remove emphasis markers from code blocks
  // (they don't render anyway)
  if (customOptions.cleanCodeBlocks !== false) {
    const beforeCode = compressed.length;
    compressed = compressed.replace(/```([^\n]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      // Remove bold/italic markers inside code blocks
      const cleaned = code.replace(/[*_]{1,2}/g, '');
      return '```' + lang + '\n' + cleaned + '```';
    });

    if (compressed.length < beforeCode) {
      operations.push({
        type: 'markdown_clean_code_blocks',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Markdown-specific: Shorten image alt text
  if (customOptions.shortenAltText) {
    const beforeAlt = compressed.length;
    compressed = compressed.replace(/!\[([^\]]{50,})\]/g, (match, alt) => {
      return `![${alt.substring(0, 30)}...]`;
    });

    if (compressed.length < beforeAlt) {
      operations.push({
        type: 'markdown_shorten_alt_text',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove duplicate sentences
  if (customOptions.deduplicateSentences) {
    const sentences = compressed.split(/[.!?]+/).filter(s => s.trim());
    const uniqueSentences = new Set(sentences.map(s => s.trim()));

    if (uniqueSentences.size < sentences.length) {
      const deduped = Array.from(uniqueSentences).join('. ') + '.';
      operations.push({
        type: 'deduplicate_sentences',
        count: sentences.length - uniqueSentences.size,
        reversible: false,
        impact: 'medium'
      });
      compressed = deduped;
    }
  }

  // Simplify multiple spaces
  const before = compressed.length;
  compressed = compressed.replace(/  +/g, ' ');

  if (compressed.length < before) {
    operations.push({
      type: 'normalize_spaces',
      count: 1,
      reversible: false,
      impact: 'low'
    });
  }

  return compressed;
}

/**
 * Aggressive text compression
 */
function applyAggressiveTextCompression(text, operations, customOptions) {
  // First apply moderate compression
  let compressed = applyModerateTextCompression(text, operations, customOptions);

  // Truncate to maximum length
  if (customOptions.truncate && customOptions.maxLength) {
    const maxLength = customOptions.maxLength;

    if (compressed.length > maxLength) {
      compressed = compressed.substring(0, maxLength) + '...';
      operations.push({
        type: 'truncate_text',
        maxLength: maxLength,
        count: 1,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // AI summarization removed - was placeholder only, not implemented

  // Remove common filler words
  if (customOptions.removeFillers) {
    const fillers = ['basically', 'actually', 'literally', 'just', 'really', 'very', 'quite'];
    const before = compressed.length;

    fillers.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      compressed = compressed.replace(regex, '');
    });

    // Clean up extra spaces from removal
    compressed = compressed.replace(/  +/g, ' ').trim();

    if (compressed.length < before) {
      operations.push({
        type: 'remove_filler_words',
        count: fillers.length,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  return compressed;
}

/**
 * Get custom options for text compression
 */
export function getTextOptions() {
  return {
    removeExtraWhitespace: {
      default: true,
      impact: 'low',
      description: 'Remove extra blank lines and trailing whitespace',
      reversible: false
    },
    deduplicateSentences: {
      default: false,
      impact: 'medium',
      description: 'Remove duplicate sentences',
      reversible: false
    },
    truncate: {
      default: false,
      impact: 'high',
      description: 'Truncate to maximum length (specify maxLength)',
      reversible: false
    },
    removeFillers: {
      default: false,
      impact: 'medium',
      description: 'Remove common filler words',
      reversible: false
    }
  };
}
