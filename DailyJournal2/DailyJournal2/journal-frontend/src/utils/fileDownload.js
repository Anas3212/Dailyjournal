import { extractFilename } from './fileUtils';

/**
 * Shared file download utility.
 * Handles both Cloudinary URLs and local backend URLs.
 * Single source of truth — used by all components.
 *
 * @param {string} fileUrl  — The full URL to download
 * @param {string} [fileName] — Optional override for the download filename
 */
export async function downloadFile(fileUrl, fileName) {
  if (!fileUrl) return;

  // Strip cache-busting query params
  const cleanUrl = fileUrl.split('?')[0];
  const resolvedName = fileName || extractFilename(cleanUrl);

  try {
    // ── Cloudinary URLs ──
    if (cleanUrl.includes('res.cloudinary.com')) {
      let downloadUrl = cleanUrl;

      // Insert fl_attachment transformation to force browser download.
      // Works for both /image/upload/ and /raw/upload/ resource types.
      if (cleanUrl.includes('/image/upload/') && !cleanUrl.includes('/fl_attachment/')) {
        downloadUrl = cleanUrl.replace('/image/upload/', '/image/upload/fl_attachment/');
      } else if (cleanUrl.includes('/raw/upload/') && !cleanUrl.includes('/fl_attachment/')) {
        downloadUrl = cleanUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/');
      } else if (cleanUrl.includes('/video/upload/') && !cleanUrl.includes('/fl_attachment/')) {
        downloadUrl = cleanUrl.replace('/video/upload/', '/video/upload/fl_attachment/');
      }

      // Fetch as blob — this avoids cross-origin link.download being ignored
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Cloudinary download failed: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = resolvedName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      return;
    }

    // ── Local backend URLs ──
    const response = await fetch(cleanUrl, {
      credentials: 'include' // send auth cookies for protected endpoints
    });

    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = resolvedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('File download error:', error);
    throw error; // Let callers show their own snackbar/alert
  }
}
