/**
 * Dynamically resolves API URLs based on the running environment.
 * 
 * - In development mode (Vite DEV), it resolves to the backend host (default: http://localhost:8000).
 * - In production, it resolves to the same origin (window.location.origin) for relative Cloud Run routing.
 */
export function getApiUrl(path: string): string {
  // Strip leading slash to avoid double slashes when joining
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (import.meta.env.DEV) {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const base = backendUrl.endsWith('/') ? backendUrl : `${backendUrl}/`;
    return `${base}${cleanPath}`;
  } else {
    const base = window.location.origin.endsWith('/') ? window.location.origin : `${window.location.origin}/`;
    return `${base}${cleanPath}`;
  }
}
