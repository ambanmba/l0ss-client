/**
 * L0ss Client - Main Application
 * 100% client-side lossy compression
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

// State
let selectedFiles = [];
let compressionLevel = 'moderate';
let compressionResults = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const filesSection = document.getElementById('filesSection');
const filesList = document.getElementById('filesList');
const fileCount = document.getElementById('fileCount');
const settingsSection = document.getElementById('settingsSection');
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

// Level selection buttons
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    compressionLevel = e.currentTarget.dataset.level;
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

function addFiles(files) {
  selectedFiles = [...selectedFiles, ...files];
  updateFilesList();
  showSection(filesSection);
  showSection(settingsSection);
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
    hideSection(settingsSection);
  }
};

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

      const result = await compressFunc(content, compressionLevel);

      compressionResults.push({
        originalName: file.name,
        originalSize: file.size,
        compressedContent: result.compressed,
        compressedSize: new Blob([result.compressed]).size,
        manifest: result.manifest,
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
  fileInput.value = '';
  hideSection(filesSection);
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
