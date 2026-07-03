/**
 * Shared file type utilities.
 * Single source of truth for file classification, extension extraction,
 * and URL cleanup across all components.
 */

/**
 * Extract the file extension from a URL or filename.
 * Strips query strings and hash fragments first.
 */
export function getFileExtension(url = '') {
  if (!url) return '';
  // Remove query string and hash
  const clean = url.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot === -1) return '';
  return clean.substring(lastDot + 1).toLowerCase();
}

/**
 * Classify a file URL/filename into a type category.
 * Returns: 'image' | 'video' | 'audio' | 'pdf' | 'document'
 */
export function getFileType(url = '') {
  const ext = getFileExtension(url);
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return 'image';

    case 'mp4':
    case 'webm':
    case 'ogg':  // ogg can be video or audio; grouped under video here
    case 'avi':
    case 'mov':
    case 'wmv':
      return 'video';

    case 'mp3':
    case 'wav':
    case 'aac':
      return 'audio';

    case 'pdf':
      return 'pdf';

    default:
      return 'document';
  }
}

/**
 * Strip cache-busting query parameters (e.g. ?t=1234567890) from a URL.
 */
export function removeCacheBuster(url = '') {
  if (!url) return '';
  return url.split('?')[0];
}

/**
 * Extract just the filename from a URL path.
 * e.g. "https://res.cloudinary.com/.../dailyjournal/abc123.pdf?t=123" → "abc123.pdf"
 */
export function extractFilename(url = '') {
  if (!url) return 'download';
  const clean = removeCacheBuster(url);
  return clean.split('/').pop() || 'download';
}
