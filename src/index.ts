/**
 * pi-eurouter DEBUG — tests if the extension loads at all
 */

export default async function (pi) {
	// Test 1: does console output appear anywhere?
	console.log("[eurouter] EXTENSION LOADED — this is a test");

	// Test 2: register one hardcoded model, no network
	try {
		pi.registerProvider("eurouter", {
			name: "EUrouter",
			baseUrl: "https://api.eurouter.ai/api/v1",
			api: "openai-completions",
			apiKey: "EUROUTER_API_KEY",
			authHeader: true,
			models: [
				{
					id: "deepseek-v3",
					name: "DeepSeek V3 (DEBUG)",
					api: "openai-completions",
					provider: "eurouter",
					baseUrl: "https://api.eurouter.ai/api/v1",
					reasoning: false,
					input: ["text"],
					cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 },
					contextWindow: 128000,
					maxTokens: 16384,
					compat: { maxTokensField: "max_tokens" },
				},
			],
		});
		console.log("[eurouter] Provider registered with 1 model");
	} catch (e) {
		console.error("[eurouter] FAILED to register:", e);
	}
}
