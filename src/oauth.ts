/**
 * Pseudo-OAuth for EUrouter — treats an API key as an OAuth credential
 * so it slots into pi's /login subscription flow.
 *
 * EUrouter uses bearer tokens (eur_...), not real OAuth. We piggyback on
 * pi's OAuth login UI so users can store the key via /login → "Use a
 * subscription" → "EUrouter".
 */

import type { OAuthCredentials, OAuthLoginCallbacks } from "@earendil-works/pi-ai";
import { PSEUDO_OAUTH_EXPIRY_MS, PROVIDER_DISPLAY_NAME } from "./constants.js";

export function createPseudoOAuthCredentials(apiKey: string): OAuthCredentials {
	return {
		access: apiKey,
		refresh: apiKey,
		expires: Date.now() + PSEUDO_OAUTH_EXPIRY_MS,
	};
}

export function getPseudoOAuthApiKey(credentials: OAuthCredentials): string {
	if (typeof credentials.access !== "string" || credentials.access.trim().length === 0) {
		throw new Error("Stored EUrouter credentials are missing the API key. Please /login again.");
	}
	return credentials.access.trim();
}

export const eurouterOAuthProvider = {
	name: PROVIDER_DISPLAY_NAME,

	async login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
		const apiKey = (
			await callbacks.onPrompt({ message: `Paste your ${PROVIDER_DISPLAY_NAME} API key:` })
		).trim();
		if (!apiKey) {
			throw new Error("API key cannot be empty.");
		}
		return createPseudoOAuthCredentials(apiKey);
	},

	async refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
		return createPseudoOAuthCredentials(getPseudoOAuthApiKey(credentials));
	},

	getApiKey(credentials: OAuthCredentials): string {
		return getPseudoOAuthApiKey(credentials);
	},
};
