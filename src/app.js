/**
 * L0ss Client - Main Application
 * 100% client-side lossy compression with preview and advanced options
 */

import { compressJSON } from './compression/json.js';
import { compressCSV } from './compression/csv.js';
import { compressJavaScript } from './compression/javascript.js';
import { compressHTML, compressCSS } from './compression/html-css.js';
import { compressSQL } from './compression/sql.js';
import { compressSVG } from './compression/svg.js';
import { compressXML, compressYAML } from './compression/xml-yaml.js';
import { compressText } from './compression/text.js';
import { detectFileType } from './utils/file-type-detector.js';
import { downloadFile, downloadZip } from './utils/file-handler.js';
import { getOptionsForFileType, formatOptionName } from './utils/compression-options.js';
import { analyzeFile } from './utils/preview.js';

// State
let selectedFiles = [];
let currentFileIndex = 0;
let currentFileContent = '';
let currentFileType = '';
let compressionLevel = 'moderate';
let customOptions = {};
let previewData = null;
let compressionResults = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const filesSection = document.getElementById('filesSection');
const filesList = document.getElementById('filesList');
const fileCount = document.getElementById('fileCount');
const previewSection = document.getElementById('previewSection');
const configPanel = document.getElementById('configPanel');
const configContent = document.getElementById('configContent');
const settingsSection = document.getElementById('settingsSection');
const selectedLevelInfo = document.getElementById('selectedLevelInfo');
const selectedLevelName = document.getElementById('selectedLevelName');
const compressBtn = document.getElementById('compressBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsList = document.getElementById('resultsList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const resetBtn = document.getElementById('resetBtn');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const installBtn = document.getElementById('installBtn');

// Compression engine mapping
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

// Event Listeners
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelection);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
compressBtn.addEventListener('click', compressFiles);
downloadAllBtn.addEventListener('click', downloadAllFiles);
resetBtn.addEventListener('click', reset);

// Comparison card click handlers
document.querySelectorAll('.comparison-card').forEach(card => {
  card.addEventListener('click', () => {
    if (card.classList.contains('ineffective')) {
      return;
    }
    const level = card.getAttribute('data-level');
    selectLevel(level);
  });
});

// PWA Install
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    deferredPrompt = null;
    installBtn.style.display = 'none';
  }
});

// File Selection Handlers
function handleFileSelection(e) {
  const files = Array.from(e.target.files);
  addFiles(files);
}

function handleDragOver(e) {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files);
  addFiles(files);
}

async function addFiles(files) {
  selectedFiles = [...selectedFiles, ...files];
  updateFilesList();
  showSection(filesSection);

  // Auto-analyze first file
  if (files.length > 0) {
    await analyzeFirstFile();
  }
}

function updateFilesList() {
  fileCount.textContent = selectedFiles.length;
  filesList.innerHTML = selectedFiles.map((file, index) => `
    <div class="file-item">
      <div class="file-info">
        <div class="file-icon">${getFileIcon(file.name)}</div>
        <div>
          <div class="file-name">${file.name}</div>
          <div class="file-meta">${formatBytes(file.size)} • ${detectFileType(file.name)}</div>
        </div>
      </div>
      <button class="btn-remove" onclick="removeFile(${index})">✕</button>
    </div>
  `).join('');
}

window.removeFile = function(index) {
  selectedFiles.splice(index, 1);
  updateFilesList();
  if (selectedFiles.length === 0) {
    hideSection(filesSection);
    hideSection(previewSection);
    hideSection(settingsSection);
  } else if (index === currentFileIndex) {
    // Re-analyze first file
    analyzeFirstFile();
  }
};

