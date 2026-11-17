/**
 * Central API configuration for ThePotLite
 * Defaults to the live Render deployment: https://pot-fintech-backend.onrender.com
 * Can be overridden in development via VITE_API_BASE_URL in .env
 */
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || "https://pot-fintech-backend.onrender.com";

/**
 * Returns the fully qualified URL for an API endpoint
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE_URL) return cleanPath;
  return `${API_BASE_URL.replace(/\/$/, "")}${cleanPath}`;
}
