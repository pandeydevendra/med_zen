// Prefer the build-time VITE_API_URL. Without it, a production build calls the API on
// the same origin ("/api", where FastAPI serves the frontend); dev falls back to the local backend.
export const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

// TODO: remove debug log
console.log('[debug] API_URL:', API_URL, '| mode:', import.meta.env.MODE);
