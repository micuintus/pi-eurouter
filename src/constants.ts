/**
 * EUrouter API constants
 */

export const PROVIDER_NAME = "eurouter";
export const PROVIDER_DISPLAY_NAME = "EUrouter";

export const BASE_URL = "https://api.eurouter.ai/api/v1";
export const MODELS_ENDPOINT = `${BASE_URL}/models`;

export const API_KEY_ENV_VAR = "EUROUTER_API_KEY";

/** Conservative fallback for unknown models. */
export const DEFAULT_CONTEXT_WINDOW = 131072;
export const DEFAULT_MAX_TOKENS = 16384;

/** Token expiry for pseudo-OAuth credentials (practically infinite). */
export const PSEUDO_OAUTH_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;
