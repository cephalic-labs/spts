/**
 * Get the base URL for the application
 * @returns {string} The base URL
 */
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

/**
 * Build an absolute URL
 * @param {string} path - The path to append to the base URL
 * @returns {string} The absolute URL
 */
export const buildAbsoluteUrl = (path) => {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