// File Analysis & Preview
async function analyzeFirstFile() {
  if (selectedFiles.length === 0) return;

  const file = selectedFiles[0];
  currentFileIndex = 0;
  currentFileType = detectFileType(file.name);

  showLoading('Analyzing file...');

  try {
    currentFileContent = await file.text();

    // Get available options for this file type
    const options = getOptionsForFileType(currentFileType);

    // Reset custom options
    customOptions = {};

    // Analyze file
    previewData = await analyzeFile(currentFileContent, currentFileType, customOptions);

    // Display preview
    displayPreview();

    // Render configuration UI if options available
    if (Object.keys(options).length > 0) {
      renderConfigUI(options);
    } else {
      configPanel.style.display = 'none';
    }

    showSection(previewSection);
    showSection(settingsSection);

  } catch (error) {
    console.error('Error analyzing file:', error);
    alert(`Error analyzing file: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Display Preview
function displayPreview() {
  if (!previewData) return;

  const { results, recommendation } = previewData;

  // Update preview cards
  document.getElementById('previewMinimal').textContent = results.minimal.sizeFormatted;
  document.getElementById('previewMinimalReduction').textContent =
    `${results.minimal.reduction.toFixed(1)}% reduction`;

  document.getElementById('previewModerate').textContent = results.moderate.sizeFormatted;
  document.getElementById('previewModerateReduction').textContent =
    `${results.moderate.reduction.toFixed(1)}% reduction`;

  document.getElementById('previewAggressive').textContent = results.aggressive.sizeFormatted;
  document.getElementById('previewAggressiveReduction').textContent =
    `${results.aggressive.reduction.toFixed(1)}% reduction`;

  // Handle ineffective levels (grey out)
  const cards = document.querySelectorAll('.comparison-card');
  const effectiveLevels = recommendation.effectiveLevels;

  cards.forEach((card, index) => {
    const level = ['minimal', 'moderate', 'aggressive'][index];
    const isEffective = effectiveLevels[level];

    card.classList.remove('recommended', 'ineffective', 'selected');

    // Remove badges
    const existingBadges = card.querySelectorAll('.recommended-badge, .no-improvement-badge');
    existingBadges.forEach(badge => badge.remove());

    if (!isEffective) {
      card.classList.add('ineffective');
      const badge = document.createElement('div');
      badge.className = 'no-improvement-badge';
      badge.textContent = 'No improvement';
      card.appendChild(badge);
    }
  });

  // Highlight recommended level
  const recommendedLevel = recommendation.level;
  const recommendedCard = document.querySelector(`.comparison-card[data-level="${recommendedLevel}"]`);
  if (recommendedCard && effectiveLevels[recommendedLevel]) {
    recommendedCard.classList.add('recommended');
    const badge = document.createElement('div');
    badge.className = 'recommended-badge';
    badge.textContent = 'Recommended';
    recommendedCard.appendChild(badge);
  }

  // Auto-select recommended level
  selectLevel(recommendedLevel);
}

// Select Compression Level
function selectLevel(level) {
  compressionLevel = level;

  // Update card selection
  document.querySelectorAll('.comparison-card').forEach(card => {
    card.classList.remove('selected');
    if (card.getAttribute('data-level') === level) {
      card.classList.add('selected');
    }
  });

  // Update selected level info
  const levelNames = { minimal: 'Minimal', moderate: 'Moderate', aggressive: 'Aggressive' };
  selectedLevelName.textContent = levelNames[level];
  selectedLevelInfo.style.display = 'block';

  // Show diff for this level
  showDiffForLevel(level);
}

// Helper function to format operation types
function formatOperationType(type, count) {
  const friendlyNames = {
    // JSON optimizations
    'remove_nulls': 'Remove null values',
    'remove_empty': 'Remove empty arrays and objects',
    'trim_strings': 'Trim whitespace from strings',
    'shorten_keys': 'Shorten object keys (frequency-based compression)',
    'round_numbers': 'Round numbers to fewer decimals',
    'deduplicate_arrays': 'Remove duplicate values from arrays',
    'truncate_strings': 'Truncate long strings',
    'flatten_nesting': 'Flatten deeply nested structures',
    'round_to_integers': 'Round numbers to integers',

    // CSV optimizations
    'remove_empty_rows': 'Remove empty rows',
    'trim_fields': 'Trim whitespace from fields',
    'deduplicate_rows': 'Remove duplicate rows',
    'remove_low_variance_columns': 'Remove columns with all same values',
    'truncate_long_text': 'Truncate long text fields',
    'delta_encoding': 'Delta encoding (store differences between consecutive values)',
    'dictionary_encoding': 'Dictionary encoding (replace repeated strings with integer codes)',
    'keep_first_n_columns': 'Keep only first N columns',
    'sample_rows': 'Sample rows (keep every nth row)',
    'remove_non_essential_columns': 'Remove non-essential columns',
    'remove_outliers': 'Remove statistical outliers',
    'statistical_sampling': 'Statistical sampling (keep 30%)',

    // JavaScript optimizations
    'remove_comments': 'Remove comments (single-line and multi-line)',
    'remove_whitespace': 'Remove whitespace and minify',
    'remove_console': 'Remove console.log statements',
    'remove_debugger': 'Remove debugger statements',
    'shorten_booleans': 'Shorten booleans (true → !0, false → !1)',
    'shorten_undefined': 'Shorten undefined → void 0',
    'shorten_infinity': 'Shorten Infinity → 1/0',
    'optimize_numbers': 'Optimize number literals (1.0 → 1, 0.5 → .5)',

    // HTML/CSS optimizations
    'remove_html_comments': 'Remove HTML comments',
    'remove_attribute_quotes': 'Remove quotes from attributes',
    'remove_optional_tags': 'Remove optional closing tags',
    'remove_type_attributes': 'Remove type attributes',
    'remove_empty_attributes': 'Remove empty attributes',
    'shorten_boolean_attributes': 'Shorten boolean attributes',
    'shorten_doctype': 'Shorten DOCTYPE',
    'shorten_colors': 'Shorten color codes (#ffffff → #fff)',
    'shorten_zeros': 'Remove units from zero values (0px → 0)',
    'merge_duplicate_rules': 'Merge duplicate selectors',
    'remove_vendor_prefixes': 'Remove vendor prefixes',

    // SQL optimizations
    'lowercase_keywords': 'Convert keywords to lowercase',
    'remove_explain': 'Remove EXPLAIN statements',
    'shorten_aliases': 'Shorten table/column aliases',
    'remove_optional_keywords': 'Remove optional keywords (OUTER, PUBLIC, CASCADE)',
    'combine_insert_statements': 'Combine multiple INSERT statements',
    'remove_schema_changes': 'Remove schema changes (CREATE, DROP, ALTER)',
    'keep_data_statements_only': 'Keep only data statements',
    'remove_transactions': 'Remove transaction statements',
    'remove_constraints': 'Remove constraints',
    'sample_insert_rows': 'Sample INSERT statement rows',

    // SVG/XML/YAML optimizations
    'remove_metadata': 'Remove metadata elements',
    'remove_hidden_elements': 'Remove hidden elements',
    'shorten_ids': 'Shorten IDs and class names',
    'optimize_paths': 'Optimize SVG path data',
    'remove_default_attrs': 'Remove attributes with default values',
    'remove_declaration': 'Remove XML declaration',
    'remove_doctype': 'Remove DOCTYPE declaration',
    'remove_cdata': 'Remove CDATA sections',
    'remove_empty_elements': 'Remove empty XML elements',
    'shorten_tag_names': 'Shorten tag names',
    'remove_document_markers': 'Remove document markers (--- and ...)',
    'inline_short_strings': 'Inline short multi-line strings',
    'remove_unnecessary_quotes': 'Remove unnecessary quotes',
    'shorten_null_values': 'Shorten null values (null → ~)',
    'convert_to_flow_style': 'Convert arrays to flow style'
  };

  const friendlyName = friendlyNames[type] || type.replace(/_/g, ' ');

  // Add count if meaningful
  if (count && count > 1 && !type.includes('minify') && !type.includes('whitespace')) {
    return `${friendlyName} (${count} instance${count === 1 ? '' : 's'})`;
  }

  return friendlyName;
}

// Show diff preview for selected level
function showDiffForLevel(level) {
  if (!previewData || !currentFileContent) return;

  const levelNames = { minimal: 'Minimal', moderate: 'Moderate', aggressive: 'Aggressive' };
  document.getElementById('diffLevelName').textContent = levelNames[level];

  const diffContent = document.getElementById('diffContent');
  diffContent.innerHTML = '';

  // Get compressed content for this level
  const original = currentFileContent;
  const compressed = previewData.results[level].compressed;
  const operations = previewData.results[level].operations || [];

  // Optimizations section
  const optimizationsSection = document.createElement('div');
  optimizationsSection.style.cssText = 'margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border);';

  const optimizationsLabel = document.createElement('div');
  optimizationsLabel.className = 'diff-label';
  optimizationsLabel.textContent = 'Optimizations Applied:';
  optimizationsLabel.style.marginBottom = '0.5rem';
  optimizationsSection.appendChild(optimizationsLabel);

  const optimizationsList = document.createElement('ul');
  optimizationsList.style.cssText = 'margin: 0; padding-left: 1.5rem; font-size: 0.9rem; color: var(--text-secondary);';

  if (operations.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Whitespace removal and minification';
    optimizationsList.appendChild(li);
  } else {
    operations.forEach(op => {
      const li = document.createElement('li');
      li.style.marginBottom = '0.25rem';
      li.textContent = formatOperationType(op.type, op.count);
      optimizationsList.appendChild(li);
    });
  }

  optimizationsSection.appendChild(optimizationsList);
  diffContent.appendChild(optimizationsSection);

  // Create before section
  const beforeSection = document.createElement('div');
  beforeSection.className = 'diff-section';

  const beforeLabel = document.createElement('div');
  beforeLabel.className = 'diff-label';
  beforeLabel.textContent = 'Before:';
  beforeSection.appendChild(beforeLabel);

  const beforeContent = document.createElement('pre');
  beforeContent.className = 'diff-before';

  // Show first 500 characters or 10 lines
  const originalLines = original.split('\n');
  const compressedLines = compressed.split('\n');
  const isMinified = compressedLines.length === 1 && originalLines.length > 1;

  if (isMinified) {
    beforeContent.textContent = originalLines.slice(0, 10).join('\n');
    if (originalLines.length > 10) {
      beforeContent.textContent += '\n... (' + (originalLines.length - 10) + ' more lines)';
    }
  } else {
    beforeContent.textContent = original.substring(0, 500);
    if (original.length > 500) {
      beforeContent.textContent += '\n... (' + (original.length - 500) + ' more characters)';
    }
  }
  beforeSection.appendChild(beforeContent);

  // Create after section
  const afterSection = document.createElement('div');
  afterSection.className = 'diff-section';

  const afterLabel = document.createElement('div');
  afterLabel.className = 'diff-label';
  afterLabel.textContent = 'After:';
  afterSection.appendChild(afterLabel);

  const afterContent = document.createElement('pre');
  afterContent.className = 'diff-after';

  if (isMinified) {
    afterContent.textContent = compressed.substring(0, 500);
    if (compressed.length > 500) {
      afterContent.textContent += '\n... (' + (compressed.length - 500) + ' more characters)';
    }
  } else {
    afterContent.textContent = compressedLines.slice(0, 10).join('\n');
    if (compressedLines.length > 10) {
      afterContent.textContent += '\n... (' + (compressedLines.length - 10) + ' more lines)';
    }
  }
  afterSection.appendChild(afterContent);

  diffContent.appendChild(beforeSection);
  diffContent.appendChild(afterSection);

  document.getElementById('diffPreview').style.display = 'block';
}

// Configuration UI
let isConfigVisible = true;

// Config toggle handler
document.getElementById('configToggle')?.addEventListener('click', () => {
  isConfigVisible = !isConfigVisible;
  const configContent = document.getElementById('configContent');
  const configHint = document.querySelector('.config-hint');
  const toggleBtn = document.getElementById('configToggle');

  if (isConfigVisible) {
    configContent.style.display = 'grid';
    if (configHint) configHint.style.display = 'block';
    toggleBtn.textContent = 'Hide Options';
  } else {
    configContent.style.display = 'none';
    if (configHint) configHint.style.display = 'none';
    toggleBtn.textContent = 'Show Options';
  }
});

function renderConfigUI(options) {
  configContent.innerHTML = '';

  if (!options || Object.keys(options).length === 0) {
    configPanel.style.display = 'none';
    return;
  }

  const optionEntries = Object.entries(options);

  optionEntries.forEach(([key, option]) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'config-option';

    // Header with name and impact badge
    const header = document.createElement('div');
    header.className = 'config-option-header';

    const name = document.createElement('div');
    name.className = 'config-option-name';
    name.textContent = formatOptionName(key);

    const impact = document.createElement('div');
    impact.className = `config-option-impact ${option.impact}`;
    impact.textContent = option.impact;

    header.appendChild(name);
    header.appendChild(impact);
    optionDiv.appendChild(header);

    // Description
    const desc = document.createElement('div');
    desc.className = 'config-option-desc';
    desc.textContent = option.description;
    optionDiv.appendChild(desc);

    // Control
    const control = document.createElement('div');
    control.className = 'config-option-control';

    // Determine input type based on default value
    if (typeof option.default === 'boolean') {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = option.default;
      checkbox.id = `opt-${key}`;
      checkbox.addEventListener('change', () => {
        customOptions[key] = checkbox.checked;
        refreshPreview();
      });

      const label = document.createElement('label');
      label.htmlFor = `opt-${key}`;
      label.textContent = 'Enable';

      control.appendChild(checkbox);
      control.appendChild(label);
    } else if (typeof option.default === 'number') {
      const label = document.createElement('label');
      label.textContent = 'Value:';
      label.style.marginRight = '0.5rem';

      const input = document.createElement('input');
      input.type = 'number';
      input.value = option.default;
      input.id = `opt-${key}`;
      input.addEventListener('input', () => {
        customOptions[key] = parseFloat(input.value) || option.default;
        refreshPreview();
      });

      control.appendChild(label);
      control.appendChild(input);
    } else if (Array.isArray(option.default)) {
      const label = document.createElement('label');
      label.textContent = 'Value (comma-separated):';
      label.style.marginRight = '0.5rem';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = option.default.join(', ');
      input.id = `opt-${key}`;
      input.addEventListener('input', () => {
        customOptions[key] = input.value.split(',').map(v => v.trim());
        refreshPreview();
      });

      control.appendChild(label);
      control.appendChild(input);
    }

    optionDiv.appendChild(control);
    configContent.appendChild(optionDiv);

    // Initialize customOptions with default
    if (customOptions[key] === undefined) {
      customOptions[key] = option.default;
    }
  });

  configPanel.style.display = 'block';
}

// Refresh preview with custom options
async function refreshPreview() {
  if (!currentFileContent || !currentFileType) return;

  showLoading('Updating preview...');

  try {
    previewData = await analyzeFile(currentFileContent, currentFileType, customOptions);
    displayPreview();
  } catch (error) {
    console.error('Error refreshing preview:', error);
  } finally {
    hideLoading();
  }
}

// Compression
async function compressFiles() {
  showLoading('Compressing files...');
  compressionResults = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    loadingText.textContent = `Compressing ${i + 1}/${selectedFiles.length}: ${file.name}`;

    try {
      const content = await file.text();
      const fileType = detectFileType(file.name);
      const compressFunc = compressionEngines[fileType];

      if (!compressFunc) {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      const result = await compressFunc(content, compressionLevel, customOptions);

      compressionResults.push({
        originalName: file.name,
        originalSize: file.size,
        compressedContent: result.compressed,
        compressedSize: new Blob([result.compressed]).size,
        manifest: {
          version: '1.0.0',
          original_file: file.name,
          compression_level: compressionLevel,
          timestamp: new Date().toISOString(),
          original_size: file.size,
          compressed_size: new Blob([result.compressed]).size,
          reduction_percent: ((file.size - new Blob([result.compressed]).size) / file.size * 100).toFixed(2),
          operations: result.operations || [],
          custom_options: customOptions,
          reversibility: 'partial',
          data_loss: compressionLevel === 'aggressive' ? 'high' : compressionLevel === 'moderate' ? 'medium' : 'low'
        },
        fileType
      });
    } catch (error) {
      console.error(`Error compressing ${file.name}:`, error);
      compressionResults.push({
        originalName: file.name,
        originalSize: file.size,
        error: error.message
      });
    }
  }

  hideLoading();
  showResults();
}

function showResults() {
  hideSection(previewSection);
  hideSection(settingsSection);
  showSection(resultsSection);

  resultsList.innerHTML = compressionResults.map((result, index) => {
    if (result.error) {
      return `
        <div class="result-item error">
          <div class="result-header">
            <div class="file-name">❌ ${result.originalName}</div>
          </div>
          <div class="result-error">Error: ${result.error}</div>
        </div>
      `;
    }

    const reduction = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
    const reductionClass = reduction > 50 ? 'excellent' : reduction > 30 ? 'good' : 'moderate';

    return `
      <div class="result-item">
        <div class="result-header">
          <div class="file-name">${result.originalName}</div>
          <div class="result-stats">
            <span class="stat">${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)}</span>
            <span class="reduction ${reductionClass}">${reduction}% smaller</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn btn-sm" onclick="downloadResult(${index})">📥 Download</button>
          <button class="btn btn-sm btn-secondary" onclick="downloadManifest(${index})">📄 Manifest</button>
        </div>
      </div>
    `;
  }).join('');
}

window.downloadResult = function(index) {
  const result = compressionResults[index];
  const newName = result.originalName.replace(/(\.[^.]+)$/, '.min$1');
  downloadFile(result.compressedContent, newName);
};

window.downloadManifest = function(index) {
  const result = compressionResults[index];
  const manifestName = result.originalName + '.manifest.json';
  downloadFile(JSON.stringify(result.manifest, null, 2), manifestName);
};

async function downloadAllFiles() {
  if (compressionResults.length === 1) {
    downloadResult(0);
  } else {
    const files = compressionResults
      .filter(r => !r.error)
      .map(r => ({
        name: r.originalName.replace(/(\.[^.]+)$/, '.min$1'),
        content: r.compressedContent
      }));

    await downloadZip(files, 'compressed-files.zip');
  }
}

function reset() {
  selectedFiles = [];
  compressionResults = [];
  currentFileContent = '';
  currentFileType = '';
  previewData = null;
  customOptions = {};
  fileInput.value = '';
  hideSection(filesSection);
  hideSection(previewSection);
  hideSection(settingsSection);
  hideSection(resultsSection);
  updateFilesList();
}

// Utility Functions
function showSection(element) {
  element.style.display = 'block';
}

function hideSection(element) {
  element.style.display = 'none';
}

function showLoading(text) {
  loadingText.textContent = text;
  loading.style.display = 'flex';
}

function hideLoading() {
  loading.style.display = 'none';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    json: '📊',
    csv: '📈',
    js: '📜',
    html: '🌐',
    css: '🎨',
    sql: '🗄️',
    xml: '📋',
    yaml: '⚙️',
    yml: '⚙️',
    svg: '🖼️',
    md: '📝',
    txt: '📄'
  };
  return icons[ext] || '📁';
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered:', reg))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
