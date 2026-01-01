export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000";

// Get API token - prefer Twitch token, fallback to dev token
export function getApiToken(): string {
  // Check for Twitch token in localStorage
  const twitchToken = localStorage.getItem("twitch_token");
  if (twitchToken) {
    return twitchToken;
  }
  
  // Fallback to development token
  return import.meta.env.VITE_API_TOKEN || "";
}

// For backward compatibility - this will be updated dynamically
// Components should use getApiToken() or useAuth().token instead
export let API_TOKEN = getApiToken();

// Update API_TOKEN when token changes (called from AuthContext)
export function updateApiToken() {
  API_TOKEN = getApiToken();
}

