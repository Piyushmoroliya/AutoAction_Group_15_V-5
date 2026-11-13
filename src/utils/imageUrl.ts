/**
 * Helper to get the full static URL for an uploaded capture image.
 */
export function getCaptureImageUrl(pathOrFilename?: string | null): string | null {
  if (!pathOrFilename) return null;
  if (pathOrFilename.startsWith('http://') || pathOrFilename.startsWith('https://') || pathOrFilename.startsWith('blob:')) {
    return pathOrFilename;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const host = baseUrl.replace(/\/api\/?$/, '');

  if (pathOrFilename.startsWith('/uploads/')) {
    return `${host}${pathOrFilename}`;
  }
  return `${host}/uploads/${pathOrFilename}`;
}
