/**
 * Compression preview/analysis utility
 * Runs compression at all levels and returns preview data
 */

import { compressJSON } from '../compression/json.js';
import { compressCSV } from '../compression/csv.js';
import { compressJavaScript } from '../compression/javascript.js';
import { compressHTML, compressCSS } from '../compression/html-css.js';
import { compressSQL } from '../compression/sql.js';
import { compressSVG } from '../compression/svg.js';
import { compressXML, compressYAML } from '../compression/xml-yaml.js';
import { compressText } from '../compression/text.js';

const compressionEngines = {
  JSON: compressJSON,
  CSV: compressCSV,
  JavaScript: compressJavaScript,
  HTML: compressHTML,
  CSS: compressCSS,
  SQL: compressSQL,
  SVG: compressSVG,
  XML: compressXML,
  YAML: compressYAML,
  Text: compressText,
  Markdown: compressText
};

/**
 * Analyze a file and return compression preview for all levels
 * @param {string} content - File content
 * @param {string} fileType - File type (JSON, CSV, etc.)
 * @param {object} customOptions - Custom compression options
 * @returns {Promise<object>} Preview data with results for minimal/moderate/aggressive
 */
export async function analyzeFile(content, fileType, customOptions = {}) {
  const compressFunc = compressionEngines[fileType];

  if (!compressFunc) {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  const originalSize = new Blob([content]).size;

  // Run compression at all three levels
  const results = {};

  for (const level of ['minimal', 'moderate', 'aggressive']) {
    try {
      const result = await compressFunc(content, level, customOptions);

      results[level] = {
        size: result.compressedSize,
        sizeFormatted: formatBytes(result.compressedSize),
        reduction: ((originalSize - result.compressedSize) / originalSize * 100),
        operations: result.operations || [],
        compressed: result.compressed
      };
    } catch (error) {
      results[level] = {
        size: originalSize,
        sizeFormatted: formatBytes(originalSize),
        reduction: 0,
        operations: [],
        error: error.message
      };
    }
  }

  // Determine which levels are effective (>5% reduction)
  const effectiveLevels = {
    minimal: results.minimal.reduction > 5,
    moderate: results.moderate.reduction > 5,
    aggressive: results.aggressive.reduction > 5
  };

  // Recommend level based on reduction
  let recommendedLevel = 'moderate';
  if (results.aggressive.reduction > 50 && effectiveLevels.aggressive) {
    recommendedLevel = 'aggressive';
  } else if (results.moderate.reduction > 30 && effectiveLevels.moderate) {
    recommendedLevel = 'moderate';
  } else if (effectiveLevels.minimal) {
    recommendedLevel = 'minimal';
  }

  return {
    originalSize,
    originalSizeFormatted: formatBytes(originalSize),
    results,
    recommendation: {
      level: recommendedLevel,
      effectiveLevels,
      reason: getRecommendationReason(results, recommendedLevel)
    }
  };
}

/**
 * Get recommendation reason based on results
 */
function getRecommendationReason(results, level) {
  const reduction = results[level]?.reduction || 0;

  if (reduction > 70) {
    return `${level} level achieves excellent ${reduction.toFixed(1)}% reduction`;
  } else if (reduction > 50) {
    return `${level} level provides strong ${reduction.toFixed(1)}% compression`;
  } else if (reduction > 30) {
    return `${level} level offers balanced ${reduction.toFixed(1)}% reduction`;
  } else if (reduction > 10) {
    return `${level} level gives modest ${reduction.toFixed(1)}% savings`;
  } else {
    return `Limited compression opportunity for this file`;
  }
}

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
