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
}

// Configuration UI
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
