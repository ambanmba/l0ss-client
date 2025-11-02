/**
 * File Download and Handling Utilities
 */

/**
 * Download a single file
 */
export function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple files as a ZIP archive
 * Uses JSZip library if available, otherwise downloads individually
 */
export async function downloadZip(files, zipName) {
  // For now, download files individually
  // In the future, we can add JSZip as an optional dependency
  for (const file of files) {
    downloadFile(file.content, file.name);
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Optional: Show a message that files are downloading individually
  console.log(`Downloaded ${files.length} files individually`);
}

/**
 * Read file content
 */
export async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * Read file as ArrayBuffer
 */
export async function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}
